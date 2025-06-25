# 🚀 Click Hype Partners - Instalação Automática VPS

## Instalação Rápida (1 Comando)

```bash
curl -fsSL https://raw.githubusercontent.com/LuizBranco-ClickHype/click-hype-partners/main/install-auto.sh | bash
```

## Instalação com Configurações Personalizadas

```bash
APP_DOMAIN=partners.meusite.com \
ACME_EMAIL=admin@meusite.com \
curl -fsSL https://raw.githubusercontent.com/LuizBranco-ClickHype/click-hype-partners/main/install-auto.sh | bash
```

## Instalação Interativa (Modo Configuração)

```bash
curl -fsSL https://raw.githubusercontent.com/LuizBranco-ClickHype/click-hype-partners/main/install-auto.sh | bash -s -- --interactive
```

---

## 📋 Requisitos Mínimos

- **Sistema**: Ubuntu 20.04+, Debian 11+, CentOS 8+
- **RAM**: 2GB mínimo (4GB recomendado)
- **Disco**: 20GB livres
- **Usuário**: Acesso sudo (não root)
- **Portas**: 80, 443 livres

---

## ⚙️ Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `APP_DOMAIN` | Domínio principal | `partners.meusite.com` |
| `ACME_EMAIL` | Email para certificados SSL | `admin@meusite.com` |
| `ADMIN_EMAIL` | Email do administrador | `admin@meusite.com` |
| `ADMIN_PASSWORD` | Senha do admin (gerada se não definida) | `MinhaSenh@123` |

---

## 🎯 O que é Instalado

✅ **Backend NestJS** (API REST)  
✅ **Frontend Next.js** (Interface moderna)  
✅ **PostgreSQL** (Banco de dados)  
✅ **Traefik** (Proxy reverso + SSL automático)  
✅ **Redis** (Cache e sessões)  
✅ **Prometheus + Grafana** (Monitoramento)  
✅ **SSL Automático** (Let's Encrypt)  
✅ **Backup Automático** (Banco de dados)  

---

## 🔧 Após a Instalação

### Acessar o Sistema
- **URL Principal**: `https://SEU_DOMINIO`
- **Painel Admin**: `https://SEU_DOMINIO/admin`
- **Dashboard Traefik**: `https://traefik.SEU_DOMINIO`

### Comandos Úteis
```bash
# Ir para diretório do projeto
cd /opt/click-hype-partners

# Ver logs
docker compose logs -f

# Reiniciar serviços
docker compose restart

# Parar tudo
docker compose down

# Ver status
docker compose ps
```

### Backup Manual
```bash
# Fazer backup do banco
docker compose exec postgres pg_dump -U clickhype clickhype_partners > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker compose exec -T postgres psql -U clickhype clickhype_partners < backup_20240101.sql
```

---

## 🔒 Segurança

- **SSL/TLS**: Certificados automáticos Let's Encrypt
- **Firewall**: UFW configurado (apenas 80, 443, SSH)
- **Senhas**: Geradas automaticamente (32+ caracteres)
- **JWT**: Tokens seguros com expiração
- **Headers**: Segurança OWASP aplicada

---

## 🆘 Solução de Problemas

### Erro de Permissão
```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

### Serviços não Iniciam
```bash
# Verificar logs
docker compose logs backend
docker compose logs frontend
docker compose logs postgres
```

### Certificado SSL Falha
```bash
# Verificar configuração DNS
nslookup SEU_DOMINIO

# Verificar logs do Traefik
docker compose logs traefik
```

### Erro de Memória
```bash
# Verificar uso de memória
free -h
docker stats

# Adicionar swap se necessário
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 📞 Suporte

- **GitHub**: [Issues](https://github.com/LuizBranco-ClickHype/click-hype-partners/issues)
- **Documentação**: [Wiki](https://github.com/LuizBranco-ClickHype/click-hype-partners/wiki)
- **Email**: suporte@clickhype.com

---

## 🔄 Atualizações

```bash
# Atualizar para última versão
cd /opt/click-hype-partners
git pull
docker compose pull
docker compose up -d
```

---

*🚀 Click Hype Partners - Sistema completo para gestão de agências e parceiros* 