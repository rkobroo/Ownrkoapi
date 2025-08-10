# Use Node 18 base image
FROM node:18

# Install Python & pip
RUN apt-get update && apt-get install -y python3 python3-pip

# Upgrade pip and install yt-dlp
RUN pip3 install --upgrade pip
RUN pip3 install yt-dlp

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the Node.js app
RUN npm run build

# Expose port (Render will override but good practice)
EXPOSE 10000

# Start the app
CMD ["npm", "start"]
