# Use Node.js 20 with Python support for yt-dlp
FROM node:20-bullseye

# Install Python and pip for yt-dlp
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Create symbolic link for python command
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Install yt-dlp globally
RUN pip3 install --no-cache-dir --upgrade pip
RUN pip3 install --no-cache-dir yt-dlp>=2025.7.21

# Verify yt-dlp installation
RUN python3 -m yt_dlp --version
RUN yt-dlp --version

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start the application
CMD ["npm", "start"]
