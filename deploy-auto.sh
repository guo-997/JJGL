#!/bin/bash

# NFC家庭物品管理系统 - 智能检测部署脚本
# 支持CentOS Stream 9

set -e  # 遇到错误时退出

# 配置变量
APP_NAME="nfc-home-manager"
PROJECT_DIR="/opt/${APP_NAME}"
GITHUB_REPO="https://github.com/guo-997/JJGL.git"
MYSQL_HOST="101.35.16.205"
MYSQL_PORT="13306"
MYSQL_USER="nfc_user"
MYSQL_PASS="Guo@112233"
MYSQL_DB="nfc_home_manager"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 错误处理函数
handle_error() {
    local exit_code=$?
    local line_number=$1
    log_error "脚本在第 ${line_number} 行出错，退出码: ${exit_code}"
    log_error "请检查上面的错误信息并修复问题后重新运行"
    exit $exit_code
}

# 设置错误陷阱
trap 'handle_error $LINENO' ERR

echo -e "${GREEN}🚀 NFC家庭物品管理系统 - 智能部署脚本${NC}"
echo "=================================================="

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    log_error "请使用root权限运行此脚本"
    exit 1
fi

# 1. 检测系统信息
log_info "检测系统信息..."
OS_VERSION=$(cat /etc/redhat-release 2>/dev/null || echo "Unknown")
echo "操作系统: $OS_VERSION"
echo "内核版本: $(uname -r)"
echo "架构: $(uname -m)"
echo ""

# 2. 检测必要软件
log_info "检测必要软件安装状态..."

check_software() {
    local software=$1
    local package_name=$2
    
    if command -v $software &> /dev/null; then
        local version=$($software --version 2>/dev/null | head -1 || echo "已安装")
        log_success "$software 已安装: $version"
        return 0
    else
        log_warning "$software 未安装"
        return 1
    fi
}

# 检测软件列表
MISSING_SOFTWARE=()

if ! check_software "git" "git"; then
    MISSING_SOFTWARE+=("git")
fi

if ! check_software "curl" "curl"; then
    MISSING_SOFTWARE+=("curl")
fi

if ! check_software "docker" "docker"; then
    MISSING_SOFTWARE+=("docker")
fi

# 检测docker-compose
DOCKER_COMPOSE_CMD=""
if docker compose version &> /dev/null; then
    log_success "docker compose 已安装"
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    log_success "docker-compose 已安装"
    DOCKER_COMPOSE_CMD="docker-compose"
elif [ -f "/usr/local/bin/docker-compose" ]; then
    log_success "docker-compose 已安装在 /usr/local/bin/"
    DOCKER_COMPOSE_CMD="/usr/local/bin/docker-compose"
else
    log_warning "docker-compose 未安装"
    MISSING_SOFTWARE+=("docker-compose")
fi

# 检测MySQL客户端
if ! check_software "mysql" "mysql"; then
    MISSING_SOFTWARE+=("mysql")
fi

echo ""

# 3. 安装缺失的软件
if [ ${#MISSING_SOFTWARE[@]} -gt 0 ]; then
    log_info "开始安装缺失的软件: ${MISSING_SOFTWARE[*]}"
    
    # 更新包管理器
    log_info "更新包管理器..."
    dnf update -y || {
        log_error "更新包管理器失败"
        exit 1
    }
    
    # 安装基础软件
    for software in "${MISSING_SOFTWARE[@]}"; do
        case $software in
            "git")
                log_info "安装 git..."
                dnf install -y git || {
                    log_error "安装 git 失败"
                    exit 1
                }
                ;;
            "curl")
                log_info "安装 curl..."
                dnf install -y curl || {
                    log_error "安装 curl 失败"
                    exit 1
                }
                ;;
            "docker")
                log_info "安装 docker..."
                dnf install -y docker || {
                    log_error "安装 docker 失败"
                    exit 1
                }
                systemctl enable docker
                systemctl start docker
                ;;
            "docker-compose")
                log_info "安装 docker-compose..."
                COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
                curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose || {
                    log_error "下载 docker-compose 失败"
                    exit 1
                }
                chmod +x /usr/local/bin/docker-compose
                DOCKER_COMPOSE_CMD="/usr/local/bin/docker-compose"
                ;;
            "mysql")
                log_info "安装 mysql 客户端..."
                dnf install -y mysql || {
                    log_warning "安装 mysql 失败，尝试安装 mariadb..."
                    dnf install -y mariadb || {
                        log_error "安装 MySQL 客户端失败"
                        exit 1
                    }
                }
                ;;
        esac
    done
    
    log_success "所有软件安装完成"
else
    log_success "所有必要软件都已安装"
fi

echo ""

# 4. 验证Docker服务
log_info "检查Docker服务状态..."
if ! systemctl is-active --quiet docker; then
    log_info "启动Docker服务..."
    systemctl start docker || {
        log_error "启动Docker服务失败"
        exit 1
    }
fi

if systemctl is-enabled --quiet docker; then
    log_success "Docker服务已设置为开机自启"
else
    log_info "设置Docker开机自启..."
    systemctl enable docker
fi

# 测试Docker
docker --version || {
    log_error "Docker安装验证失败"
    exit 1
}

