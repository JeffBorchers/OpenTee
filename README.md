# ⛳ OpenTee

**Open-source tee time monitoring and booking intelligence for golfers.**

Never miss a tee time again. Monitor availability 24/7 and get notified the moment your perfect slot opens up.

---

## The 3 AM Problem

Bays and tee times drop in the middle of the night, often 2 weeks out. Working adults can't compete with night owls and bots. By the time you check in the morning, the good times are already gone.

**OpenTee solves this.** We watch for you, 24/7. When your ideal tee time appears, you get notified instantly.

## How It Works

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Set your       │    │  OpenTee        │    │  Get notified   │
│  preferences    │───▶│  monitors 24/7  │───▶│  instantly      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

1. **Set Your Preferences** — Tell OpenTee your preferred days, times, and courses
2. **OpenTee Watches 24/7** — Continuous monitoring for new openings and cancellations
3. **Get Notified Instantly** — SMS or email the moment your slot appears

## Features

- 🕐 **24/7 Monitoring** — Never miss a tee time drop, even at 3 AM
- ⚡ **Instant Alerts** — SMS and email notifications the moment slots open
- 🧠 **Smart Scheduling** — Learns your patterns and preferences over time
- 🔓 **100% Open Source** — Deploy yourself, free forever
- 📞 **Voice Booking** (coming soon) — Call courses automatically to secure your time
- 🏌️ **Multi-Course Support** (coming soon) — Monitor multiple courses simultaneously

## Self-Hosting

### Quick Start

```bash
# Clone the repository
git clone https://github.com/opentee/opentee.git
cd opentee

# Install dependencies
npm install

# Start the server
npm start
```

OpenTee will be running at `http://localhost:3458`

### Configuration

Create a `.env` file in the project root:

```env
# Server
PORT=3458

# Admin token for waitlist access
ADMIN_TOKEN=your-secure-token-here

# Notification settings (coming soon)
SMTP_HOST=smtp.example.com
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
```

### Requirements

- Node.js 18+
- npm or yarn

## Roadmap

### Phase 1 ✅
- [x] Landing page with waitlist
- [x] Project structure
- [x] OpenTee branding

### Phase 2 (In Progress)
- [ ] Course monitoring module
- [ ] Real-time availability checking
- [ ] Notification system (email, SMS)
- [ ] User dashboard

### Phase 3
- [ ] Multi-course support
- [ ] Voice booking (automated calls)
- [ ] Calendar integration
- [ ] Group booking coordination

### Phase 4
- [ ] Hosted cloud option
- [ ] Usage-based pricing ($2-5 per successful booking)
- [ ] Priority support

## Pricing

| Self-Hosted | Hosted Cloud |
|-------------|--------------|
| Free forever | $2-5 per successful booking |
| Deploy on your hardware | We monitor, you book |
| Your credentials stay local | No server setup required |

## Privacy & Ethics

OpenTee is designed with privacy in mind:

- **Self-hosted option** — Your booking credentials never leave your machine
- **No tracking** — We don't track usage on self-hosted instances
- **Rate limiting** — Built-in protections to avoid overwhelming booking systems
- **Fair use** — Designed to help golfers, not scalp slots

## License

MIT License — Use it, modify it, deploy it.

---

**Built by golfers, for golfers.**

[Join the waitlist](https://opentee.io) · [View on GitHub](https://github.com/opentee/opentee)

*Brought to you from Grand Rapids, MI*
