-- Script de Migração: Correção de Permissões PostgreSQL
-- Execute este script em bancos de dados EXISTENTES para aplicar o Princípio do Menor Privilégio
-- 
-- ATENÇÃO: Este script remove privilégios excessivos do usuário da aplicação
-- Teste em ambiente de desenvolvimento antes de aplicar em produção!

-- Conectar ao banco de dados
\c ${POSTGRES_DB};

-- ============================================
-- ETAPA 1: REVOGAR PRIVILÉGIOS EXCESSIVOS
-- ============================================

-- Revogar privilégios excessivos no banco de dados
REVOKE ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} FROM ${POSTGRES_USER};

-- Revogar privilégios excessivos nos schemas
REVOKE ALL ON SCHEMA public FROM ${POSTGRES_USER};
REVOKE ALL ON SCHEMA system FROM ${POSTGRES_USER};

-- Revogar privilégios excessivos em tabelas
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM ${POSTGRES_USER};
REVOKE ALL ON ALL TABLES IN SCHEMA system FROM ${POSTGRES_USER};

-- Revogar privilégios excessivos em sequências
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM ${POSTGRES_USER};
REVOKE ALL ON ALL SEQUENCES IN SCHEMA system FROM ${POSTGRES_USER};

-- ============================================
-- ETAPA 2: APLICAR PRIVILÉGIOS MÍNIMOS
-- ============================================

-- Conceder permissão para conectar ao banco de dados
GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO ${POSTGRES_USER};

-- Conceder permissão de uso nos schemas
GRANT USAGE ON SCHEMA public TO ${POSTGRES_USER};
GRANT USAGE ON SCHEMA system TO ${POSTGRES_USER};

-- Conceder permissões específicas para tabelas existentes
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${POSTGRES_USER};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA system TO ${POSTGRES_USER};

-- Conceder permissões para sequências (necessário para campos SERIAL)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${POSTGRES_USER};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA system TO ${POSTGRES_USER};

-- ============================================
-- ETAPA 3: CONFIGURAR PRIVILÉGIOS PADRÃO
-- ============================================

-- Definir privilégios padrão para futuras tabelas criadas pelo TypeORM
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${POSTGRES_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA system GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${POSTGRES_USER};

-- Definir privilégios padrão para futuras sequências
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${POSTGRES_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA system GRANT USAGE, SELECT ON SEQUENCES TO ${POSTGRES_USER};

-- ============================================
-- ETAPA 4: VERIFICAÇÃO DAS PERMISSÕES
-- ============================================

-- Verificar permissões do usuário no banco de dados
SELECT 
    datname as database_name,
    grantee,
    privilege_type
FROM information_schema.table_privileges 
WHERE grantee = '${POSTGRES_USER}' 
    AND table_schema IN ('public', 'system')
ORDER BY table_schema, table_name;

-- Verificar permissões em schemas
SELECT 
    schema_name,
    grantee,
    privilege_type
FROM information_schema.usage_privileges 
WHERE grantee = '${POSTGRES_USER}' 
    AND object_type = 'SCHEMA';

-- Mensagem de sucesso
SELECT 'Migração de permissões concluída com sucesso! Privilégios aplicados seguindo o Princípio do Menor Privilégio.' as status;
