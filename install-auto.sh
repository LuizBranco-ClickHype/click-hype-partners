#!/bin/bash

# ==============================================
# Click Hype Partners - Auto Instalador VPS
# ==============================================
# 
# INSTALAÇÃO RÁPIDA (recomendada):
# curl -fsSL https://raw.githubusercontent.com/LuizBranco-ClickHype/click-hype-partners/main/install-auto.sh | bash
#
# INSTALAÇÃO COM CONFIGURAÇÕES INTERATIVAS:
# curl -fsSL https://raw.githubusercontent.com/LuizBranco-ClickHype/click-hype-partners/main/install-auto.sh | bash -s -- --interactive
#
# INSTALAÇÃO SILENCIOSA COM VARIÁVEIS:
# APP_DOMAIN=partners.meusite.com \
# ACME_EMAIL=admin@meusite.com \
# curl -fsSL https://raw.githubusercontent.com/LuizBranco-ClickHype/click-hype-partners/main/install-auto.sh | bash
#
# ==============================================

set -euo pipefail
IFS=$'\n\t'

# Configurações
readonly REPO_URL="https://github.com/LuizBranco-ClickHype/click-hype-partners.git"
readonly INSTALL_DIR="/opt/click-hype-partners"
readonly REQUIRED_PORTS=(80 443 5432 6379 3001 9090 3000)
readonly MIN_RAM_MB=2048
readonly MIN_DISK_GB=10

# Cores
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m' # No Color

# Variáveis globais
INTERACTIVE_MODE=false
SKIP_DEPS=false
SKIP_FIREWALL=false
DRY_RUN=false
SUDO_CMD="sudo"

# Funções de log
log_info() {
    echo -e "${BLUE}ℹ️  ${1}${NC}"
}

log_success() {
    echo -e "${GREEN}✅ ${1}${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  ${1}${NC}"
}

log_error() {
    echo -e "${RED}❌ ${1}${NC}"
}

log_header() {
    echo -e "${PURPLE}${1}${NC}"
}

# Banner
show_banner() {
    echo -e "${CYAN}"
    cat << 'EOF'
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║        🚀 CLICK HYPE PARTNERS - AUTO INSTALADOR VPS         ║
║                                                               ║
║     Sistema completo de gestão de parceiros empresariais     ║
║         Backend NestJS + Frontend Next.js + Docker          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Processar argumentos
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --interactive|-i)
                INTERACTIVE_MODE=true
                shift
                ;;
            --skip-deps)
                SKIP_DEPS=true
                shift
                ;;
            --skip-firewall)
                SKIP_FIREWALL=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Argumento desconhecido: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Ajuda
show_help() {
    cat << EOF
CLICK HYPE PARTNERS - Auto Instalador VPS

USO:
    $0 [OPÇÕES]

OPÇÕES:
    --interactive, -i     Modo interativo (solicita confirmações)
    --skip-deps          Pular instalação de dependências
    --skip-firewall      Pular configuração do firewall
    --dry-run            Simular instalação (não executar comandos)
    --help, -h           Mostrar esta ajuda

VARIÁVEIS DE AMBIENTE:
    APP_DOMAIN           Domínio da aplicação (ex: partners.meusite.com)
    ACME_EMAIL           Email para certificados SSL
    ADMIN_EMAIL          Email do administrador
    ADMIN_PASSWORD       Senha do administrador

EXEMPLOS:
    # Instalação rápida
    curl -fsSL https://raw.githubusercontent.com/LuizBranco-ClickHype/click-hype-partners/main/install-auto.sh | bash

    # Instalação interativa
    curl -fsSL https://raw.githubusercontent.com/LuizBranco-ClickHype/click-hype-partners/main/install-auto.sh | bash -s -- --interactive

    # Com domínio personalizado
    APP_DOMAIN=partners.meusite.com curl -fsSL https://raw.githubusercontent.com/LuizBranco-ClickHype/click-hype-partners/main/install-auto.sh | bash

EOF
}

