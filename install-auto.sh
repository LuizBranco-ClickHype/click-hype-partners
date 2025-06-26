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
readonly REPO_RAW_URL="https://raw.githubusercontent.com/LuizBranco-ClickHype/click-hype-partners/main"
readonly PROJECT_NAME="click-hype-partners"
readonly INSTALL_DIR="/opt/${PROJECT_NAME}"
readonly SERVICE_USER="clickhype"
readonly MIN_MEMORY_GB=2
readonly MIN_DISK_GB=20
readonly REQUIRED_PORTS=(80 443 3000 3001 5432 8080)

# Cores para output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m'

# Variáveis globais
INTERACTIVE_MODE=false
SKIP_DEPS=false
SKIP_FIREWALL=false
DRY_RUN=false

# Funções de log
log() { echo -e "${1}${2}${NC}" >&2; }
log_info() { log "$BLUE" "ℹ️  $1"; }
log_success() { log "$GREEN" "✅ $1"; }
log_warning() { log "$YELLOW" "⚠️  $1"; }
log_error() { log "$RED" "❌ $1"; }
log_header() { log "$PURPLE" "$1"; }

# Banner bonito
show_banner() {
    clear
    log_header "
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║    🚀 CLICK HYPE PARTNERS - AUTO INSTALADOR VPS v2.0.0 🚀               ║
║                                                                          ║
║    Sistema de Gestão para Agências e Partners                           ║
║    ✨ Instalação Zero-Config para Produção                              ║
║                                                                          ║
║    📦 Inclui: Next.js + NestJS + PostgreSQL + Traefik + SSL             ║
║    🔒 SSL Automático + Monitoramento + Backups + Logs                   ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
"
    echo
}

# Verificar argumentos
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

# Mostrar ajuda
show_help() {
    cat << EOF
Click Hype Partners - Auto Instalador VPS

INSTALAÇÃO RÁPIDA:
  curl -fsSL https://raw.githubusercontent.com/LuizBranco-ClickHype/click-hype-partners/main/install-auto.sh | bash

OPÇÕES:
  --interactive, -i     Modo interativo (pede configurações)
  --skip-deps          Pular instalação de dependências
  --skip-firewall      Pular configuração do firewall
  --dry-run            Apenas simular (não instalar)
  --help, -h           Mostrar esta ajuda

VARIÁVEIS DE AMBIENTE:
  APP_DOMAIN           Domínio principal (ex: partners.meusite.com)
  ACME_EMAIL           Email para certificados SSL
  DB_PASSWORD          Senha do banco (gerada automaticamente se não definida)
  JWT_SECRET           Secret JWT (gerado automaticamente se não definido)
  ADMIN_EMAIL          Email do admin inicial
  ADMIN_PASSWORD       Senha do admin inicial

EXEMPLOS:
  # Instalação com configurações
  APP_DOMAIN=partners.exemplo.com ACME_EMAIL=admin@exemplo.com \\
  curl -fsSL https://raw.githubusercontent.com/LuizBranco-ClickHype/click-hype-partners/main/install-auto.sh | bash

  # Modo interativo
  curl -fsSL https://raw.githubusercontent.com/LuizBranco-ClickHype/click-hype-partners/main/install-auto.sh | bash -s -- --interactive

EOF
}

# Verificar sistema
check_system() {
    log_info "Verificando sistema..."
    
    if [[ $EUID -eq 0 ]]; then
        log_error "Este script não deve ser executado como root!"
        exit 1
    fi

    if ! sudo -n true 2>/dev/null; then
        log_error "Este usuário precisa ter privilégios sudo!"
        exit 1
    fi

    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        log_error "Sistema não suportado: $OSTYPE"
        exit 1
    fi

    log_success "Sistema compatível ✓"
}