log_success "Docker服务运行正常"
echo ""

# 5. 测试MySQL连接
log_info "测试MySQL数据库连接..."
if command -v mysql &> /dev/null; then
    if mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASS -e "SELECT 1;" &> /dev/null; then
        log_success "MySQL连接测试成功"
    else
        log_error "MySQL连接失败，请检查数据库配置:"
        echo "  主机: $MYSQL_HOST"
        echo "  端口: $MYSQL_PORT"
        echo "  用户: $MYSQL_USER"
        echo "  数据库: $MYSQL_DB"
        echo ""
        log_error "请确认数据库服务器正在运行并且网络连接正常"
        exit 1
    fi
else
    log_warning "MySQL客户端不可用，跳过连接测试"
fi

echo ""

# 6. 准备项目目录
log_info "准备项目目录..."
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 7. 克隆/更新项目代码
log_info "获取项目代码..."
if [ -d ".git" ]; then
    log_info "更新现有代码..."
    git pull || {
        log_error "更新代码失败"
        exit 1
    }
else
    log_info "克隆项目代码..."
    git clone $GITHUB_REPO . || {
        log_error "克隆代码失败，请检查网络连接和GitHub访问权限"
        exit 1
    }
fi

# 8. 准备Docker配置
log_info "准备Docker配置文件..."

if [ ! -f "docker-compose.prod.yml" ]; then
    log_error "找不到 docker-compose.prod.yml 文件"
    exit 1
fi

cp docker-compose.prod.yml docker-compose.yml
cp Dockerfile.prod Dockerfile
cp nginx.prod.conf nginx.conf

# 创建必要目录
mkdir -p uploads logs
chmod 755 uploads logs

log_success "Docker配置准备完成"
echo ""

# 9. 构建和启动应用
log_info "开始构建Docker镜像..."

# 停止现有容器（如果存在）
if $DOCKER_COMPOSE_CMD ps | grep -q "Up"; then
    log_info "停止现有容器..."
    $DOCKER_COMPOSE_CMD down
fi

# 构建镜像
log_info "构建Docker镜像（这可能需要几分钟）..."
$DOCKER_COMPOSE_CMD build --no-cache || {
    log_error "Docker镜像构建失败"
    exit 1
}

log_success "Docker镜像构建完成"

# 启动服务
log_info "启动应用服务..."
$DOCKER_COMPOSE_CMD up -d || {
    log_error "启动服务失败"
    exit 1
}

log_success "应用服务启动完成"
echo ""

# 10. 等待服务启动
log_info "等待服务启动完成（30秒）..."
sleep 30

# 11. 检查容器状态
log_info "检查容器运行状态..."
echo ""
$DOCKER_COMPOSE_CMD ps
echo ""

# 检查容器是否都在运行
if ! $DOCKER_COMPOSE_CMD ps | grep -q "Up"; then
    log_error "部分或全部容器启动失败"
    log_info "查看容器日志:"
    $DOCKER_COMPOSE_CMD logs
    exit 1
fi

log_success "所有容器运行正常"

# 12. 应用健康检查
log_info "进行应用健康检查..."

# 检查HTTP响应
for i in {1..5}; do
    if curl -f http://localhost/api/health &> /dev/null; then
        log_success "应用健康检查通过"
        break
    else
        if [ $i -eq 5 ]; then
            log_error "应用健康检查失败"
            log_info "查看应用日志:"
            $DOCKER_COMPOSE_CMD logs app
            exit 1
        else
            log_info "健康检查失败，重试中... ($i/5)"
            sleep 10
        fi
    fi
done

# 13. 配置防火墙
log_info "配置防火墙..."
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http &> /dev/null || true
    firewall-cmd --permanent --add-service=https &> /dev/null || true
    firewall-cmd --reload &> /dev/null || true
    log_success "防火墙配置完成"
else
    log_warning "firewall-cmd不可用，请手动开放80端口"
fi

echo ""
echo "=================================================="
log_success "🎉 部署完成！"
echo "=================================================="
echo ""
echo -e "${GREEN}📋 部署信息:${NC}"
echo "   应用名称: $APP_NAME"
echo "   项目目录: $PROJECT_DIR"
echo "   数据库: $MYSQL_DB@$MYSQL_HOST:$MYSQL_PORT"
echo ""
echo -e "${GREEN}🌐 访问地址:${NC}"
echo "   网站: http://101.35.16.205"
echo "   API健康检查: http://101.35.16.205/api/health"
echo ""
echo -e "${YELLOW}🔧 管理命令:${NC}"
echo "   查看状态: cd $PROJECT_DIR && $DOCKER_COMPOSE_CMD ps"
echo "   查看日志: cd $PROJECT_DIR && $DOCKER_COMPOSE_CMD logs"
echo "   重启服务: cd $PROJECT_DIR && $DOCKER_COMPOSE_CMD restart"
echo "   停止服务: cd $PROJECT_DIR && $DOCKER_COMPOSE_CMD down"
echo "   更新应用: cd $PROJECT_DIR && git pull && $DOCKER_COMPOSE_CMD up -d --build"
echo ""
echo -e "${GREEN}✅ 您现在可以访问 http://101.35.16.205 使用NFC家庭物品管理系统了！${NC}" 