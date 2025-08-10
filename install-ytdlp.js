const { execSync } = require('child_process');
const fs = require('fs');

console.log('=== Installing yt-dlp for SnapTube ===');

try {
  // Check if we're in production
  if (process.env.NODE_ENV === 'production') {
    console.log('Production environment detected');
    
    try {
      // Try to install yt-dlp using pip
      console.log('Installing yt-dlp...');
      execSync('pip3 install --user yt-dlp>=2025.7.21', { stdio: 'inherit' });
      
      // Verify installation
      console.log('Verifying yt-dlp installation...');
      const version = execSync('python3 -m yt_dlp --version', { encoding: 'utf8' });
      console.log('yt-dlp version:', version.trim());
      
    } catch (error) {
      console.log('pip3 installation failed, trying alternative methods...');
      
      try {
        // Try installing with python -m pip
        execSync('python3 -m pip install --user yt-dlp>=2025.7.21', { stdio: 'inherit' });
        const version = execSync('python3 -m yt_dlp --version', { encoding: 'utf8' });
        console.log('yt-dlp version:', version.trim());
      } catch (error2) {
        console.error('Failed to install yt-dlp:', error2.message);
        process.exit(1);
      }
    }
  } else {
    console.log('Development environment - skipping yt-dlp installation');
  }
} catch (error) {
  console.error('Installation script failed:', error.message);
  process.exit(1);
}

console.log('=== yt-dlp installation completed ===');