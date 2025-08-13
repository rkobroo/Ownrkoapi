
#!/bin/bash

echo "Installing Python dependencies for video downloading..."

# Install yt-dlp with multiple methods
echo "Installing yt-dlp..."
python3 -m pip install --user --upgrade yt-dlp || \
pip3 install --user --upgrade yt-dlp || \
python -m pip install --user --upgrade yt-dlp || \
echo "yt-dlp installation failed - will rely on RapidAPI"

# Add user bin to PATH
export PATH="$HOME/.local/bin:$PATH"

# Verify installation
if command -v yt-dlp &> /dev/null; then
    echo "yt-dlp successfully installed"
    yt-dlp --version
else
    echo "yt-dlp not found in PATH - using RapidAPI fallback"
fi

echo "Dependencies installation complete"
