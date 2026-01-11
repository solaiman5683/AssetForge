# 🚀 Quick Start Guide - AssetForge Cloud

## What is AssetForge?

AssetForge is a **100% free online tool** for optimizing assets:

- 🖼️ **Images** - Compress, resize, convert formats, add watermarks
- 📄 **PDFs** - Merge, watermark
- 🎵 **Audio** - Convert formats, adjust bitrate
- ⚡ **SVG** - Minify for web
- 📝 **JSON** - Validate, minify, prettify

**No signup. No limits. No BS. Just optimization.**

---

## Local vs Cloud Version

### Local Version (Desktop Tool)

- Install via npm: `npm install -g assetforge`
- CLI commands for automation
- Process files offline
- No internet required
- See: [README.md](README.md)

### Cloud Version (This Version)

- Access via browser
- No installation needed
- Process files online
- Share with anyone
- Deploy your own instance!

---

## Deployment

### Deploy Your Own Instance (FREE)

**Why deploy your own?**

- Full control
- No rate limits (you set them)
- Customization
- Support your users/team

**Easiest Deploy - Render.com (1-Click):**

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/solaiman5683/AssetForge)

**Or follow the detailed guide**: [DEPLOY.md](DEPLOY.md)

**Other Free Options:**

- Railway.app
- Fly.io
- Google Cloud Run
- Oracle Cloud (always free)

---

## Usage

### Web Interface

1. **Open** the app in your browser
2. **Configure** options (width, quality, format, etc.)
3. **Drag & drop** files or click to browse
4. **Add files** to queue
5. **Click "Process All"**
6. **Download** optimized files

### API Usage (For Developers)

**Image Optimization:**

```bash
curl -X POST https://your-app.com/api/image \
  -F "file=@image.jpg" \
  -F "width=800" \
  -F "quality=80" \
  -F "format=webp" \
  --output optimized.webp
```

**With Watermark:**

```bash
curl -X POST https://your-app.com/api/image \
  -F "file=@image.jpg" \
  -F "watermark=© 2026 MyBrand" \
  -F "wm_position=southeast" \
  -F "wm_opacity=0.5" \
  --output branded.jpg
```

**Response Headers:**

```
X-Original-Bytes: 1048576
X-Result-Bytes: 245678
X-Bytes-Saved: 802898
X-Percent-Saved: 76.57
X-Result-Format: webp
```

**SVG Optimization:**

```bash
curl -X POST https://your-app.com/api/svg \
  -F "file=@logo.svg" \
  --output optimized.svg
```

**JSON Minification:**

```bash
curl -X POST https://your-app.com/api/json \
  -F "file=@data.json" \
  --output minified.json
```

**Audio Conversion:**

```bash
curl -X POST https://your-app.com/api/audio \
  -F "file=@audio.mp3" \
  -F "format=ogg" \
  -F "bitrate=128k" \
  --output audio.ogg
```

**Rate Limits:**

- Default: 50 requests per 15 minutes per IP
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`
- Customize via environment variables

---

## Configuration

### Environment Variables

```bash
# Server
PORT=5173                    # Server port
NODE_ENV=production          # Environment

# Limits
MAX_FILE_SIZE=50             # Max file size in MB
RATE_LIMIT_WINDOW=15         # Rate limit window in minutes
RATE_LIMIT_MAX=50            # Max requests per window

# Performance
NODE_OPTIONS=--max-old-space-size=512  # Memory limit
```

### Customization

**Update Branding:**

1. Edit `src/ui/index-cloud.html`
2. Change logo, tagline, colors
3. Update support/donation links

**Adjust Rate Limits:**

```javascript
// In server-cloud.js
const RATE_LIMIT_MAX = 100; // More generous
const RATE_LIMIT_WINDOW = 60; // 1 hour window
```

**Disable Specific Features:**

```javascript
// In server-cloud.js, comment out handlers:
// case "/api/audio": return await handleAudio(...);
```

---

## Monitoring

### Health Check

```bash
curl https://your-app.com/health
```

Response:

```json
{
	"status": "ok",
	"timestamp": "2026-01-10T12:00:00.000Z",
	"uptime": 3600,
	"memory": {
		"rss": 50331648,
		"heapTotal": 20971520,
		"heapUsed": 15728640,
		"external": 1048576
	},
	"rateLimitActive": 5
}
```

### Stats

```bash
curl https://your-app.com/stats
```

### Uptime Monitoring

Use [UptimeRobot](https://uptimerobot.com) (free):

1. Add monitor: `https://your-app.com/health`
2. Check interval: 5 minutes
3. Get alerts if down

