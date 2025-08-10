#!/bin/bash
set -e

echo "=== SnapTube Build Script ==="
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Python version: $(python3 --version 2>/dev/null || echo 'Python3 not found')"

echo "Installing system dependencies..."
# Update package list and install required packages
sudo apt-get update -qq
sudo apt-get install -y python3 python3-pip python3-venv ffmpeg curl wget

echo "Creating Python virtual environment..."
python3 -m venv /opt/render/project/.venv
source /opt/render/project/.venv/bin/activate

echo "Installing yt-dlp in virtual environment..."
pip install --upgrade pip
pip install yt-dlp>=2025.7.21

echo "Verifying yt-dlp installation..."
python -m yt_dlp --version
which python
which yt-dlp

echo "Installing Node.js dependencies..."
npm ci --only=production

echo "Building the application..."
npm run build

echo "Build completed successfully!"
echo "Python path: $(which python)"
echo "yt-dlp version: $(python -m yt_dlp --version)"