# Mostrar informações pré-instalação
show_pre_install_info() {
    echo
    log_header "📋 INFORMAÇÕES PRÉ-INSTALAÇÃO"
    echo
    echo -e "${CYAN}🔧 O QUE SERÁ INSTALADO:${NC}"
    echo "   • Docker e Docker Compose"
    echo "   • Sistema Click Hype Partners completo"
    echo "   • Proxy reverso Traefik com SSL automático"
    echo "   • Banco PostgreSQL e cache Redis"
    echo "   • Monitoramento Prometheus + Grafana"
    echo "   • Firewall UFW configurado"
    echo
    echo -e "${CYAN}📁 DIRETÓRIOS CRIADOS:${NC}"
    echo "   • /opt/click-hype-partners (aplicação)"
    echo "   • Logs e dados em volumes Docker"
    echo
    echo -e "${CYAN}🌐 PORTAS UTILIZADAS:${NC}"
    echo "   • 80/443 (HTTP/HTTPS público)"
    echo "   • 5432 (PostgreSQL interno)"
    echo "   • 6379 (Redis interno)"
    echo "   • 3001 (Backend interno)"
    echo "   • 9090/3000 (Monitoramento interno)"
    echo
    echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
    echo "   • O processo pode demorar 5-15 minutos"
    echo "   • Mantenha a conexão de internet estável"
    echo "   • Salve as credenciais que serão exibidas"
    echo
    
    if [[ $INTERACTIVE_MODE == true ]]; then
        read -p "Deseja continuar com a instalação? (Y/n): " -r
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            log_error "Instalação cancelada pelo usuário"
            exit 0
        fi
    else
        log_warning "Instalação iniciará em 15 segundos. Pressione Ctrl+C para cancelar..."
        sleep 15
    fi
    
    echo
}