---

## Performance Tips

### For Low Traffic (<1000 req/day)

- Render.com free tier is perfect
- Cold starts acceptable (30s)
- Use UptimeRobot to prevent sleep

### For Medium Traffic (1K-10K req/day)

- Upgrade to Render paid ($7/mo)
- Or use Cloud Run (scales better)
- Add Redis for rate limiting

### For High Traffic (>10K req/day)

- Use Cloud Run or AWS Lambda
- Add CDN (CloudFlare)
- Implement worker queues (BullMQ)
- Consider paid infrastructure

---

## Troubleshooting

### App Not Starting

**Check logs:**

```bash
# Render: View logs in dashboard
# Railway: `railway logs`
# Fly.io: `flyctl logs`
```

**Common issues:**

- Missing dependencies: Run `npm install`
- Port binding: Check `PORT` environment variable
- Memory limit: Increase `NODE_OPTIONS`

### Processing Failures

**Out of Memory:**

- Reduce concurrent processing
- Lower `MAX_FILE_SIZE`
- Increase memory allocation

**Slow Processing:**

- Enable parallel processing
- Use faster instance type
- Optimize Sharp settings

### Rate Limit Issues

**Too Strict:**

```env
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60
```

**Being Abused:**

```env
RATE_LIMIT_MAX=25
RATE_LIMIT_WINDOW=5
```

---

## Security

### Best Practices

✅ **Implemented:**

- File size limits
- File type validation
- Rate limiting
- Memory cleanup
- No file storage

✅ **Recommended:**

- Enable HTTPS (automatic on Render/Railway)
- Use CloudFlare for DDoS protection
- Implement API keys for programmatic access
- Add virus scanning for production

---

## Contributing

We welcome contributions!

**Ways to contribute:**

1. 🐛 Report bugs
2. 💡 Suggest features
3. 📝 Improve documentation
4. 🔧 Submit PRs
5. ⭐ Star the repo!

See: [CONTRIBUTING.md](docs/contributing.md)

---

## License

MIT License - Free for personal and commercial use!

See: [LICENSE](LICENSE)

---

## Support

### Free Support

- GitHub Issues: [Report bugs](https://github.com/solaiman5683/AssetForge/issues)
- Discussions: [Ask questions](https://github.com/solaiman5683/AssetForge/discussions)
- Documentation: [Read docs](./docs/)

### Paid Support

Not available yet. Coming soon for enterprises.

### Sponsor

Like this project? [Support development](SUPPORT.md) ❤️

---

## Roadmap

### Coming Soon

- [ ] Video processing
- [ ] Background removal
- [ ] Image upscaling (AI)
- [ ] User accounts (optional)
- [ ] API keys
- [ ] Webhooks
- [ ] WordPress plugin
- [ ] Browser extension

Vote on features: [GitHub Discussions](https://github.com/solaiman5683/AssetForge/discussions)

---

## Credits

Built with:

- [Sharp](https://sharp.pixelplumbing.com/) - Image processing
- [FFmpeg.wasm](https://ffmpegwasm.netlify.app/) - Audio processing
- [pdf-lib](https://pdf-lib.js.org/) - PDF manipulation
- [SVGO](https://github.com/svg/svgo) - SVG optimization

Inspired by:

- WinRAR's honor system
- The open-source community
- Frustration with paid-only tools

---

## Contact

- **Author**: Solaiman
- **Email**: solaiman@example.com
- **GitHub**: [@solaiman5683](https://github.com/solaiman5683)
- **Twitter**: @yourusername

---

**Made with ❤️ for the developer community**

_Star us on [GitHub](https://github.com/solaiman5683/AssetForge) if you find this useful!_
