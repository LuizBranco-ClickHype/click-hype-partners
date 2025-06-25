#!/bin/bash

# ==============================================
# Click Hype SaaS - Instalador Automatizado
# ==============================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Função para imprimir com cores
print_color() {
    printf "${1}${2}${NC}\n"
}

# Função para imprimir cabeçalho
print_header() {
    echo ""
    print_color $PURPLE "=========================================="
    print_color $PURPLE "  🚀 CLICK HYPE SAAS INSTALLER"
    print_color $PURPLE "=========================================="
    echo ""
}

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para gerar senha segura
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Função para gerar JWT secret
generate_jwt_secret() {
    openssl rand -base64 64 | tr -d "=+/" | cut -c1-64
}

# Função para validar email
validate_email() {
    local email=$1
    if [[ $email =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Função para validar domínio
validate_domain() {
    local domain=$1
    if [[ $domain =~ ^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$ ]]; then
        return 0
    else
        return 1
    fi
}

# Função para verificar integridade de arquivos baixados
verify_file_integrity() {
    local file_path=$1
    local expected_hash=$2
    local description=$3
    
    if [[ ! -f "$file_path" ]]; then
        print_color $RED "❌ ERRO: Arquivo $file_path não encontrado!"
        return 1
    fi
    
    print_color $BLUE "🔍 Verificando integridade do $description..."
    
    # Calcula o hash SHA256 do arquivo baixado
    local calculated_hash=$(sha256sum "$file_path" | awk '{ print $1 }')
    
    # Compara os hashes
    if [[ "$calculated_hash" != "$expected_hash" ]]; then
        print_color $RED "❌ ERRO CRÍTICO: Checksum do $description não corresponde!"
        print_color $RED "   Esperado: $expected_hash"
        print_color $RED "   Calculado: $calculated_hash"
        print_color $RED "   O arquivo pode estar corrompido ou adulterado."
        print_color $YELLOW "   Removendo arquivo suspeito..."
        rm -f "$file_path"
        return 1
    fi
    
    print_color $GREEN "✅ Verificação de integridade do $description concluída com sucesso."
    return 0
}

# Função para download seguro com verificação de integridade
secure_download() {
    local url=$1
    local output_path=$2
    local expected_hash=$3
    local description=$4
    local max_retries=3
    local retry_count=0
    
    while [[ $retry_count -lt $max_retries ]]; do
        print_color $BLUE "📥 Baixando $description (tentativa $((retry_count + 1))/$max_retries)..."
        
        # Remove arquivo existente se houver
        rm -f "$output_path"
        
        # Faz o download
        if curl -fsSL "$url" -o "$output_path"; then
            # Verifica a integridade
            if verify_file_integrity "$output_path" "$expected_hash" "$description"; then
                return 0
            else
                print_color $YELLOW "⚠️ Falha na verificação de integridade. Tentando novamente..."
            fi
        else
            print_color $YELLOW "⚠️ Falha no download. Tentando novamente..."
        fi
        
        retry_count=$((retry_count + 1))
        sleep 2
    done
    
    print_color $RED "❌ ERRO: Falha ao baixar $description após $max_retries tentativas."
    print_color $RED "   Abortando a instalação por motivos de segurança."
    exit 1
}

# Função principal
main() {
    print_header
    
    print_color $BLUE "🔍 Verificando sistema..."
    
    # Verificar se é root
    if [[ $EUID -eq 0 ]]; then
        print_color $RED "❌ Este script não deve ser executado como root!"
        print_color $YELLOW "Por favor, execute com um usuário normal que tenha sudo."
        exit 1
    fi
    
    # Verificar se tem sudo
    if ! sudo -n true 2>/dev/null; then
        print_color $RED "❌ Este usuário precisa ter privilégios sudo!"
        exit 1
    fi
    
    # Verificar sistema operacional
    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        print_color $RED "❌ Este instalador funciona apenas em sistemas Linux!"
        exit 1
    fi
    
    # Atualizar sistema
    print_color $BLUE "📦 Atualizando sistema..."
    sudo apt update -qq
    sudo apt upgrade -y -qq
    
    # Instalar dependências básicas
    print_color $BLUE "🔧 Instalando dependências..."
    sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
    
    # Instalar Docker
    if ! command_exists docker; then
        print_color $BLUE "🐳 Instalando Docker..."
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt update -qq
        sudo apt install -y docker-ce docker-ce-cli containerd.io
        sudo usermod -aG docker $USER
        sudo systemctl enable docker
        sudo systemctl start docker
    else
        print_color $GREEN "✅ Docker já está instalado"
    fi
    
    # Instalar Docker Compose com verificação de integridade
    if ! command_exists docker-compose; then
        print_color $BLUE "🔧 Instalando Docker Compose..."
        
        # Definir versão e arquitetura
        DOCKER_COMPOSE_VERSION="v2.37.3"
        ARCH=$(uname -m)
        OS=$(uname -s)
        
        # Checksums oficiais para Docker Compose v2.37.3
        # Fonte: https://github.com/docker/compose/releases/tag/v2.37.3
        case "${OS}-${ARCH}" in
            "Linux-x86_64")
                EXPECTED_HASH="996801cd0c4e21125f7b07af58901fc2033e9f8dfb486f0d8dd283a59647e88c"
                ;;
            "Linux-aarch64")
                EXPECTED_HASH="15646d01e9291e69c9173a0d140d3ef44f912d26ffb2cbeeaf91aeb460dae59e"
                ;;
            "Darwin-x86_64")
                EXPECTED_HASH="996801cd0c4e21125f7b07af58901fc2033e9f8dfb486f0d8dd283a59647e88c"
                ;;
            "Darwin-arm64")
                EXPECTED_HASH="5ad39f8157d638e14d7953e48c333d978305b84b080e571f64563afd4d2ce696"
                ;;
            *)
                print_color $RED "❌ Arquitetura não suportada: ${OS}-${ARCH}"
                print_color $YELLOW "Arquiteturas suportadas: Linux-x86_64, Linux-aarch64, Darwin-x86_64, Darwin-arm64"
                exit 1
                ;;
        esac
        
        # URL de download
        DOCKER_COMPOSE_URL="https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-${OS}-${ARCH}"
        TEMP_FILE="/tmp/docker-compose-${DOCKER_COMPOSE_VERSION}"
        
        # Download seguro com verificação de integridade
        secure_download "$DOCKER_COMPOSE_URL" "$TEMP_FILE" "$EXPECTED_HASH" "Docker Compose $DOCKER_COMPOSE_VERSION"
        
        # Instalar o binário verificado
        sudo mv "$TEMP_FILE" /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        
        print_color $GREEN "✅ Docker Compose $DOCKER_COMPOSE_VERSION instalado com sucesso e verificado!"
    else
        print_color $GREEN "✅ Docker Compose já está instalado"
    fi
    
    # Criar diretório de instalação
    INSTALL_DIR="/opt/click-hype-saas"
    print_color $BLUE "📁 Criando diretório de instalação: $INSTALL_DIR"
    sudo mkdir -p $INSTALL_DIR
    sudo chown $USER:$USER $INSTALL_DIR
    
    # Clonar repositório
    print_color $BLUE "📥 Baixando código fonte..."
    if [ -d "$INSTALL_DIR/.git" ]; then
        cd $INSTALL_DIR
        git pull origin main
    else
        git clone https://github.com/seu-usuario/click-hype-saas.git $INSTALL_DIR
        cd $INSTALL_DIR
    fi
    
    # Configuração interativa
    print_color $PURPLE "🎯 CONFIGURAÇÃO INICIAL"
    echo ""
    
    # Domínio
    while true; do
        printf "${YELLOW}🌐 Qual o domínio principal? (ex: parceiros.suaempresa.com): ${NC}"
        read DOMAIN
        if validate_domain "$DOMAIN"; then
            break
        else
            print_color $RED "❌ Domínio inválido! Tente novamente."
        fi
    done
    
    # Email para SSL
    while true; do
        printf "${YELLOW}📧 Seu email para certificados SSL (Let's Encrypt): ${NC}"
        read TRAEFIK_ACME_EMAIL
        if validate_email "$TRAEFIK_ACME_EMAIL"; then
            break
        else
            print_color $RED "❌ Email inválido! Tente novamente."
        fi
    done
    
    # Admin email
    while true; do
        printf "${YELLOW}👤 Email do administrador: ${NC}"
        read ADMIN_EMAIL
        if validate_email "$ADMIN_EMAIL"; then
            break
        else
            print_color $RED "❌ Email inválido! Tente novamente."
        fi
    done
    
    # Admin password
    while true; do
        printf "${YELLOW}🔑 Senha do administrador (min 8 caracteres): ${NC}"
        read -s ADMIN_PASSWORD
        echo ""
        if [[ ${#ADMIN_PASSWORD} -ge 8 ]]; then
            printf "${YELLOW}🔑 Confirme a senha: ${NC}"
            read -s ADMIN_PASSWORD_CONFIRM
            echo ""
            if [[ "$ADMIN_PASSWORD" == "$ADMIN_PASSWORD_CONFIRM" ]]; then
                break
            else
                print_color $RED "❌ Senhas não coincidem! Tente novamente."
            fi
        else
            print_color $RED "❌ Senha deve ter pelo menos 8 caracteres!"
        fi
    done
    
    # Configuração do Traefik Dashboard
    printf "${YELLOW}🔧 Configurar dashboard do Traefik? (y/n): ${NC}"
    read -n 1 -r REPLY
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        printf "${YELLOW}👤 Usuário do dashboard Traefik (padrão: admin): ${NC}"
        read TRAEFIK_USER
        TRAEFIK_USER=${TRAEFIK_USER:-admin}
        
        while true; do
            printf "${YELLOW}🔑 Senha do dashboard Traefik (min 8 caracteres): ${NC}"
            read -s TRAEFIK_PASSWORD
            echo ""
            if [[ ${#TRAEFIK_PASSWORD} -ge 8 ]]; then
                break
            else
                print_color $RED "❌ Senha deve ter pelo menos 8 caracteres!"
            fi
        done
        
        # Gerar hash da senha do Traefik
        TRAEFIK_PASSWORD_HASHED=$(openssl passwd -apr1 "$TRAEFIK_PASSWORD")
    else
        TRAEFIK_USER="admin"
        TRAEFIK_PASSWORD="admin123"
        TRAEFIK_PASSWORD_HASHED=$(openssl passwd -apr1 "$TRAEFIK_PASSWORD")
    fi
    
    # Configurações SMTP (opcional)
    printf "${YELLOW}📬 Configurar SMTP para emails? (y/n): ${NC}"
    read -n 1 -r REPLY
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        printf "${YELLOW}🏠 Host SMTP (ex: smtp.gmail.com): ${NC}"
        read SMTP_HOST
        printf "${YELLOW}🔌 Porta SMTP (ex: 587): ${NC}"
        read SMTP_PORT
        printf "${YELLOW}👤 Usuário SMTP: ${NC}"
        read SMTP_USER
        printf "${YELLOW}🔑 Senha SMTP: ${NC}"
        read -s SMTP_PASS
        echo ""
    else
        SMTP_HOST=""
        SMTP_PORT=""
        SMTP_USER=""
        SMTP_PASS=""
    fi
    
    # Gerar senhas seguras
    print_color $BLUE "🔐 Gerando senhas seguras..."
    DB_PASSWORD=$(generate_password)
    REDIS_PASSWORD=$(generate_password)
    JWT_SECRET=$(generate_jwt_secret)
    JWT_REFRESH_SECRET=$(generate_jwt_secret)
    GRAFANA_PASSWORD=$(generate_password)
    
    # Criar arquivo .env
    print_color $BLUE "⚙️ Criando arquivo de configuração..."
    cat > .env << EOF
# Configurações principais
APP_DOMAIN=$DOMAIN
TRAEFIK_ACME_EMAIL=$TRAEFIK_ACME_EMAIL

# Banco de dados
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=clickhype
POSTGRES_USER=clickhype_user
POSTGRES_PASSWORD=$DB_PASSWORD

# Redis
REDIS_PASSWORD=$REDIS_PASSWORD

# JWT
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET

# Admin inicial
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD

# SMTP
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS

# Monitoramento
GRAFANA_USER=admin
GRAFANA_PASSWORD=$GRAFANA_PASSWORD

# Desenvolvimento
NODE_ENV=production
PORT=3001
RATE_LIMIT_REQUESTS=100
SESSION_TIMEOUT=60
MAX_FILE_SIZE=10
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,gif,doc,docx
EOF

    # Criar arquivo .env específico para o Traefik
    print_color $BLUE "🔧 Criando configuração do Traefik..."
    mkdir -p traefik
    cat > traefik/.env << EOF
# Configurações do Traefik
TRAEFIK_ACME_EMAIL=$TRAEFIK_ACME_EMAIL
TRAEFIK_DASHBOARD_USER=$TRAEFIK_USER
TRAEFIK_DASHBOARD_PASSWORD_HASHED=$TRAEFIK_PASSWORD_HASHED
APP_DOMAIN=$DOMAIN
EOF
    
    # Criar diretórios necessários
    print_color $BLUE "📁 Criando estrutura de diretórios..."
    mkdir -p docker/traefik/letsencrypt
    mkdir -p database/backups
    mkdir -p backend/uploads
    mkdir -p backend/pdfs
    
    # Configurar permissões
    chmod 600 docker/traefik/letsencrypt
    
    # Configurar firewall
    print_color $BLUE "🔥 Configurando firewall..."
    sudo ufw --force enable
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw allow 8080/tcp
    
    # Iniciar aplicação
    print_color $BLUE "🚀 Iniciando aplicação..."
    docker-compose up -d
    
    # Aguardar inicialização
    print_color $BLUE "⏳ Aguardando inicialização (60 segundos)..."
    sleep 60
    
    # Verificar status
    print_color $BLUE "🔍 Verificando status dos serviços..."
    docker-compose ps
    
    # Sucesso
    print_color $GREEN "✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
    echo ""
    print_color $PURPLE "🎉 INFORMAÇÕES DE ACESSO:"
    echo ""
    print_color $BLUE "🌐 URL Principal: https://$DOMAIN"
    print_color $BLUE "📊 Grafana: https://grafana.$DOMAIN"
    print_color $BLUE "📈 Prometheus: https://prometheus.$DOMAIN"
    print_color $BLUE "🔧 Traefik Dashboard: http://$DOMAIN:8080"
    echo ""
    print_color $BLUE "👤 Admin Login:"
    print_color $BLUE "   Email: $ADMIN_EMAIL"
    print_color $BLUE "   Senha: $ADMIN_PASSWORD"
    echo ""
    print_color $BLUE "📊 Grafana Login:"
    print_color $BLUE "   Usuário: admin"
    print_color $BLUE "   Senha: $GRAFANA_PASSWORD"
    echo ""
    print_color $YELLOW "⚠️  IMPORTANTE:"
    print_color $YELLOW "   - Anote as senhas em local seguro"
    print_color $YELLOW "   - Configure seu DNS para apontar para este servidor"
    print_color $YELLOW "   - Aguarde alguns minutos para os certificados SSL"
    print_color $YELLOW "   - Faça logout e login novamente para aplicar grupos Docker"
    echo ""
    print_color $GREEN "🎯 Click Hype SaaS está pronto para uso!"
    echo ""
    
    # Salvar informações importantes
    cat > /tmp/click-hype-info.txt << EOF
==============================================
CLICK HYPE SAAS - INFORMAÇÕES DE INSTALAÇÃO
==============================================

URL Principal: https://$DOMAIN
Grafana: https://grafana.$DOMAIN
Prometheus: https://prometheus.$DOMAIN
Traefik: http://$DOMAIN:8080

Admin Login:
  Email: $ADMIN_EMAIL
  Senha: $ADMIN_PASSWORD

Grafana Login:
  Usuário: admin
  Senha: $GRAFANA_PASSWORD

Diretório de Instalação: $INSTALL_DIR

Comandos Úteis:
  Ver logs: cd $INSTALL_DIR && docker-compose logs -f
  Parar: cd $INSTALL_DIR && docker-compose down
  Iniciar: cd $INSTALL_DIR && docker-compose up -d
  Backup: cd $INSTALL_DIR && ./scripts/backup.sh

==============================================
EOF
    
    print_color $BLUE "📋 Informações salvas em: /tmp/click-hype-info.txt"
}

# Executar instalação
main "$@" 