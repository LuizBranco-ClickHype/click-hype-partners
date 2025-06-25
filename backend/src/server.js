const express = require('express');
const cors = require('cors');
const helmet = require('express-helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const expressWinston = require('express-winston');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { register } = require('prom-client');

// Importar configurações
require('dotenv').config();
const logger = require('./config/logger');
const { connectRedis } = require('./config/redis');
const { initializeDatabase } = require('./config/database');

// Importar middlewares
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const { validateRequest } = require('./middleware/validation');

// Importar rotas
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const partnerRoutes = require('./routes/partner');
const clientRoutes = require('./routes/client');
const proposalRoutes = require('./routes/proposal');
const dashboardRoutes = require('./routes/dashboard');
const publicRoutes = require('./routes/public');

// Configuração do Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Click Hype SaaS API',
      version: '1.0.0',
      description: 'API da plataforma SaaS Click Hype para gerenciamento de parceiros',
      license: {
        name: 'MIT',
        url: 'https://spdx.org/licenses/MIT.html',
      },
      contact: {
        name: 'Click Hype Team',
        email: 'suporte@clickhype.com',
      },
    },
    servers: [
      {
        url: process.env.FRONTEND_URL || 'http://localhost:3000',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Caminho para os arquivos com documentação da API
};

const specs = swaggerJsdoc(swaggerOptions);

// Inicializar aplicação Express
const app = express();
const PORT = process.env.PORT || 3001;

// ==============================================
// MIDDLEWARES DE SEGURANÇA
// ==============================================

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_REQUESTS) || 100, // Limite de requisições por IP
  message: {
    error: 'Muitas requisições deste IP, tente novamente em 15 minutos.',
  },
  standardHeaders: true, // Retorna headers rate limit no `RateLimit-*`
  legacyHeaders: false, // Desabilita headers `X-RateLimit-*`
});

// Aplicar rate limiting a todas as rotas
app.use('/api/', limiter);

// Helmet para cabeçalhos de segurança
app.use(helmet());

// Compressão gzip
app.use(compression());

// CORS
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ==============================================
// MIDDLEWARES DE PARSING
// ==============================================

// Parse JSON com limite de tamanho
app.use(express.json({ 
  limit: `${process.env.MAX_FILE_SIZE || 10}mb`,
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Parse URL encoded
app.use(express.urlencoded({ 
  extended: true,
  limit: `${process.env.MAX_FILE_SIZE || 10}mb`
}));

// ==============================================
// MIDDLEWARES DE LOGGING
// ==============================================

// Log de requisições HTTP
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: false,
  ignoreRoute: function (req, res) {
    // Ignora logs de health check e métricas
    return req.url === '/health' || req.url === '/metrics';
  }
}));

// ==============================================
// ROTAS PÚBLICAS
// ==============================================

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// Métricas do Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

// Documentação da API
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Click Hype SaaS API Documentation',
}));

// ==============================================
// ROTAS DA API
// ==============================================

// Rotas públicas (sem autenticação)
app.use('/api/public', publicRoutes);

// Rotas de autenticação
app.use('/api/auth', authRoutes);

// Aplicar middleware de autenticação para rotas protegidas
app.use('/api', authMiddleware);

// Rotas de administrador
app.use('/api/admin', adminRoutes);

// Rotas de parceiro
app.use('/api/partner', partnerRoutes);

// Rotas de cliente
app.use('/api/clients', clientRoutes);

// Rotas de propostas
app.use('/api/proposals', proposalRoutes);

// Rotas de dashboard
app.use('/api/dashboard', dashboardRoutes);

// ==============================================
// ROTA PARA ARQUIVOS ESTÁTICOS
// ==============================================

// Servir uploads e PDFs gerados
app.use('/uploads', express.static('uploads'));
app.use('/pdfs', express.static('pdfs'));

// ==============================================
// MIDDLEWARE DE ERRO 404
// ==============================================

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    message: `A rota ${req.originalUrl} não existe neste servidor.`,
    availableEndpoints: [
      '/health',
      '/metrics',
      '/docs',
      '/api/auth',
      '/api/admin',
      '/api/partner',
      '/api/clients',
      '/api/proposals',
      '/api/dashboard',
      '/api/public'
    ]
  });
});

// ==============================================
// MIDDLEWARE DE TRATAMENTO DE ERROS
// ==============================================

// Log de erros
app.use(expressWinston.errorLogger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP Error {{req.method}} {{req.url}} - {{err.message}}',
}));

// Handler de erros customizado
app.use(errorHandler);

// ==============================================
// INICIALIZAÇÃO DO SERVIDOR
// ==============================================

async function startServer() {
  try {
    // Inicializar conexões
    logger.info('🔧 Inicializando conexões...');
    
    // Conectar ao Redis
    await connectRedis();
    logger.info('✅ Redis conectado');

    // Inicializar banco de dados
    await initializeDatabase();
    logger.info('✅ Banco de dados inicializado');

    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Servidor rodando na porta ${PORT}`);
      logger.info(`📖 Documentação: http://localhost:${PORT}/docs`);
      logger.info(`🔍 Health Check: http://localhost:${PORT}/health`);
      logger.info(`📊 Métricas: http://localhost:${PORT}/metrics`);
      logger.info(`🌍 Ambiente: ${process.env.NODE_ENV}`);
    });

  } catch (error) {
    logger.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// ==============================================
// TRATAMENTO DE SINAIS DO SISTEMA
// ==============================================

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`📴 Recebido sinal ${signal}, iniciando shutdown graceful...`);
  
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  logger.error('❌ Erro não capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Promise rejeitada não tratada:', { reason, promise });
  process.exit(1);
});

// Iniciar servidor
startServer(); 