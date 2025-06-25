#!/bin/bash

# Click Hype Partners - Script de Instalação da Fundação
# Versão: 1.0.0
# Descrição: Instala e configura a infraestrutura básica (Traefik + PostgreSQL)

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções auxiliares
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Banner de boas-vindas
show_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║               🚀 CLICK HYPE PARTNERS 🚀                      ║"
    echo "║                                                              ║"
    echo "║          Instalação da Fundação do Projeto v1.0.0           ║"
    echo "║                                                              ║"
    echo "║      Configurando: Traefik (Proxy) + PostgreSQL (DB)        ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Verificar se está rodando como root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        log_error "Este script não deve ser executado como root!"
        log_info "Execute como usuário normal: curl -fsSL URL_DO_SCRIPT | bash"
        exit 1
    fi
}

# Verificar sistema operacional
check_os() {
    log_info "Verificando sistema operacional..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/debian_version ]; then
            OS="debian"
            log_success "Sistema Debian/Ubuntu detectado"
        elif [ -f /etc/redhat-release ]; then
            OS="redhat"
            log_success "Sistema RedHat/CentOS detectado"
        else
            OS="linux"
            log_warning "Sistema Linux genérico detectado"
        fi
    else
        log_error "Sistema operacional não suportado: $OSTYPE"
        log_info "Este script é compatível apenas com Linux"
        exit 1
    fi
}

# Instalar dependências
install_dependencies() {
    log_info "Verificando e instalando dependências..."
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        log_warning "Docker não encontrado. Instalando..."
        if [ "$OS" = "debian" ]; then
            sudo apt-get update
            sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
            echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            sudo apt-get update
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io
        else
            log_error "Instalação automática do Docker não suportada para este sistema"
            log_info "Por favor, instale o Docker manualmente e execute o script novamente"
            exit 1
        fi
        
        # Adicionar usuário ao grupo docker
        sudo usermod -aG docker $USER
        log_success "Docker instalado com sucesso"
    else
        log_success "Docker já está instalado"
    fi
    
    # Verificar Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_warning "Docker Compose não encontrado. Instalando..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        log_success "Docker Compose instalado com sucesso"
    else
        log_success "Docker Compose já está instalado"
    fi
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        log_warning "Git não encontrado. Instalando..."
        if [ "$OS" = "debian" ]; then
            sudo apt-get update
            sudo apt-get install -y git
        else
            log_error "Instalação automática do Git não suportada para este sistema"
            exit 1
        fi
        log_success "Git instalado com sucesso"
    else
        log_success "Git já está instalado"
    fi
    
    # Verificar apache2-utils (para htpasswd)
    if ! command -v htpasswd &> /dev/null; then
        log_warning "htpasswd não encontrado. Instalando apache2-utils..."
        if [ "$OS" = "debian" ]; then
            sudo apt-get update
            sudo apt-get install -y apache2-utils
        else
            log_error "Instalação automática do apache2-utils não suportada"
            exit 1
        fi
        log_success "apache2-utils instalado com sucesso"
    else
        log_success "htpasswd já está disponível"
    fi
}

# Clonar ou atualizar repositório
setup_repository() {
    INSTALL_DIR="/opt/click-hype-partners"
    
    log_info "Configurando diretório de instalação..."
    
    if [ -d "$INSTALL_DIR" ]; then
        log_warning "Diretório $INSTALL_DIR já existe"
        read -p "Deseja atualizar a instalação existente? (y/N): " -r UPDATE
        if [[ $UPDATE =~ ^[Yy]$ ]]; then
            log_info "Atualizando instalação existente..."
            cd "$INSTALL_DIR"
            sudo git pull
        else
            log_info "Usando instalação existente..."
            cd "$INSTALL_DIR"
        fi
    else
        log_info "Criando diretório de instalação..."
        sudo mkdir -p "$INSTALL_DIR"
        sudo chown $USER:$USER "$INSTALL_DIR"
        
        # Copiar arquivos do diretório atual (assumindo que o script está no diretório do projeto)
        if [ -f "docker-compose.foundation.yml" ]; then
            log_info "Copiando arquivos do projeto..."
            cp -r . "$INSTALL_DIR/"
            cd "$INSTALL_DIR"
        else
            log_error "Arquivos do projeto não encontrados!"
            log_info "Certifique-se de que o script está sendo executado do diretório do projeto"
            exit 1
        fi
    fi
    
    log_success "Repositório configurado em $INSTALL_DIR"
}

# Coletar informações do usuário
collect_user_input() {
    log_info "Coletando informações de configuração..."
    echo
    
    # Domínio principal
    while [ -z "$APP_DOMAIN" ]; do
        read -p "📌 Digite o domínio principal da aplicação (ex: partners.meusite.com): " APP_DOMAIN
        if [ -z "$APP_DOMAIN" ]; then
            log_warning "Domínio é obrigatório!"
        fi
    done
    
    # Email para Let's Encrypt
    while [ -z "$TRAEFIK_ACME_EMAIL" ]; do
        read -p "📧 Digite seu email para o certificado SSL (Let's Encrypt): " TRAEFIK_ACME_EMAIL
        if [ -z "$TRAEFIK_ACME_EMAIL" ]; then
            log_warning "Email é obrigatório!"
        fi
    done
    
    # Usuário do dashboard
    while [ -z "$TRAEFIK_DASHBOARD_USER" ]; do
        read -p "👤 Digite um nome de usuário para o dashboard do Traefik: " TRAEFIK_DASHBOARD_USER
        if [ -z "$TRAEFIK_DASHBOARD_USER" ]; then
            log_warning "Usuário é obrigatório!"
        fi
    done
    
    # Senha do dashboard
    while [ -z "$TRAEFIK_DASHBOARD_PASSWORD" ]; do
        read -s -p "🔒 Digite uma senha para o dashboard do Traefik: " TRAEFIK_DASHBOARD_PASSWORD
        echo
        if [ -z "$TRAEFIK_DASHBOARD_PASSWORD" ]; then
            log_warning "Senha é obrigatória!"
        fi
    done
    
    echo
    log_success "Informações coletadas com sucesso!"
}

