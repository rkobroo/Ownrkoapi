#!/bin/bash

# Install Python dependencies if not already installed
if ! command -v yt-dlp &> /dev/null; then
    echo "Installing yt-dlp..."
    pip3 install yt-dlp>=2025.7.21
fi

# Start the Node.js application
echo "Starting SnapTube Video Downloader..."
exec npm start
