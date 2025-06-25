# 🔧 Guia de Operações - Click Hype Partners

## 📋 Índice

1. [Deploy em Produção](#deploy-em-produção)
2. [Backup e Restauração](#backup-e-restauração)
3. [Monitoramento](#monitoramento)
4. [Troubleshooting](#troubleshooting)
5. [Manutenção](#manutenção)
6. [Segurança](#segurança)
7. [Escalabilidade](#escalabilidade)

---

## 🚀 Deploy em Produção

### Pré-requisitos do Servidor

#### Especificações Mínimas
- **CPU**: 2 cores
- **RAM**: 4GB (Recomendado: 8GB)
- **Disco**: 50GB SSD
- **OS**: Ubuntu 20.04+ ou CentOS 8+
- **Rede**: Portas 80, 443, 22 abertas

#### Software Necessário
```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Git
sudo apt update && sudo apt install git -y
```

### Processo de Deploy

#### 1. Deploy Inicial

```bash
# 1. Conectar ao servidor
ssh user@seu-servidor.com

# 2. Clonar repositório
git clone <repository-url> /opt/clickhype-partners
cd /opt/clickhype-partners

# 3. Configurar ambiente
cp env.example .env
nano .env

# 4. Executar deploy
chmod +x install.sh
./install.sh

# 5. Verificar serviços
docker-compose ps
docker-compose logs -f
```

#### 2. Deploy de Atualização

```bash
# 1. Backup preventivo
./scripts/backup.sh

# 2. Atualizar código
git pull origin main

# 3. Verificar mudanças
git log --oneline -5

# 4. Atualizar serviços
docker-compose build
docker-compose up -d

# 5. Executar migrations (se necessário)
docker exec clickhype_backend npm run migration:run

# 6. Verificar deploy
curl -f https://api.seu-dominio.com/api/v1/health
```

#### 3. Deploy com Zero Downtime

```bash
# 1. Criar nova versão
docker-compose -f docker-compose.blue-green.yml up -d --scale backend=2

# 2. Verificar nova instância
docker exec clickhype_backend_2 curl -f http://localhost:3001/api/v1/health

# 3. Atualizar load balancer
# (Traefik faz isso automaticamente)

# 4. Remover instância antiga
docker-compose -f docker-compose.blue-green.yml stop backend_1
docker-compose -f docker-compose.blue-green.yml rm backend_1
```

### Rollback

#### Rollback de Código
```bash
# 1. Identificar commit anterior
git log --oneline -10

# 2. Fazer rollback
git reset --hard COMMIT_HASH

# 3. Rebuild e redeploy
docker-compose build
docker-compose up -d
```

#### Rollback de Banco de Dados
```bash
# 1. Parar aplicação
docker-compose stop backend

# 2. Restaurar backup
docker exec -i clickhype_postgres psql -U clickhype_user clickhype_partners_db < backup_YYYYMMDD.sql

# 3. Reverter migrations (se necessário)
docker exec clickhype_backend npm run migration:revert

# 4. Reiniciar aplicação
docker-compose start backend
```

---

## 💾 Backup e Restauração

### Backup Automatizado

#### Script de Backup (`scripts/backup.sh`)

```bash
#!/bin/bash

# Configurações
BACKUP_DIR="/opt/backups/clickhype"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup do banco de dados
echo "🗄️ Fazendo backup do banco de dados..."
docker exec clickhype_postgres pg_dump -U clickhype_user clickhype_partners_db > $BACKUP_DIR/db_backup_$DATE.sql

# Backup de arquivos de upload
echo "📁 Fazendo backup de arquivos..."
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz ./backend/uploads ./backend/pdfs

# Backup de configurações
echo "⚙️ Fazendo backup de configurações..."
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz .env docker-compose.yml traefik/

# Comprimir backup do banco
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Limpar backups antigos
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup concluído: $BACKUP_DIR"
```

#### Agendamento com Cron

```bash
# Editar crontab
crontab -e

# Adicionar linha para backup diário às 2h
0 2 * * * /opt/clickhype-partners/scripts/backup.sh >> /var/log/clickhype-backup.log 2>&1
```

### Restauração

#### Restaurar Banco de Dados

```bash
# 1. Parar aplicação
docker-compose stop backend

# 2. Criar backup atual (segurança)
docker exec clickhype_postgres pg_dump -U clickhype_user clickhype_partners_db > current_backup.sql

# 3. Restaurar backup
gunzip -c /opt/backups/clickhype/db_backup_YYYYMMDD_HHMMSS.sql.gz | docker exec -i clickhype_postgres psql -U clickhype_user clickhype_partners_db

# 4. Reiniciar aplicação
docker-compose start backend

# 5. Verificar integridade
docker exec clickhype_backend npm run migration:show
```

#### Restaurar Arquivos

```bash
# 1. Parar aplicação
docker-compose stop

# 2. Restaurar arquivos
cd /opt/clickhype-partners
tar -xzf /opt/backups/clickhype/files_backup_YYYYMMDD_HHMMSS.tar.gz

# 3. Restaurar configurações
tar -xzf /opt/backups/clickhype/config_backup_YYYYMMDD_HHMMSS.tar.gz

# 4. Reiniciar aplicação
docker-compose up -d
```

### Backup para Cloud

#### AWS S3

```bash
# Instalar AWS CLI
sudo apt install awscli

# Configurar credenciais
aws configure

# Script de sync
aws s3 sync /opt/backups/clickhype s3://clickhype-backups/$(date +%Y/%m)/
```

---

## 📊 Monitoramento

### Métricas Principais

#### Aplicação
- **Uptime**: Disponibilidade dos serviços
- **Response Time**: Tempo de resposta das APIs
- **Error Rate**: Taxa de erros 4xx/5xx
- **Throughput**: Requisições por segundo

#### Sistema
- **CPU Usage**: Uso de processador
- **Memory Usage**: Uso de memória
- **Disk Usage**: Uso de disco
- **Network I/O**: Tráfego de rede

#### Banco de Dados
- **Connection Count**: Número de conexões
- **Query Performance**: Performance das consultas
- **Lock Waits**: Esperas por locks
- **Cache Hit Rate**: Taxa de acerto do cache

### Dashboards Grafana

#### Dashboard Principal
```json
{
  "dashboard": {
    "title": "Click Hype Partners - Overview",
    "panels": [
      {
        "title": "API Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100",
            "legendFormat": "Error Rate %"
          }
        ]
      }
    ]
  }
}
```

### Alertas

#### Configuração de Alertas

```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@clickhype.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
- name: 'web.hook'
  email_configs:
  - to: 'admin@clickhype.com'
    subject: 'Click Hype Alert: {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      {{ end }}
```

#### Regras de Alerta

```yaml
# rules/alerts.yml
groups:
- name: clickhype.rules
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value }} requests per second"

  - alert: HighMemoryUsage
    expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage"
      description: "Memory usage is {{ $value | humanizePercentage }}"
```

---

## 🔍 Troubleshooting

### Problemas Comuns

#### 1. Container não inicia

**Sintomas:**
- Container em estado "Exited"
- Erro ao executar `docker-compose up`

**Diagnóstico:**
```bash
# Verificar logs
docker-compose logs [service-name]

# Verificar configuração
docker-compose config

# Verificar recursos
docker system df
```

**Soluções:**
```bash
# Reconstruir imagem
docker-compose build --no-cache [service-name]

# Limpar recursos
docker system prune -f

# Verificar variáveis de ambiente
docker-compose exec [service-name] env
```

#### 2. Erro de conexão com banco

**Sintomas:**
- "Connection refused" nos logs
- Timeout de conexão
- "Role does not exist"

**Diagnóstico:**
```bash
# Verificar status do PostgreSQL
docker-compose exec postgres pg_isready

# Verificar logs do banco
docker-compose logs postgres

# Testar conexão manual
docker-compose exec postgres psql -U clickhype_user -d clickhype_partners_db
```

**Soluções:**
```bash
# Reiniciar banco
docker-compose restart postgres

# Verificar credenciais
docker-compose exec postgres psql -U postgres -c "\du"

# Recriar usuário
docker-compose exec postgres psql -U postgres -c "CREATE USER clickhype_user WITH PASSWORD 'senha';"
```

#### 3. SSL/Certificado não funciona

**Sintomas:**
- "Certificate not found"
- "SSL handshake failed"
- Acesso apenas via HTTP

**Diagnóstico:**
```bash
# Verificar logs do Traefik
docker-compose logs traefik

# Verificar certificados
docker exec traefik ls -la /data/acme.json

# Testar SSL
curl -I https://seu-dominio.com
```

**Soluções:**
```bash
# Forçar renovação
docker-compose restart traefik

# Verificar DNS
nslookup seu-dominio.com

# Limpar certificados (último recurso)
docker exec traefik rm /data/acme.json
docker-compose restart traefik
```

#### 4. Performance degradada

**Sintomas:**
- Tempo de resposta alto
- Timeouts frequentes
- Alto uso de CPU/memória

**Diagnóstico:**
```bash
# Verificar recursos
docker stats

# Verificar logs de erro
docker-compose logs | grep -i error

# Verificar consultas lentas
docker exec clickhype_postgres psql -U clickhype_user -d clickhype_partners_db -c "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

**Soluções:**
```bash
# Aumentar recursos
# Editar docker-compose.yml:
# deploy:
#   resources:
#     limits:
#       memory: 2G
#       cpus: '1.0'

# Otimizar banco
docker exec clickhype_postgres psql -U clickhype_user -d clickhype_partners_db -c "VACUUM ANALYZE;"

# Limpar logs
docker system prune -f
```

### Scripts de Diagnóstico

#### Health Check Completo (`scripts/health-check.sh`)

```bash
#!/bin/bash

echo "🏥 Health Check - Click Hype Partners"
echo "======================================"

# Verificar containers
echo "📦 Containers:"
docker-compose ps

# Verificar conectividade
echo -e "\n🌐 Conectividade:"
curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:3000
curl -s -o /dev/null -w "Backend: %{http_code}\n" http://localhost:3001/api/v1/health

# Verificar banco de dados
echo -e "\n🗄️ Banco de Dados:"
docker exec clickhype_postgres pg_isready -U clickhype_user

# Verificar uso de recursos
echo -e "\n💻 Recursos:"
docker stats --no-stream

# Verificar logs de erro recentes
echo -e "\n🚨 Erros Recentes:"
docker-compose logs --since 1h | grep -i error | tail -5
```

---

## 🔧 Manutenção

### Tarefas Regulares

#### Diárias
- [ ] Verificar logs de erro
- [ ] Monitorar métricas de performance
- [ ] Verificar backups automatizados
- [ ] Revisar alertas

#### Semanais
- [ ] Analisar tendências de uso
- [ ] Verificar atualizações de segurança
- [ ] Limpar logs antigos
- [ ] Revisar capacidade de armazenamento

#### Mensais
- [ ] Atualizar dependências
- [ ] Revisar configurações de segurança
- [ ] Testar procedimentos de restore
- [ ] Analisar performance do banco

#### Trimestrais
- [ ] Revisar arquitetura
- [ ] Planejar escalabilidade
- [ ] Auditoria de segurança
- [ ] Atualização de documentação

### Scripts de Manutenção

#### Limpeza de Logs (`scripts/cleanup-logs.sh`)

```bash
#!/bin/bash

# Limpar logs do Docker
docker system prune -f

# Limpar logs da aplicação
find /opt/clickhype-partners/backend/logs -name "*.log" -mtime +7 -delete

# Limpar logs do sistema
sudo journalctl --vacuum-time=7d

echo "✅ Limpeza de logs concluída"
```

#### Atualização de Dependências (`scripts/update-deps.sh`)

```bash
#!/bin/bash

echo "📦 Atualizando dependências..."

# Backend
cd backend
npm audit fix
npm update

# Frontend
cd ../frontend
npm audit fix
npm update

# Rebuild containers
cd ..
docker-compose build

echo "✅ Dependências atualizadas"
```

---

## 🔒 Segurança

### Checklist de Segurança

#### Configuração do Servidor
- [ ] Firewall configurado (UFW/iptables)
- [ ] SSH com chave pública apenas
- [ ] Usuário não-root para aplicação
- [ ] Fail2ban instalado e configurado
- [ ] Atualizações automáticas de segurança

#### Aplicação
- [ ] Variáveis de ambiente seguras
- [ ] HTTPS obrigatório
- [ ] Headers de segurança configurados
- [ ] Rate limiting ativo
- [ ] Logs de auditoria habilitados

#### Banco de Dados
- [ ] Usuário com privilégios mínimos
- [ ] Conexões criptografadas
- [ ] Backup criptografado
- [ ] Logs de auditoria habilitados

### Procedimentos de Incidente

#### 1. Detecção de Incidente
```bash
# Verificar logs de segurança
sudo grep "Failed password" /var/log/auth.log

# Verificar conexões suspeitas
netstat -an | grep :22

# Verificar processos suspeitos
ps aux | grep -v grep
```

#### 2. Contenção
```bash
# Bloquear IP suspeito
sudo ufw deny from IP_SUSPEITO

# Parar serviços afetados
docker-compose stop [service-name]

# Isolar sistema
sudo iptables -A INPUT -j DROP
```

#### 3. Investigação
```bash
# Coletar logs
mkdir /tmp/incident-$(date +%Y%m%d)
cp /var/log/auth.log /tmp/incident-$(date +%Y%m%d)/
docker-compose logs > /tmp/incident-$(date +%Y%m%d)/docker.log
```

---

## 📈 Escalabilidade

### Monitoramento de Capacidade

#### Métricas Críticas
- **CPU**: > 70% por 15 min
- **Memória**: > 80% por 10 min
- **Disco**: > 85% usado
- **Conexões DB**: > 80% do limite

### Estratégias de Escalabilidade

#### Escala Vertical
```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2.0'
```

#### Escala Horizontal
```yaml
# docker-compose.scale.yml
services:
  backend:
    scale: 3
    
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
```

#### Otimização de Banco
```sql
-- Configurações PostgreSQL
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
SELECT pg_reload_conf();
```

---

## 📞 Suporte e Escalação

### Níveis de Suporte

#### Nível 1 - Suporte Básico
- Verificação de status
- Restart de serviços
- Consulta de logs básicos

#### Nível 2 - Suporte Avançado
- Diagnóstico de problemas
- Análise de performance
- Configuração de serviços

#### Nível 3 - Especialista
- Problemas complexos
- Mudanças arquiteturais
- Otimizações avançadas

### Contatos de Emergência

- **DevOps**: +55 11 99999-9999
- **Backend**: backend@clickhype.com
- **DBA**: dba@clickhype.com
- **Segurança**: security@clickhype.com

---

**📋 Última atualização**: 25/06/2025  
**👨‍💻 Mantido por**: Equipe DevOps Click Hype Partners 