# Gerar senhas e hashes
generate_credentials() {
    log_info "Gerando credenciais de segurança..."
    
    # Gerar senha aleatória para PostgreSQL
    POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    
    # Gerar hash da senha do Traefik
    TRAEFIK_DASHBOARD_PASSWORD_HASHED=$(htpasswd -nbB "$TRAEFIK_DASHBOARD_USER" "$TRAEFIK_DASHBOARD_PASSWORD" | cut -d: -f2)
    
    log_success "Credenciais geradas com sucesso!"
}

# Criar arquivos de ambiente
create_env_files() {
    log_info "Criando arquivos de configuração..."
    
    # Criar diretórios se não existirem
    mkdir -p traefik postgres
    
    # Arquivo .env do Traefik
    cat > traefik/.env << EOF
# Traefik Configuration - Gerado automaticamente
TRAEFIK_ACME_EMAIL=$TRAEFIK_ACME_EMAIL
TRAEFIK_DASHBOARD_USER=$TRAEFIK_DASHBOARD_USER
TRAEFIK_DASHBOARD_PASSWORD_HASHED=$TRAEFIK_DASHBOARD_PASSWORD_HASHED
APP_DOMAIN=$APP_DOMAIN
EOF
    
    # Arquivo .env do PostgreSQL
    cat > postgres/.env << EOF
# PostgreSQL Configuration - Gerado automaticamente
POSTGRES_DB=clickhype_partners_db
POSTGRES_USER=clickhype_user
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
EOF
    
    log_success "Arquivos de configuração criados!"
}

# Configurar rede Docker
setup_docker_network() {
    log_info "Configurando rede Docker..."
    
    if ! docker network ls | grep -q "web"; then
        docker network create web
        log_success "Rede 'web' criada com sucesso!"
    else
        log_success "Rede 'web' já existe!"
    fi
}

# Inicializar serviços
start_services() {
    log_info "Iniciando serviços..."
    
    # Usar o docker-compose específico da fundação
    if [ -f "docker-compose.foundation.yml" ]; then
        docker-compose -f docker-compose.foundation.yml up -d
    else
        log_error "Arquivo docker-compose.foundation.yml não encontrado!"
        exit 1
    fi
    
    log_success "Serviços iniciados com sucesso!"
}

# Verificar status dos serviços
check_services_status() {
    log_info "Verificando status dos serviços..."
    
    sleep 10  # Aguardar inicialização
    
    # Verificar Traefik
    if docker ps | grep -q "clickhype_traefik"; then
        log_success "Traefik está rodando"
    else
        log_error "Traefik não está rodando"
        return 1
    fi
    
    # Verificar PostgreSQL
    if docker ps | grep -q "clickhype_postgres"; then
        log_success "PostgreSQL está rodando"
    else
        log_error "PostgreSQL não está rodando"
        return 1
    fi
    
    return 0
}

# Exibir informações finais
show_final_info() {
    echo
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║                    🎉 INSTALAÇÃO CONCLUÍDA! 🎉               ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${BLUE}📋 Informações importantes:${NC}"
    echo
    echo -e "${YELLOW}🌐 Dashboard do Traefik:${NC} https://traefik.$APP_DOMAIN"
    echo -e "${YELLOW}👤 Usuário do Dashboard:${NC} $TRAEFIK_DASHBOARD_USER"
    echo -e "${YELLOW}🔒 Senha do Dashboard:${NC} [informada durante a instalação]"
    echo
    echo -e "${YELLOW}🗄️ Banco de Dados PostgreSQL:${NC}"
    echo -e "   • Host: postgres (interno) / localhost:5432 (externo)"
    echo -e "   • Database: clickhype_partners_db"
    echo -e "   • Usuário: clickhype_user"
    echo -e "   • Senha: [salva em /opt/click-hype-partners/postgres/.env]"
    echo
    echo -e "${BLUE}📁 Diretório de instalação:${NC} /opt/click-hype-partners"
    echo
    echo -e "${BLUE}🔧 Comandos úteis:${NC}"
    echo -e "   • Ver logs: ${YELLOW}docker-compose -f docker-compose.foundation.yml logs -f${NC}"
    echo -e "   • Parar serviços: ${YELLOW}docker-compose -f docker-compose.foundation.yml down${NC}"
    echo -e "   • Reiniciar: ${YELLOW}docker-compose -f docker-compose.foundation.yml restart${NC}"
    echo
    echo -e "${GREEN}✨ A fundação do Click Hype Partners está pronta para receber a aplicação!${NC}"
    echo
}

# Função principal
main() {
    show_banner
    check_root
    check_os
    install_dependencies
    setup_repository
    collect_user_input
    generate_credentials
    create_env_files
    setup_docker_network
    start_services
    
    if check_services_status; then
        show_final_info
    else
        log_error "Alguns serviços falharam ao iniciar. Verifique os logs:"
        echo "docker-compose -f docker-compose.foundation.yml logs"
        exit 1
    fi
}

# Executar função principal
main "$@" 