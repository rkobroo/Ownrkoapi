const { execSync } = require('child_process');

console.log('=== Installing yt-dlp for SnapTube ===');
console.log('Environment:', process.env.NODE_ENV || 'development');

// Skip installation in development
if (process.env.NODE_ENV !== 'production') {
  console.log('Development environment - skipping yt-dlp installation');
  process.exit(0);
}

console.log('Production environment detected');

// Simple, robust installation approach
try {
  // First check if Python is available
  console.log('Checking Python availability...');
  const pythonVersion = execSync('python3 --version 2>&1', { encoding: 'utf8' });
  console.log('Python found:', pythonVersion.trim());
  
  // Install yt-dlp - try the simplest method first
  console.log('Installing yt-dlp with pip...');
  execSync('python3 -m pip install --user yt-dlp', { stdio: 'inherit' });
  
  // Verify installation
  console.log('Verifying yt-dlp installation...');
  const version = execSync('python3 -m yt_dlp --version', { encoding: 'utf8' });
  console.log('Success! yt-dlp version:', version.trim());
  
} catch (error) {
  console.log('Installation failed:', error.message);
  console.log('This is not critical - yt-dlp will be installed at runtime');
  // Don't exit with error - let the build continue
}

console.log('=== Build script completed ===');
