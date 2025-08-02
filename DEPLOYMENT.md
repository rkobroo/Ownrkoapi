# Vercel Deployment Guide

This guide will help you deploy the RKO API to Vercel successfully.

## Quick Deployment Steps

### 1. Prepare Your Repository

1. Create a new GitHub repository
2. Copy all files from this project to your repository
3. Ensure these files are included:
   - `vercel.json` (Vercel configuration)
   - `api/server.js` (Serverless function)
   - All `server/` and `client/` directories
   - `package.json`

### 2. Environment Variables Required

Set these in your Vercel dashboard under Settings > Environment Variables:

```
OPENAI_API_KEY=sk-your-openai-api-key-here
NODE_ENV=production
VERCEL=1
```

### 3. Deploy Options

#### Option A: GitHub Integration (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect the project type
6. Add environment variables
7. Click "Deploy"

#### Option B: Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (run from project root)
vercel

# Follow the prompts:
# ? Set up and deploy "rko-api"? [Y/n] y
# ? Which scope do you want to deploy to? [Your Account]
# ? Link to existing project? [y/N] n
# ? What's your project's name? rko-api
# ? In which directory is your code located? ./

# Add environment variables
vercel env add OPENAI_API_KEY
# Paste your OpenAI API key when prompted
```

### 4. Verify Deployment

After deployment, test your API:

```bash
# Replace YOUR_VERCEL_URL with your actual Vercel URL
curl "https://YOUR_VERCEL_URL.vercel.app/rko/alldl?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

### 5. Custom Domain Setup

1. Go to your Vercel project dashboard
2. Click "Settings" > "Domains"
3. Add your custom domain (e.g., `rko-api.rf.gd`)
4. Follow Vercel's DNS configuration instructions

## File Structure for Vercel

Your repository should have this structure:

```
your-repo/
├── api/
│   └── server.js          # Vercel serverless function
├── client/                # Frontend files
├── server/                # Backend source code
├── shared/                # Shared types
├── vercel.json           # Vercel config
├── package.json          # Dependencies
├── README.md
└── .gitignore
```

## Important Notes

### Vercel-Specific Considerations

1. **Serverless Functions**: The API runs as serverless functions, not a persistent server
2. **Cold Starts**: First request might be slower due to cold start
3. **Timeout**: Functions have a 10-second timeout on free plan (30s on paid plans)
4. **Memory**: Limited memory per function execution

### Database Considerations

- This project uses in-memory storage for rate limiting
- For production, consider using:
  - Vercel KV (Redis)
  - PlanetScale (MySQL)
  - Neon (PostgreSQL)

### OpenAI API Key

- Required for AI features (main points and summaries)
- Get your key from [platform.openai.com](https://platform.openai.com)
- Add billing information to OpenAI account for production use

## Troubleshooting

### Common Issues

#### 1. Environment Variables Not Working

```bash
# Check if variables are set correctly
vercel env ls

# Pull environment variables locally for testing
vercel env pull .env.local
```

#### 2. Import Errors

- Make sure all dependencies are in `package.json`
- Check that file paths are correct for serverless environment

#### 3. Function Timeout

- Optimize video extraction for faster response times
- Consider implementing caching for repeated requests

#### 4. CORS Issues

Add CORS headers if needed:

```javascript
// In api/server.js
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
```

### Monitoring

1. **Vercel Dashboard**: Monitor function executions, errors, and performance
2. **Logs**: Use `vercel logs` to view function logs
3. **Analytics**: Enable Vercel Analytics for usage insights

### Performance Tips

1. **Enable Edge Functions**: For better global performance
2. **Implement Caching**: Cache video metadata for popular videos
3. **Optimize Dependencies**: Remove unused packages to reduce bundle size
4. **Use CDN**: For static assets and thumbnails

## Cost Considerations

### Vercel Pricing

- **Hobby Plan**: Free (limited to 100GB bandwidth/month)
- **Pro Plan**: $20/month (1TB bandwidth)
- **Enterprise**: Custom pricing

### OpenAI Costs

- GPT-4o: ~$0.005 per request (varies by content length)
- Budget accordingly based on expected usage

## Production Checklist

- [ ] Environment variables configured
- [ ] OpenAI API key with billing enabled
- [ ] Custom domain configured
- [ ] Error monitoring set up
- [ ] Rate limiting tested
- [ ] Performance optimized
- [ ] Backup plan for API failures
- [ ] Documentation updated

## Support

If you encounter issues:

1. Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
2. Review function logs: `vercel logs`
3. Test locally first: `npm run dev`
4. Verify environment variables are set correctly