# Verificar sistema
check_system() {
    log_info "Verificando sistema..."
    
    # Verificar sistema operacional
    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        log_error "Sistema não suportado: $OSTYPE"
        exit 1
    fi
    
    # Verificar execução como root
    if [[ $EUID -eq 0 ]]; then
        log_warning "Executando como usuário root..."
        
        # Verificar se há usuários não-root disponíveis
        if getent passwd | grep -q ":/home/"; then
            log_warning "⚠️  Executando como root - use com cuidado!"
            if [[ $INTERACTIVE_MODE == true ]]; then
                read -p "Continuar como root pode ser inseguro. Confirma? (y/N): " -r
                [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
            fi
        fi
        
        # Definir comando sudo vazio para root
        SUDO_CMD=""
    else
        # Verificar se usuário tem sudo
        if ! sudo -n true 2>/dev/null; then
            log_error "Este usuário precisa ter privilégios sudo!"
            exit 1
        fi
        SUDO_CMD="sudo"
    fi

    log_success "Sistema compatível ✓"
}

# Verificar recursos
check_resources() {
    log_info "Verificando recursos do sistema..."
    
    # Verificar RAM
    local total_ram=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    if [[ $total_ram -lt $MIN_RAM_MB ]]; then
        log_warning "Memória RAM insuficiente: ${total_ram}MB (mínimo: ${MIN_RAM_MB}MB)"
        log_info "O sistema pode ficar lento ou falhar sob carga."
        if [[ $INTERACTIVE_MODE == true ]]; then
            read -p "Continuar mesmo assim? (y/N): " -r
            [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
        fi
    else
        log_success "Memória RAM: ${total_ram}MB ✓"
    fi
    
    # Verificar disco
    local available_disk=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
    if [[ $available_disk -lt $MIN_DISK_GB ]]; then
        log_error "Espaço em disco insuficiente: ${available_disk}GB (mínimo: ${MIN_DISK_GB}GB)"
        exit 1
    fi
    
    log_success "Espaço em disco: ${available_disk}GB disponível ✓"
}

# Verificar portas em uso
check_ports() {
    log_info "Verificando portas necessárias..."
    
    local ports_in_use=()
    for port in "${REQUIRED_PORTS[@]}"; do
        if ss -tlun | grep -q ":$port "; then
            ports_in_use+=($port)
        fi
    done
    
    if [[ ${#ports_in_use[@]} -gt 0 ]]; then
        log_warning "Portas em uso: ${ports_in_use[*]}"
        log_info "O instalador tentará configurar o sistema automaticamente."
        if [[ $INTERACTIVE_MODE == true ]]; then
            read -p "Continuar? (y/N): " -r
            [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
        fi
    else
        log_success "Todas as portas necessárias estão disponíveis ✓"
    fi
}

# Instalar dependências
install_dependencies() {
    if [[ $SKIP_DEPS == true ]]; then
        log_info "Pulando instalação de dependências..."
        return
    fi
    
    log_info "Instalando dependências do sistema..."
    
    $SUDO_CMD apt update -qq
    $SUDO_CMD apt install -y \
        curl wget git unzip jq bc \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        htop \
        ufw \
        fail2ban \
        logrotate
    
    log_success "Dependências instaladas ✓"
}

# Instalar Docker
install_docker() {
    if command -v docker &> /dev/null; then
        log_success "Docker já instalado ✓"
        return
    fi
    
    log_info "Instalando Docker..."
    curl -fsSL https://get.docker.com | sh
    $SUDO_CMD usermod -aG docker $USER
    $SUDO_CMD systemctl enable docker
    $SUDO_CMD systemctl start docker
    log_success "Docker instalado ✓"
}

# Configurar firewall
setup_firewall() {
    if [[ $SKIP_FIREWALL == true ]]; then
        log_info "Pulando configuração do firewall..."
        return
    fi
    
    log_info "Configurando firewall..."
    
    $SUDO_CMD ufw --force reset
    $SUDO_CMD ufw default deny incoming
    $SUDO_CMD ufw default allow outgoing
    
    $SUDO_CMD ufw allow ssh
    
    $SUDO_CMD ufw allow 80/tcp
    $SUDO_CMD ufw allow 443/tcp
    
    $SUDO_CMD ufw --force enable
    
    log_success "Firewall configurado ✓"
}

# Coletar configurações
collect_config() {
    log_info "Configurando ambiente..."
    echo
    log_header "📋 CONFIGURAÇÃO DO SISTEMA"
    echo
    
    # Sempre pedir domínio se não estiver definido
    if [[ -z "${APP_DOMAIN:-}" ]]; then
        local public_ip=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")
        local default_domain="${public_ip}.nip.io"
        
        echo -e "${CYAN}🌐 CONFIGURAÇÃO DE DOMÍNIO${NC}"
        echo "   O sistema precisa de um domínio para funcionar corretamente."
        echo "   Você pode usar seu próprio domínio ou o IP público com .nip.io"
        echo
        read -p "   Digite o domínio [ENTER para usar: $default_domain]: " APP_DOMAIN
        
        if [[ -z "$APP_DOMAIN" ]]; then
            APP_DOMAIN="$default_domain"
        fi
        
        log_info "Domínio configurado: $APP_DOMAIN"
        echo
    fi
    
    # Sempre pedir email se não estiver definido
    if [[ -z "${ACME_EMAIL:-}" ]]; then
        local default_email="admin@${APP_DOMAIN}"
        
        echo -e "${CYAN}📧 CONFIGURAÇÃO DE EMAIL${NC}"
        echo "   Email necessário para certificados SSL (Let's Encrypt)."
        echo "   Use um email válido para receber notificações importantes."
        echo
        read -p "   Digite seu email [ENTER para usar: $default_email]: " ACME_EMAIL
        
        if [[ -z "$ACME_EMAIL" ]]; then
            ACME_EMAIL="$default_email"
        fi
        
        log_info "Email configurado: $ACME_EMAIL"
        echo
    fi
    
    # Configurar credenciais de administrador
    if [[ -z "${ADMIN_EMAIL:-}" ]]; then
        local default_admin_email="admin@${APP_DOMAIN}"
        
        echo -e "${CYAN}👤 CONFIGURAÇÃO DO ADMINISTRADOR${NC}"
        echo "   Configure as credenciais do usuário administrador do sistema."
        echo
        read -p "   Email do admin [ENTER para usar: $default_admin_email]: " ADMIN_EMAIL
        
        if [[ -z "$ADMIN_EMAIL" ]]; then
            ADMIN_EMAIL="$default_admin_email"
        fi
    fi
    
    # Gerar senhas automaticamente
    DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 16 | tr -d "=+/")}"
    JWT_SECRET="${JWT_SECRET:-$(openssl rand -base64 32 | tr -d "=+/")}"
    ADMIN_PASSWORD="${ADMIN_PASSWORD:-$(openssl rand -base64 12 | tr -d "=+/")}"
    
    # Mostrar resumo da configuração
    echo -e "${GREEN}✅ RESUMO DA CONFIGURAÇÃO:${NC}"
    echo "   🌐 Domínio: $APP_DOMAIN"
    echo "   📧 Email SSL: $ACME_EMAIL"
    echo "   👤 Admin: $ADMIN_EMAIL"
    echo "   🔑 Senha Admin: $ADMIN_PASSWORD"
    echo
    
    if [[ $INTERACTIVE_MODE == true ]]; then
        read -p "Confirma essas configurações? (Y/n): " -r
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            log_error "Configuração cancelada pelo usuário"
            exit 1
        fi
    else
        log_warning "Aguarde 10 segundos para continuar ou pressione Ctrl+C para cancelar..."
        sleep 10
    fi
    
    log_success "Configuração coletada ✓"
}

# Baixar e instalar projeto
install_project() {
    log_info "Baixando projeto..."
    
    $SUDO_CMD mkdir -p $INSTALL_DIR
    if [[ $EUID -ne 0 ]]; then
        $SUDO_CMD chown $USER:$USER $INSTALL_DIR
    fi
    
    if [[ -d "$INSTALL_DIR/.git" ]]; then
        cd $INSTALL_DIR && git pull
    else
        git clone $REPO_URL $INSTALL_DIR
    fi
    
    cd $INSTALL_DIR
    
    # Gerar todas as variáveis necessárias
    DATABASE_PASSWORD="${DB_PASSWORD}"
    DATABASE_USER="clickhype_user"
    DATABASE_NAME="clickhype_partners_db"
    POSTGRES_PASSWORD="${DB_PASSWORD}"
    POSTGRES_USER="${DATABASE_USER}"
    POSTGRES_DB="${DATABASE_NAME}"
    REDIS_PASSWORD="$(openssl rand -base64 16 | tr -d "=+/")"
    JWT_REFRESH_SECRET="$(openssl rand -base64 32 | tr -d "=+/")"
    GRAFANA_PASSWORD="$(openssl rand -base64 16 | tr -d "=+/")"
    TRAEFIK_DASHBOARD_USER="admin"
    TRAEFIK_DASHBOARD_PASSWORD="$(openssl rand -base64 12 | tr -d "=+/")"
    TRAEFIK_DASHBOARD_PASSWORD_HASHED=$(echo "$TRAEFIK_DASHBOARD_PASSWORD" | openssl passwd -apr1 -stdin)
    
    # Criar .env completo
    cat > .env << EOF
# ==============================================
# CONFIGURAÇÕES PRINCIPAIS
# ==============================================
NODE_ENV=production
APP_DOMAIN=${APP_DOMAIN}
APP_URL=https://${APP_DOMAIN}
TRAEFIK_ACME_EMAIL=${ACME_EMAIL}

# ==============================================
# BANCO DE DADOS POSTGRESQL
# ==============================================
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=${DATABASE_USER}
DATABASE_PASSWORD=${DATABASE_PASSWORD}
DATABASE_NAME=${DATABASE_NAME}

# Compatibilidade com docker-compose
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=${POSTGRES_DB}

# ==============================================
# REDIS CACHE
# ==============================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}

# ==============================================
# AUTENTICAÇÃO JWT
# ==============================================
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRES_IN=24h

# ==============================================
# ADMINISTRADOR INICIAL
# ==============================================
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}

# ==============================================
# TRAEFIK DASHBOARD
# ==============================================
TRAEFIK_DASHBOARD_USER=${TRAEFIK_DASHBOARD_USER}
TRAEFIK_DASHBOARD_PASSWORD_HASHED=${TRAEFIK_DASHBOARD_PASSWORD_HASHED}

# ==============================================
# MONITORAMENTO - GRAFANA
# ==============================================
GRAFANA_USER=admin
GRAFANA_PASSWORD=${GRAFANA_PASSWORD}

# ==============================================
# CONFIGURAÇÕES ADICIONAIS
# ==============================================
PORT=3001
RATE_LIMIT_REQUESTS=100
SESSION_TIMEOUT=60
MAX_FILE_SIZE=10
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,gif,doc,docx
EOF
    
    log_success "Projeto configurado ✓"
}

# Executar instalação
run_installation() {
    log_info "Iniciando serviços..."
    
    cd $INSTALL_DIR
    
    # Verficar memória disponível
    local total_mem=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    
    if [[ $total_mem -lt 2048 ]]; then
        log_warning "Sistema com pouca RAM (${total_mem}MB). Iniciando serviços em etapas..."
        
        # Etapa 1: Infraestrutura básica
        log_info "🔄 Iniciando infraestrutura básica..."
        docker compose up -d traefik postgres redis
        sleep 20
        
        # Etapa 2: Backend
        log_info "🔄 Iniciando backend..."
        docker compose up -d backend
        sleep 30
        
        # Etapa 3: Frontend
        log_info "🔄 Iniciando frontend..."
        docker compose up -d frontend
        sleep 20
        
        # Etapa 4: Monitoramento (opcional para sistemas com pouca RAM)
        if [[ $total_mem -gt 1500 ]]; then
            log_info "🔄 Iniciando monitoramento..."
            docker compose up -d prometheus grafana
        else
            log_warning "Pulando monitoramento devido à pouca RAM disponível"
        fi
        
    else
        log_info "Sistema com RAM adequada. Iniciando todos os serviços..."
        docker compose up -d
    fi
    
    log_info "Aguardando inicialização completa..."
    sleep 45
    
    # Verificar se os serviços principais estão rodando
    if docker compose ps | grep -q "backend.*Up" && docker compose ps | grep -q "frontend.*Up"; then
        log_success "Instalação concluída ✅"
    else
        log_warning "Alguns serviços podem ainda estar inicializando..."
        log_info "Use 'docker compose logs -f' para acompanhar os logs"
    fi
}

# Exibir informações finais
show_final_info() {
    echo
    log_header "🎉 CLICK HYPE PARTNERS INSTALADO COM SUCESSO!"
    echo
    echo "🌐 ACESSO PRINCIPAL:"
    echo "  URL: https://$APP_DOMAIN"
    echo "  Admin: $ADMIN_EMAIL"
    echo "  Senha: $ADMIN_PASSWORD"
    echo
    echo "🔧 DASHBOARDS ADMINISTRATIVOS:"
    echo "  Traefik: https://$APP_DOMAIN/traefik/"
    echo "  Usuário: $TRAEFIK_DASHBOARD_USER"
    echo "  Senha: $TRAEFIK_DASHBOARD_PASSWORD"
    echo
    if docker compose ps | grep -q "grafana.*Up"; then
        echo "  Grafana: https://$APP_DOMAIN/grafana/"
        echo "  Usuário: admin"
        echo "  Senha: $GRAFANA_PASSWORD"
        echo
    fi
    echo "📁 DIRETÓRIO: $INSTALL_DIR"
    echo
    echo "🔧 COMANDOS ÚTEIS:"
    echo "  cd $INSTALL_DIR"
    echo "  docker compose logs -f              # Ver logs"
    echo "  docker compose restart              # Reiniciar"
    echo "  docker compose down                 # Parar"
    echo "  docker compose ps                   # Status"
    echo "  docker system prune -f              # Limpar espaço"
    echo
    echo "📋 ARQUIVO DE CREDENCIAIS:"
    echo "  cat $INSTALL_DIR/.env"
    echo
    log_warning "⚠️  IMPORTANTE: Salve TODAS as credenciais em local seguro!"
    
    # Salvar credenciais em arquivo
    cat > "$INSTALL_DIR/CREDENCIAIS.txt" << EOF
==============================================
CLICK HYPE PARTNERS - CREDENCIAIS
==============================================

🌐 ACESSO PRINCIPAL:
URL: https://$APP_DOMAIN
Admin: $ADMIN_EMAIL
Senha: $ADMIN_PASSWORD

🔧 TRAEFIK DASHBOARD:
URL: https://$APP_DOMAIN/traefik/
Usuário: $TRAEFIK_DASHBOARD_USER
Senha: $TRAEFIK_DASHBOARD_PASSWORD

📊 GRAFANA (se disponível):
URL: https://$APP_DOMAIN/grafana/
Usuário: admin
Senha: $GRAFANA_PASSWORD

📁 Diretório: $INSTALL_DIR
📅 Instalado em: $(date)

⚠️  MANTENHA ESTE ARQUIVO EM LOCAL SEGURO!
EOF
    
    echo "💾 Credenciais salvas em: $INSTALL_DIR/CREDENCIAIS.txt"
}

# Função principal
main() {
    parse_args "$@"
    show_banner
    show_pre_install_info
    check_system
    check_resources
    check_ports
    install_dependencies
    install_docker
    setup_firewall
    collect_config
    install_project
    run_installation
    show_final_info
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]:-}" == "${0}" ]] || [[ -z "${BASH_SOURCE[0]:-}" ]]; then
    main "$@"
fi