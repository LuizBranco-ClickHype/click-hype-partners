# 🚀 Click Hype SaaS - Plataforma Multi-Tenant

Uma plataforma SaaS completa para gerenciamento de parceiros comerciais, permitindo que revendedores gerenciem seus clientes, criem propostas e acompanhem faturamento e comissões.

## 📋 Funcionalidades

### Módulo Administrador (Super Admin)
- Dashboard com métricas globais
- Gestão completa de parceiros (CRUD)
- Configuração de comissões
- Monitoramento da plataforma
- Modo "Personificar" parceiro para suporte

### Portal do Parceiro
- Dashboard com métricas pessoais
- Gestão de clientes próprios
- Criação e gerenciamento de propostas
- Geração de PDF profissional
- Acompanhamento de faturamento e comissões
- Histórico de 6 meses em gráficos

### Características Técnicas
- ✅ Multi-tenant com isolamento total de dados
- ✅ Interface moderna com design responsivo
- ✅ Autenticação segura JWT
- ✅ Geração de PDF profissional
- ✅ Deploy automatizado com Docker
- ✅ SSL/HTTPS automático via Traefik
- ✅ Backup automatizado
- ✅ Monitoramento integrado

## 🏗️ Arquitetura

```
├── backend/           # API Node.js/Express
├── frontend/          # Interface React/Next.js
├── database/          # Scripts PostgreSQL
├── docker/           # Configurações Docker
├── scripts/          # Scripts de automação
└── docs/            # Documentação adicional
```

## 🚀 Instalação Rápida

### Método 1: Instalação Automatizada (Recomendado)

```bash
curl -fsSL https://raw.githubusercontent.com/seu-usuario/click-hype-saas/main/install.sh | bash
```

### Método 2: Instalação Manual

1. **Pré-requisitos:**
   - Docker e Docker Compose
   - Git
   - Domínio configurado

2. **Clone e Execute:**
   ```bash
   git clone https://github.com/seu-usuario/click-hype-saas.git
   cd click-hype-saas
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   docker-compose up -d
   ```

## ⚙️ Configuração

### Variáveis de Ambiente Principais

```env
# Domínio
DOMAIN=parceiros.suaempresa.com
ACME_EMAIL=seu@email.com

# Banco de Dados
DB_HOST=postgres
DB_PORT=5432
DB_NAME=clickhype
DB_USER=clickhype
DB_PASSWORD=senha_super_segura

# JWT
JWT_SECRET=sua_chave_jwt_super_secreta

# Admin Inicial
ADMIN_EMAIL=admin@suaempresa.com
ADMIN_PASSWORD=senha_inicial_admin

# SMTP (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu@email.com
SMTP_PASS=sua_senha_app
```

## 📊 Stack Tecnológica

- **Backend:** Node.js, Express.js, Prisma ORM
- **Frontend:** React, Next.js, Tailwind CSS
- **Banco:** PostgreSQL
- **Autenticação:** JWT
- **PDF:** Puppeteer
- **Orquestração:** Docker & Docker Compose
- **Proxy:** Traefik (SSL automático)
- **Monitoramento:** Prometheus + Grafana

## 🔒 Segurança

- Autenticação JWT com refresh tokens
- Isolamento multi-tenant por banco de dados
- HTTPS obrigatório em produção
- Rate limiting por IP
- Validação de entrada em todas as rotas
- Logs de auditoria completos

## 📈 Monitoramento

- Métricas de performance da aplicação
- Logs centralizados
- Backup automatizado diário
- Alertas via email/webhook
- Dashboard de saúde do sistema

## 🔧 Comandos Úteis

```bash
# Ver logs em tempo real
docker-compose logs -f

# Backup manual do banco
./scripts/backup.sh

# Restaurar backup
./scripts/restore.sh backup_file.sql

# Atualizar aplicação
./scripts/update.sh

# Monitoramento de saúde
./scripts/health-check.sh
```

## 📞 Suporte

Para dúvidas técnicas ou problemas:
1. Verifique os logs: `docker-compose logs`
2. Consulte a documentação completa em `/docs`
3. Abra uma issue no GitHub

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

🎯 **Click Hype SaaS** - Transformando o gerenciamento de parceiros comerciais 