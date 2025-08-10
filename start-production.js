const { spawn, execSync } = require('child_process');
const path = require('path');

console.log('=== SnapTube Production Startup ===');
console.log('Node.js version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'production');

function checkYtDlp() {
  try {
    console.log('Checking for yt-dlp...');
    const version = execSync('python3 -m yt_dlp --version', { encoding: 'utf8' });
    console.log('yt-dlp available:', version.trim());
    return true;
  } catch (error) {
    console.log('yt-dlp not available - will attempt installation at runtime if needed');
    return false;
  }
}

function startServer() {
  console.log('Starting SnapTube server...');
  
  const serverPath = path.join(__dirname, 'dist', 'index.js');
  console.log('Server path:', serverPath);
  
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
  
  return server;
}

// Main startup
try {
  // Check yt-dlp (non-blocking)
  checkYtDlp();
  
  // Start server
  startServer();
  
} catch (error) {
  console.error('Startup failed:', error);
  process.exit(1);
}
