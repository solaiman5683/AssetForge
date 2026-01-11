# 🚀 AssetForge Cloud Deployment Guide

## Quick Deploy Options (FREE)

### Option 1: Render.com (Recommended - Easiest)

**Why Render?**

- ✅ 750 hours/month FREE (24/7 uptime for 1 month)
- ✅ No credit card required
- ✅ Auto-deploy from GitHub
- ⚠️ Cold starts after 15min inactivity (30s startup)

**Steps:**

1. **Push to GitHub** (if not already):

   ```bash
   git add .
   git commit -m "Ready for cloud deployment"
   git push origin main
   ```

2. **Deploy to Render**:

   - Go to [render.com](https://render.com)
   - Click "Get Started for Free"
   - Connect your GitHub account
   - Click "New +" → "Web Service"
   - Select your `AssetForge` repository
   - Render will auto-detect `render.yaml` configuration
   - Click "Create Web Service"
   - Wait 2-5 minutes for build

3. **Your app is live!** 🎉
   - URL: `https://assetforge-xxxx.onrender.com`
   - Update Ko-fi link in `index-cloud.html`

**Custom Domain** (Optional):

- Add custom domain in Render dashboard (Settings → Custom Domains)
- Add CNAME record: `CNAME your-domain.com → assetforge-xxxx.onrender.com`

---

### Option 2: Railway.app

**Why Railway?**

- ✅ $5 free credit/month (good for ~100 hours)
- ✅ Very fast deployments
- ⚠️ Requires credit card after trial

**Steps:**

1. **Push to GitHub** (if not done)

2. **Deploy**:

   - Go to [railway.app](https://railway.app)
   - Click "Start a New Project"
   - Choose "Deploy from GitHub repo"
   - Select your AssetForge repo
   - Railway auto-detects Node.js
   - Click "Deploy"

3. **Configure** (if needed):

   ```bash
   # Railway auto-detects, but you can override:
   # Build Command: npm install
   # Start Command: node src/ui/server-cloud.js
   ```

4. **Get URL**:
   - Click "Settings" → "Generate Domain"
   - URL: `https://assetforge-production-xxxx.up.railway.app`

---

### Option 3: Fly.io

**Why Fly.io?**

- ✅ 3 VMs free forever
- ✅ Global edge network
- ✅ Good performance

**Steps:**

1. **Install Fly CLI**:

   ```bash
   # Windows (PowerShell as Admin)
   iwr https://fly.io/install.ps1 -useb | iex

   # Or using scoop
   scoop install flyctl
   ```

2. **Login & Launch**:

   ```bash
   flyctl auth login
   flyctl launch

   # Follow prompts:
   # - Name: assetforge
   # - Region: Choose closest (iad for US East)
   # - PostgreSQL: No
   # - Redis: No
   ```

3. **Deploy**:

   ```bash
   flyctl deploy
   ```

4. **Get URL**:
   - `https://assetforge.fly.dev`

---

### Option 4: Google Cloud Run (Advanced)

**Why Cloud Run?**

- ✅ 2 million requests/month free
- ✅ Scales to zero (no cost when idle)
- ⚠️ More complex setup

**Quick Steps**:

```bash
# Install gcloud CLI
# Then:
gcloud builds submit --tag gcr.io/PROJECT_ID/assetforge
gcloud run deploy assetforge --image gcr.io/PROJECT_ID/assetforge --platform managed --region us-central1 --allow-unauthenticated
```

---

## Configuration

### Environment Variables

All platforms support these:

```env
NODE_ENV=production
PORT=5173  # Auto-set by some platforms
MAX_FILE_SIZE=50  # MB - adjust based on your needs
RATE_LIMIT_WINDOW=15  # minutes
RATE_LIMIT_MAX=50  # requests per window
NODE_OPTIONS=--max-old-space-size=512  # Memory limit
```

**For Render**: Set in Dashboard → Environment → Environment Variables
**For Railway**: Set in Dashboard → Variables
**For Fly.io**: Add to `fly.toml` under `[env]` section

---

## Monitoring & Health

### Health Check Endpoint

```bash
curl https://your-app.com/health
```

Returns:

```json
{
  "status": "ok",
  "timestamp": "2026-01-10T...",
  "uptime": 3600,
  "memory": {...},
  "rateLimitActive": 5
}
```

### Stats Endpoint

```bash
curl https://your-app.com/stats
```

---

## Cost Breakdown

| Platform      | Free Tier   | Best For             |
| ------------- | ----------- | -------------------- |
| **Render**    | 750hrs/mo   | Most users (easiest) |
| **Railway**   | $5 credit   | Fast deployments     |
| **Fly.io**    | 3 VMs       | Global users         |
| **Cloud Run** | 2M requests | High traffic         |

**Recommendation**: Start with Render.com, switch to Cloud Run if traffic grows.

---

## Scaling Tips (When You Grow)

### When to Upgrade:

1. **Traffic > 10K requests/day**: Move to Cloud Run or upgrade Render
2. **Need faster processing**: Add workers (BullMQ + Redis)
3. **Storage needed**: Add R2/S3 for file history
4. **User accounts**: Add PostgreSQL database

### Upgrade Path:

```
Render Free → Render Paid ($7/mo) → Cloud Run → Custom VPS
```

---

## Custom Domain Setup

### 1. Buy Domain (Cheap options):

- Namecheap: ~$10/year
- Cloudflare Registrar: ~$9/year
- Porkbun: ~$8/year

### 2. Configure DNS:

**For Render**:

```
Type: CNAME
Name: @ or www
Value: assetforge-xxxx.onrender.com
```

**For Cloudflare** (recommended):

- Add site to Cloudflare (free)
- Use Cloudflare nameservers
- Add CNAME record
- Enable "Proxied" (orange cloud) for:
  - Free SSL
  - DDoS protection
  - Caching
  - CDN

---

## Monetization Setup

### Ko-fi Integration (Easiest)

1. Create account at [ko-fi.com](https://ko-fi.com)
2. Get your link: `https://ko-fi.com/yourusername`
3. Update in `src/ui/index-cloud.html`:
   ```html
   <a href="https://ko-fi.com/YOUR_USERNAME">Support Development</a>
   ```

### Buy Me a Coffee Alternative

1. Create account at [buymeacoffee.com](https://buymeacoffee.com)
2. Get link: `https://www.buymeacoffee.com/yourusername`
3. Update HTML

### Future: Stripe Integration

When ready for subscriptions:

```bash
npm install stripe
```

See `STRIPE_SETUP.md` (create when needed)

---

## Marketing Tips

### 1. Launch Platforms:

- [ ] ProductHunt
- [ ] Hacker News (Show HN)
- [ ] Reddit (r/webdev, r/web_design)
- [ ] Twitter/X (with demo GIF)
- [ ] Dev.to article

### 2. SEO:

- [ ] Submit sitemap to Google
- [ ] Add to AlternativeTo
- [ ] List on FreeStuffBot
- [ ] Post on IndieHackers

### 3. Growth Hacks:

- Add "Made with AssetForge" badge for users
- Create Chrome extension
- WordPress plugin
- API for developers

---

## Troubleshooting

### Cold Starts (Render)

**Problem**: App sleeps after 15 minutes, 30s to wake up
**Solutions**:

1. Use [UptimeRobot](https://uptimerobot.com) (free) to ping every 5 min
2. Upgrade to Render paid ($7/mo) for no cold starts
3. Accept it (most users won't notice)

### Out of Memory

**Problem**: Process crashes with OOM
**Solutions**:

1. Increase `NODE_OPTIONS=--max-old-space-size=1024`
2. Process files sequentially instead of parallel
3. Add memory cleanup after each request (already implemented)

### Rate Limit Too Strict

**Problem**: Users hitting limits
**Solutions**:

1. Increase `RATE_LIMIT_MAX=100` in env vars
2. Add IP whitelist for trusted users
3. Implement tiered limits (free vs supporters)

---

## Next Steps After Launch

1. **Get First Users**:

   - Share on Twitter/X with demo
   - Post on ProductHunt
   - Share in dev communities

2. **Gather Feedback**:

   - Add simple feedback form
   - Monitor errors with Sentry (free tier)
   - Track usage with privacy-friendly analytics

3. **Iterate**:

   - Fix bugs quickly
   - Add most requested features
   - Improve UI based on feedback

4. **Monetize** (optional):
   - Accept donations
   - Add "Pro" features later
   - Offer API access for $

---

## Need Help?

- GitHub Issues: https://github.com/solaiman5683/AssetForge/issues
- Email: solaiman@example.com
- Twitter: @yourusername

---

**Good luck with your launch! 🚀**

Remember: Start small, iterate fast, listen to users. You got this!
