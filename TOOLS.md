# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

## Current Setup for Pinpoint Painting App

### Brand Colors
Based on www.PinpointPainting.com:
- **Primary Dark:** #1e3a5f (Navy blue - logo, headers)
- **Primary Darker:** #0f172a (Darker navy - backgrounds)
- **Accent Blue:** #3b82f6 (Links, interactive)
- **Success:** #22c55e (Approved status)
- **Warning:** #f59e0b (Pending/Bronze)
- **Danger:** #dc2626 (Admin badges, errors)

### Twilio Credentials (Source: User provided 2026-02-05)
- **Account SID:** [REDACTED - see 1Password]
- **Verify Service SID:** [REDACTED - see 1Password]
- **Auth Token:** [SECURE - stored in 1Password/env only]

### External Services Cost Estimates
| Service | Monthly Cost |
|---------|--------------|
| Vercel Pro | $20 |
| Neon PostgreSQL | $0-19 |
| Cloudinary | $0-25 |
| Twilio Verify | $2-10 (~50-200 SMS) |
| ElevenLabs | $5-50 |
| Google Gemini | $0.13-0.50 |
| **Total** | **$27-125** |

### Animation Ideas for Logo
- Subtle paintbrush stroke reveal on app load
- Diamond logo pulses gently when recording voice
- Color droplet splash when estimate is saved

### GitHub Repo
- **URL:** https://github.com/kabzadev/zach
- **Issues:** 20 total across 3 milestones
- **Mockups:** 13 HTML files in /docs (deployed to GitHub Pages)
- **Design Doc:** PinpointEstimate-App-Design.md