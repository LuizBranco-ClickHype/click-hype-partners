-- Script de Teste: Validação de Permissões PostgreSQL
-- Este script testa se as permissões foram aplicadas corretamente
-- Execute após aplicar as correções de segurança

-- Conectar ao banco de dados
\c ${POSTGRES_DB};

-- ============================================
-- TESTES DE PERMISSÕES PERMITIDAS
-- ============================================

-- Teste 1: Verificar conexão (deve funcionar)
SELECT 'Teste 1: Conexão ao banco - OK' as status;

-- Teste 2: Operações CRUD básicas (devem funcionar)
-- Criar tabela de teste temporária (como postgres admin)
CREATE TABLE IF NOT EXISTS test_permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conceder permissões na tabela de teste
GRANT SELECT, INSERT, UPDATE, DELETE ON test_permissions TO ${POSTGRES_USER};
GRANT USAGE, SELECT ON SEQUENCE test_permissions_id_seq TO ${POSTGRES_USER};

-- Testar como usuário da aplicação
SET ROLE ${POSTGRES_USER};

-- Teste 3: INSERT (deve funcionar)
INSERT INTO test_permissions (name) VALUES ('Teste INSERT');
SELECT 'Teste 3: INSERT - OK' as status WHERE (SELECT COUNT(*) FROM test_permissions WHERE name = 'Teste INSERT') > 0;

-- Teste 4: SELECT (deve funcionar)
SELECT 'Teste 4: SELECT - OK' as status WHERE (SELECT COUNT(*) FROM test_permissions) > 0;

-- Teste 5: UPDATE (deve funcionar)
UPDATE test_permissions SET name = 'Teste UPDATE' WHERE name = 'Teste INSERT';
SELECT 'Teste 5: UPDATE - OK' as status WHERE (SELECT COUNT(*) FROM test_permissions WHERE name = 'Teste UPDATE') > 0;

-- Teste 6: DELETE (deve funcionar)
DELETE FROM test_permissions WHERE name = 'Teste UPDATE';
SELECT 'Teste 6: DELETE - OK' as status WHERE (SELECT COUNT(*) FROM test_permissions WHERE name = 'Teste UPDATE') = 0;

-- Voltar para postgres admin
RESET ROLE;

-- ============================================
-- TESTES DE PERMISSÕES BLOQUEADAS
-- ============================================

-- Teste 7: Tentar operações que devem falhar
SET ROLE ${POSTGRES_USER};

-- Teste 7a: Criar tabela (deve falhar)
DO $$
BEGIN
    BEGIN
        EXECUTE 'CREATE TABLE test_blocked_table (id INT)';
        RAISE EXCEPTION 'ERRO: CREATE TABLE não deveria ter funcionado!';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Teste 7a: CREATE TABLE bloqueado - OK';
    END;
END $$;

-- Teste 7b: Dropar tabela (deve falhar)
DO $$
BEGIN
    BEGIN
        EXECUTE 'DROP TABLE test_permissions';
        RAISE EXCEPTION 'ERRO: DROP TABLE não deveria ter funcionado!';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Teste 7b: DROP TABLE bloqueado - OK';
    END;
END $$;

-- Teste 7c: Alterar estrutura (deve falhar)
DO $$
BEGIN
    BEGIN
        EXECUTE 'ALTER TABLE test_permissions ADD COLUMN test_col VARCHAR(50)';
        RAISE EXCEPTION 'ERRO: ALTER TABLE não deveria ter funcionado!';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Teste 7c: ALTER TABLE bloqueado - OK';
    END;
END $$;

-- Teste 7d: Criar índice (deve falhar)
DO $$
BEGIN
    BEGIN
        EXECUTE 'CREATE INDEX idx_test ON test_permissions (name)';
        RAISE EXCEPTION 'ERRO: CREATE INDEX não deveria ter funcionado!';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Teste 7d: CREATE INDEX bloqueado - OK';
    END;
END $$;

-- Teste 7e: Truncate (deve falhar)
DO $$
BEGIN
    BEGIN
        EXECUTE 'TRUNCATE TABLE test_permissions';
        RAISE EXCEPTION 'ERRO: TRUNCATE não deveria ter funcionado!';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Teste 7e: TRUNCATE bloqueado - OK';
    END;
END $$;

-- Voltar para postgres admin
RESET ROLE;

-- ============================================
-- RELATÓRIO FINAL DOS TESTES
-- ============================================

-- Verificar permissões atuais do usuário
SELECT 
    'RELATÓRIO DE PERMISSÕES' as secao,
    grantee as usuario,
    table_schema as schema,
    privilege_type as permissao
FROM information_schema.table_privileges 
WHERE grantee = '${POSTGRES_USER}' 
    AND table_schema IN ('public', 'system')
ORDER BY table_schema, privilege_type;

-- Verificar permissões em schemas
SELECT 
    'PERMISSÕES EM SCHEMAS' as secao,
    grantee as usuario,
    object_schema as schema,
    privilege_type as permissao
FROM information_schema.usage_privileges 
WHERE grantee = '${POSTGRES_USER}' 
    AND object_type = 'SCHEMA';

-- Limpar tabela de teste
DROP TABLE IF EXISTS test_permissions;

-- Resultado final
SELECT 
    'TESTE DE PERMISSÕES CONCLUÍDO' as status,
    'Permissões aplicadas seguindo o Princípio do Menor Privilégio' as resultado,
    'Operações CRUD: PERMITIDAS | Operações DDL: BLOQUEADAS' as resumo; 