# Verificar recursos do sistema
check_resources() {
    log_info "Verificando recursos do sistema..."
    
    # Verificar memória
    local mem_gb=$(free -g | awk '/^Mem:/{print $2}')
    if [[ $mem_gb -lt $MIN_MEMORY_GB ]]; then
        log_warning "Memória RAM insuficiente: ${mem_gb}GB (mínimo: ${MIN_MEMORY_GB}GB)"
        log_info "O sistema pode ficar lento ou falhar sob carga."
        if [[ $INTERACTIVE_MODE == true ]]; then
            read -p "Continuar mesmo assim? (y/N): " -r
            [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
        fi
    else
        log_success "Memória RAM: ${mem_gb}GB ✓"
    fi
    
    # Verificar espaço em disco
    local disk_gb=$(df / | awk 'NR==2{print int($4/1024/1024)}')
    if [[ $disk_gb -lt $MIN_DISK_GB ]]; then
        log_error "Espaço em disco insuficiente: ${disk_gb}GB disponível (mínimo: ${MIN_DISK_GB}GB)"
        exit 1
    else
        log_success "Espaço em disco: ${disk_gb}GB disponível ✓"
    fi
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
    
    sudo apt update -qq
    sudo apt install -y \
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
    sudo usermod -aG docker $USER
    sudo systemctl enable docker
    sudo systemctl start docker
    log_success "Docker instalado ✓"
}

# Configurar firewall
setup_firewall() {
    if [[ $SKIP_FIREWALL == true ]]; then
        log_info "Pulando configuração do firewall..."
        return
    fi
    
    log_info "Configurando firewall..."
    
    sudo ufw --force reset
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    sudo ufw allow ssh
    
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    sudo ufw --force enable
    
    log_success "Firewall configurado ✓"
}

# Coletar configurações
collect_config() {
    log_info "Configurando ambiente..."
    
    if [[ -z "${APP_DOMAIN:-}" ]]; then
        if [[ $INTERACTIVE_MODE == true ]]; then
            read -p "🌐 Digite o domínio (ex: partners.meusite.com): " APP_DOMAIN
        else
            local public_ip=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")
            APP_DOMAIN="${public_ip}.nip.io"
            log_warning "Usando domínio: $APP_DOMAIN"
        fi
    fi
    
    if [[ -z "${ACME_EMAIL:-}" ]]; then
        if [[ $INTERACTIVE_MODE == true ]]; then
            read -p "📧 Digite seu email para SSL: " ACME_EMAIL
        else
            ACME_EMAIL="admin@${APP_DOMAIN}"
        fi
    fi
    
    DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 16 | tr -d "=+/")}"
    JWT_SECRET="${JWT_SECRET:-$(openssl rand -base64 32 | tr -d "=+/")}"
    ADMIN_EMAIL="${ADMIN_EMAIL:-admin@${APP_DOMAIN}}"
    ADMIN_PASSWORD="${ADMIN_PASSWORD:-$(openssl rand -base64 12 | tr -d "=+/")}"
    
    log_success "Configuração coletada ✓"
}

# Baixar e instalar projeto
install_project() {
    log_info "Baixando projeto..."
    
    sudo mkdir -p $INSTALL_DIR
    sudo chown $USER:$USER $INSTALL_DIR
    
    if [[ -d "$INSTALL_DIR/.git" ]]; then
        cd $INSTALL_DIR && git pull
    else
        git clone $REPO_URL $INSTALL_DIR
    fi
    
    cd $INSTALL_DIR
    
    # Criar .env
    cat > .env << EOF
NODE_ENV=production
APP_URL=https://${APP_DOMAIN}
DB_PASSWORD=${DB_PASSWORD}
JWT_SECRET=${JWT_SECRET}
TRAEFIK_ACME_EMAIL=${ACME_EMAIL}
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
EOF
    
    log_success "Projeto configurado ✓"
}

# Executar instalação
run_installation() {
    log_info "Iniciando serviços..."
    
    cd $INSTALL_DIR
    docker compose up -d
    
    log_info "Aguardando inicialização..."
    sleep 30
    
    log_success "Instalação concluída ✅"
}

# Exibir informações finais
show_final_info() {
    echo
    log_header "🎉 CLICK HYPE PARTNERS INSTALADO COM SUCESSO!"
    echo
    echo "🌐 URL: https://$APP_DOMAIN"
    echo "👤 Admin: $ADMIN_EMAIL"
    echo "🔑 Senha: $ADMIN_PASSWORD"
    echo "📁 Diretório: $INSTALL_DIR"
    echo
    echo "🔧 Comandos úteis:"
    echo "  docker compose logs -f    # Ver logs"
    echo "  docker compose restart    # Reiniciar"
    echo "  docker compose down       # Parar"
    echo
    log_warning "⚠️  Salve as credenciais em local seguro!"
}

# Função principal
main() {
    parse_args "$@"
    show_banner
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