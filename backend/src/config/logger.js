const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Definir formato personalizado
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Adicionar stack trace se for erro
    if (stack) {
      log += `\n${stack}`;
    }
    
    // Adicionar metadados se existirem
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Configuração para desenvolvimento
const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  customFormat
);

// Configuração para produção
const productionFormat = winston.format.combine(
  customFormat,
  winston.format.json()
);

// Criar diretório de logs se não existir
const logDir = path.join(process.cwd(), 'logs');

// Transports para arquivos com rotação diária
const fileRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: productionFormat
});

const errorFileRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
  format: productionFormat
});

// Configurar transports baseado no ambiente
const transports = [];

// Console sempre presente
transports.push(
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
    format: process.env.NODE_ENV === 'development' ? developmentFormat : productionFormat
  })
);

// Arquivos apenas em produção ou se especificamente solicitado
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGGING === 'true') {
  transports.push(fileRotateTransport);
  transports.push(errorFileRotateTransport);
}

// Criar logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  format: productionFormat,
  defaultMeta: { 
    service: 'click-hype-saas',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports,
  // Não sair em caso de erro
  exitOnError: false,
  // Tratar exceções não capturadas
  exceptionHandlers: [
    new winston.transports.Console({
      format: developmentFormat
    })
  ],
  // Tratar promises rejeitadas não tratadas
  rejectionHandlers: [
    new winston.transports.Console({
      format: developmentFormat
    })
  ]
});

// Eventos do logger
logger.on('error', (error) => {
  console.error('Logger error:', error);
});

fileRotateTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info(`Log rotacionado: ${oldFilename} -> ${newFilename}`);
});

// Função para logging de requisições HTTP
logger.logRequest = (req, res, duration) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id || 'anonymous'
  };

  const level = res.statusCode >= 400 ? 'warn' : 'info';
  logger.log(level, `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, logData);
};

// Função para logging de atividades de usuário
logger.logActivity = (userId, action, description, metadata = {}) => {
  logger.info(`User Activity: ${action}`, {
    userId,
    action,
    description,
    ...metadata,
    timestamp: new Date().toISOString()
  });
};

// Função para logging de erros de negócio
logger.logBusinessError = (error, context = {}) => {
  logger.error('Business Error', {
    message: error.message,
    stack: error.stack,
    ...context,
    timestamp: new Date().toISOString()
  });
};

// Função para logging de métricas
logger.logMetrics = (metrics) => {
  logger.info('Metrics', {
    ...metrics,
    timestamp: new Date().toISOString()
  });
};

// Função para logging de segurança
logger.logSecurity = (event, details = {}) => {
  logger.warn(`Security Event: ${event}`, {
    event,
    ...details,
    timestamp: new Date().toISOString()
  });
};

module.exports = logger; 