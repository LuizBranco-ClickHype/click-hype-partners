-- Script de inicialização do banco de dados Click Hype Partners
-- Este arquivo é executado automaticamente na primeira inicialização do PostgreSQL
--
-- SEGURANÇA: Este script implementa o "Princípio do Menor Privilégio"
-- O usuário da aplicação recebe apenas as permissões mínimas necessárias:
-- - CONNECT: Para conectar ao banco
-- - USAGE: Para usar os schemas
-- - SELECT, INSERT, UPDATE, DELETE: Para operações CRUD nas tabelas
-- - USAGE, SELECT: Para usar sequências (campos SERIAL)
-- 
-- REMOVIDO: GRANT ALL PRIVILEGES (alta vulnerabilidade de segurança)

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Criar usuário específico para a aplicação (caso não exista)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${POSTGRES_USER}') THEN
        CREATE USER ${POSTGRES_USER} WITH PASSWORD '${POSTGRES_PASSWORD}';
    END IF;
END
$$;

-- Garantir que o banco de dados existe
CREATE DATABASE IF NOT EXISTS ${POSTGRES_DB};

-- Conceder privilégios mínimos necessários ao usuário (Princípio do Menor Privilégio)
-- Permissão para conectar ao banco de dados
GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO ${POSTGRES_USER};

-- Conectar ao banco específico e criar estrutura básica
\c ${POSTGRES_DB};

-- Criar schema para multi-tenancy
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS system;

-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS system.config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir configurações iniciais
INSERT INTO system.config (key, value, description) VALUES 
    ('app_name', 'Click Hype Partners', 'Nome da aplicação'),
    ('app_version', '1.0.0', 'Versão da aplicação'),
    ('maintenance_mode', 'false', 'Modo de manutenção'),
    ('max_partners', '100', 'Número máximo de parceiros')
ON CONFLICT (key) DO NOTHING;

-- Conceder privilégios específicos nos schemas (Princípio do Menor Privilégio)
-- Permissão de uso nos schemas
GRANT USAGE ON SCHEMA public TO ${POSTGRES_USER};
GRANT USAGE ON SCHEMA system TO ${POSTGRES_USER};

-- Permissões específicas para tabelas existentes
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${POSTGRES_USER};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA system TO ${POSTGRES_USER};

-- Permissões para sequências (necessário para campos SERIAL/AUTO_INCREMENT)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${POSTGRES_USER};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA system TO ${POSTGRES_USER};

-- Definir privilégios padrão para futuras tabelas criadas pelo TypeORM
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${POSTGRES_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA system GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${POSTGRES_USER};

-- Definir privilégios padrão para futuras sequências
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${POSTGRES_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA system GRANT USAGE, SELECT ON SEQUENCES TO ${POSTGRES_USER};

-- Mensagem de sucesso
SELECT 'Banco de dados Click Hype Partners inicializado com sucesso!' as status; 