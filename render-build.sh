#!/bin/bash
set -e

echo "Installing Python and yt-dlp..."
# Install Python 3 and pip if not available
if ! command -v python3 &> /dev/null; then
    apt-get update
    apt-get install -y python3 python3-pip ffmpeg
fi

# Install yt-dlp
pip3 install --user yt-dlp>=2025.7.21

# Verify yt-dlp installation
python3 -m yt_dlp --version

echo "Installing Node.js dependencies..."
npm ci

echo "Building the application..."
npm run build

echo "Build completed successfully!"
