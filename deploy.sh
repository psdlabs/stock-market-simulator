#!/bin/bash
set -e

# ============================================
# Stock Market Simulator - Full AWS EC2 Deploy
# Run this on a fresh Ubuntu 22.04/24.04 EC2
# Usage: curl -sSL <raw-github-url> | bash
#   or:  bash deploy.sh
# ============================================

APP_DIR="/home/ubuntu/stock-market-simulator"
REPO="https://github.com/psdlabs/stock-market-simulator.git"

echo "========================================="
echo "  Stock Market Simulator - AWS Deploy"
echo "========================================="

# 1. System update
echo "[1/6] Updating system packages..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# 2. Install Docker
echo "[2/6] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker ubuntu
    echo "  Docker installed."
else
    echo "  Docker already installed."
fi

# 3. Install Docker Compose plugin
echo "[3/6] Installing Docker Compose..."
if ! docker compose version &> /dev/null; then
    sudo apt-get install -y -qq docker-compose-plugin
    echo "  Docker Compose installed."
else
    echo "  Docker Compose already installed."
fi

# 4. Clone or pull repo
echo "[4/6] Setting up application..."
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    git pull origin master
    echo "  Repository updated."
else
    git clone "$REPO" "$APP_DIR"
    cd "$APP_DIR"
    echo "  Repository cloned."
fi

# 5. Build and run
echo "[5/6] Building and starting containers..."
sudo docker compose down 2>/dev/null || true
sudo docker compose build --no-cache
sudo docker compose up -d

# 6. Verify
echo "[6/6] Verifying deployment..."
sleep 5

if curl -s http://localhost/api/health | grep -q "ok"; then
    echo ""
    echo "========================================="
    echo "  DEPLOYMENT SUCCESSFUL!"
    echo "========================================="
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "<your-ec2-ip>")
    echo ""
    echo "  App URL:  http://$PUBLIC_IP"
    echo "  API:      http://$PUBLIC_IP/api/health"
    echo ""
    echo "  Containers running:"
    sudo docker compose ps
    echo ""
    echo "  Useful commands:"
    echo "    cd $APP_DIR"
    echo "    sudo docker compose logs -f    # View logs"
    echo "    sudo docker compose restart    # Restart app"
    echo "    bash deploy.sh                 # Redeploy latest"
    echo "========================================="
else
    echo ""
    echo "  WARNING: Health check failed."
    echo "  Check logs: sudo docker compose logs"
    echo ""
fi
