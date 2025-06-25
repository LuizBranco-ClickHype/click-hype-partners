const redis = require('redis');
const logger = require('./logger');

let redisClient;

/**
 * Configurações do Redis baseadas no ambiente
 */
const getRedisConfig = () => {
  const config = {
    socket: {
      host: process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      connectTimeout: 10000,
      lazyConnect: true,
    },
    password: process.env.REDIS_PASSWORD || undefined,
    database: parseInt(process.env.REDIS_DB) || 0,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    retryDelayOnClusterDown: 300,
    enableOfflineQueue: false,
  };

  // Configurações específicas para produção
  if (process.env.NODE_ENV === 'production') {
    config.socket.tls = process.env.REDIS_TLS === 'true';
  }

  return config;
};

/**
 * Conectar ao Redis
 */
async function connectRedis() {
  try {
    const config = getRedisConfig();
    
    redisClient = redis.createClient(config);

    // Event listeners
    redisClient.on('error', (error) => {
      logger.error('❌ Redis Error:', error);
    });

    redisClient.on('connect', () => {
      logger.info('🔌 Conectando ao Redis...');
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis conectado e pronto');
    });

    redisClient.on('end', () => {
      logger.info('🔌 Conexão Redis encerrada');
    });

    redisClient.on('reconnecting', () => {
      logger.info('🔄 Reconectando ao Redis...');
    });

    // Conectar
    await redisClient.connect();
    
    // Testar conexão
    await redisClient.ping();
    
    return redisClient;
  } catch (error) {
    logger.error('❌ Erro ao conectar ao Redis:', error);
    throw error;
  }
}

/**
 * Obter cliente Redis
 */
function getRedisClient() {
  if (!redisClient || !redisClient.isOpen) {
    throw new Error('Redis não está conectado. Chame connectRedis() primeiro.');
  }
  return redisClient;
}

/**
 * Fechar conexão Redis
 */
async function disconnectRedis() {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    logger.info('🔌 Desconectado do Redis');
  }
}

/**
 * Cache Helper - SET
 */
async function setCache(key, value, ttlSeconds = 3600) {
  try {
    const client = getRedisClient();
    const serializedValue = JSON.stringify(value);
    
    if (ttlSeconds > 0) {
      await client.setEx(key, ttlSeconds, serializedValue);
    } else {
      await client.set(key, serializedValue);
    }
    
    logger.debug(`📦 Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
  } catch (error) {
    logger.error(`❌ Erro ao definir cache ${key}:`, error);
    throw error;
  }
}

/**
 * Cache Helper - GET
 */
async function getCache(key) {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    
    if (value === null) {
      logger.debug(`📦 Cache MISS: ${key}`);
      return null;
    }
    
    logger.debug(`📦 Cache HIT: ${key}`);
    return JSON.parse(value);
  } catch (error) {
    logger.error(`❌ Erro ao obter cache ${key}:`, error);
    return null; // Retorna null em caso de erro para não quebrar a aplicação
  }
}

/**
 * Cache Helper - DELETE
 */
async function deleteCache(key) {
  try {
    const client = getRedisClient();
    const result = await client.del(key);
    
    logger.debug(`📦 Cache DELETE: ${key} (${result} chaves removidas)`);
    return result;
  } catch (error) {
    logger.error(`❌ Erro ao deletar cache ${key}:`, error);
    throw error;
  }
}

/**
 * Cache Helper - DELETE por padrão
 */
async function deleteCachePattern(pattern) {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    
    if (keys.length > 0) {
      const result = await client.del(keys);
      logger.debug(`📦 Cache DELETE PATTERN: ${pattern} (${result} chaves removidas)`);
      return result;
    }
    
    return 0;
  } catch (error) {
    logger.error(`❌ Erro ao deletar cache por padrão ${pattern}:`, error);
    throw error;
  }
}

/**
 * Session Helper - SET
 */
async function setSession(sessionId, data, ttlSeconds = 86400) { // 24 horas padrão
  const key = `session:${sessionId}`;
  return setCache(key, data, ttlSeconds);
}

/**
 * Session Helper - GET
 */
async function getSession(sessionId) {
  const key = `session:${sessionId}`;
  return getCache(key);
}

/**
 * Session Helper - DELETE
 */
async function deleteSession(sessionId) {
  const key = `session:${sessionId}`;
  return deleteCache(key);
}

/**
 * Rate Limiting Helper
 */
async function checkRateLimit(key, maxRequests, windowSeconds) {
  try {
    const client = getRedisClient();
    const current = await client.incr(key);
    
    if (current === 1) {
      await client.expire(key, windowSeconds);
    }
    
    const remaining = Math.max(0, maxRequests - current);
    const ttl = await client.ttl(key);
    
    return {
      allowed: current <= maxRequests,
      remaining,
      resetTime: Date.now() + (ttl * 1000),
      current
    };
  } catch (error) {
    logger.error(`❌ Erro no rate limiting ${key}:`, error);
    // Em caso de erro no Redis, permite a requisição
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: Date.now() + (windowSeconds * 1000),
      current: 1
    };
  }
}

/**
 * Verificar saúde do Redis
 */
async function checkRedisHealth() {
  try {
    const client = getRedisClient();
    const start = Date.now();
    await client.ping();
    const duration = Date.now() - start;
    
    return {
      status: 'healthy',
      responseTime: `${duration}ms`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('❌ Verificação de saúde do Redis falhou:', error);
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Obter estatísticas do Redis
 */
async function getRedisStats() {
  try {
    const client = getRedisClient();
    const info = await client.info();
    
    // Parsear informações básicas
    const lines = info.split('\r\n');
    const stats = {};
    
    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        stats[key] = value;
      }
    });
    
    return {
      version: stats.redis_version,
      uptime: stats.uptime_in_seconds,
      connectedClients: stats.connected_clients,
      usedMemory: stats.used_memory_human,
      totalCommandsProcessed: stats.total_commands_processed,
      keyspaceHits: stats.keyspace_hits,
      keyspaceMisses: stats.keyspace_misses,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('❌ Erro ao obter estatísticas do Redis:', error);
    throw error;
  }
}

module.exports = {
  connectRedis,
  getRedisClient,
  disconnectRedis,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  setSession,
  getSession,
  deleteSession,
  checkRateLimit,
  checkRedisHealth,
  getRedisStats
}; 