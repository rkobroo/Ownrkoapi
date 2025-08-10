const { spawn, execSync } = require('child_process');
const path = require('path');

console.log('=== SnapTube Production Startup ===');

async function ensureYtDlp() {
  try {
    // Check if yt-dlp is available
    console.log('Checking for yt-dlp...');
    execSync('python3 -m yt_dlp --version', { stdio: 'pipe' });
    console.log('yt-dlp is already available');
    return true;
  } catch (error) {
    console.log('yt-dlp not found, installing...');
    try {
      // Try to install yt-dlp
      execSync('python3 -m pip install --user yt-dlp>=2025.7.21', { stdio: 'inherit' });
      console.log('yt-dlp installed successfully');
      
      // Verify installation
      const version = execSync('python3 -m yt_dlp --version', { encoding: 'utf8' });
      console.log('yt-dlp version:', version.trim());
      return true;
    } catch (installError) {
      console.error('Failed to install yt-dlp:', installError.message);
      return false;
    }
  }
}

async function startServer() {
  console.log('Starting SnapTube server...');
  
  // Start the Node.js server
  const serverPath = path.join(__dirname, 'dist', 'index.js');
  const server = spawn('node', [serverPath], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  server.on('error', (error) => {
    console.error('Server failed to start:', error);
    process.exit(1);
  });
  
  server.on('close', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
  });
}

// Main startup sequence
(async () => {
  try {
    console.log('Node.js version:', process.version);
    console.log('Environment:', process.env.NODE_ENV);
    
    // Ensure yt-dlp is available
    const ytdlpAvailable = await ensureYtDlp();
    if (!ytdlpAvailable) {
      console.warn('Warning: yt-dlp installation failed. Video downloads may not work.');
    }
    
    // Start the server
    await startServer();
    
  } catch (error) {
    console.error('Startup failed:', error);
    process.exit(1);
  }
})();