# Arisu Bot • WhatsApp Assistant inspired by Tendou Arisu

<p align="center">
  <img src="assets/arisubanner.gif" border="0" style="border-radius: 10px;" alt="Arisu banner" width="520" height="200">
</p>

<p align="center">
  <a href="https://nodejs.org/"><img alt="Node" src="https://img.shields.io/badge/node-%3E%3D18.0-339933?logo=node.js&logoColor=white"></a>
  <a href="https://github.com/pedroslopez/whatsapp-web.js"><img alt="whatsapp-web.js" src="https://img.shields.io/badge/whatsapp--web.js-1.31.0-25D366?logo=whatsapp&logoColor=white"></a>
  <img alt="Status" src="https://img.shields.io/badge/status-active-4CAF50">
  <img alt="Made with love" src="https://img.shields.io/badge/made%20with-%E2%9D%A4-ff69b4">
</p>

> “I’ll quietly handle it.” — Arisu

Arisu Bot is a dedicated WhatsApp bot designed to assist with everyday tasks, themed around Tendou Arisu from Blue Archive. It features utilities, a rent tracker, JSON-backed storage, media handling, and optional AI-powered responses.

This project uses:
- whatsapp-web.js for WhatsApp automation (QR login, session persistence)
- Puppeteer for headless Chrome control
- FFmpeg + sharp for media processing
- JSON as a built-in lightweight datastore
- OpenAI/chatgpt packages for optional AI integrations
- Express for lightweight web endpoints (optional)

<p align="center">
  <img src="assets/arisu-preview.gif" alt="Arisu bot preview" width="680">
</p>

---

## Features

- Themed experience inspired by Tendou Arisu (banner/GIF-ready)
- Utilities toolbox: quick replies, message helpers, media transforms
- Rent tracker: add, list, and manage rent splits via JSON storage
- Built-in datastore: simple .json-backed storage; no external DB required
- Welcomer: greet new members or first-time chats
- Media pipeline: convert/resize with FFmpeg/sharp
- AI helpers: reply generation and utilities using OpenAI/chatgpt (optional)
- QR flow: sign in by scanning a QR code in your terminal
- Express server (optional) for basic status or webhook endpoints

> Note: Exact command set depends on your handlers. This README lists the common patterns used in projects like this. Tweak section “Commands” to match your repo’s implemented commands.

---

## Quick Start

Prerequisites:
- Node.js 18+ and npm
- Optional: an OpenAI API key if you plan to use AI features

1) Clone and install
```bash
git clone https://github.com/RuumiDev/arisu-bot
cd arisu-bot
npm install
```

2) Configure environment
- Copy `.env.example` to `.env` (create `.env` if not present)
- Suggested variables:
```bash
# Required if you want AI features
OPENAI_API_KEY=your_openai_api_key

# Optional
PORT=3000
# Customize where to store session if you like
SESSION_FILE=.session/arisu.session.json
```

3) Run the bot
```bash
node index.js
# or if you add scripts later: npm start
```

4) Scan the QR code
- A QR code will appear in your terminal
- Open WhatsApp on your phone: Settings → Linked devices → Link a device
- After linking, a session file will be saved to keep you signed in

---

## Commands and Usage

- Utilities
  - Ping/check responsiveness
  - Help/menu command to list capabilities
  - Text transforms or quick info lookups

- Rent tracker
  - Add/update a renter’s share
  - List balances
  - Export/import JSON data

- Media helpers
  - Convert images/videos
  - Create stickers or compressed variants
  - Thumbnail/preview generation

- AI helpers (optional)
  - Ask questions
  - Summarize or rephrase
  - Draft responses

> Tip: Update this section with your actual command prefixes, examples, and screenshots to match your handlers. For example:
```text
!help
!rent add @user 500
!rent list
!ai "Write a friendly welcome message"
!sticker (reply to an image)
```

---

## Data and Storage

- JSON-based storage
  - Simple, portable, and committed (or ignored) depending on your preference
  - Defaults could live in `data/` or similar
- Session persistence
  - Ensure `SESSION_FILE` points to a safe path (e.g. `.session/`)
  - Do not commit session files to git

---

## Theming, Visuals, and Assets

- Place themed images/GIFs in `assets/`:
  - `assets/arisu-banner.png` — top banner
  - `assets/arisu-preview.gif` — quick demo loop
  - `assets/screenshots/` — feature screenshots

Design suggestions:
- Use a calm palette reminiscent of Arisu: soft blues, white, slate accents
- Subtle glow edges on banners; rounded cards in screenshots
- Include a light bokeh or classroom background to match Blue Archive vibes

Attribution:
- If you use official character art or community fan art, include proper attribution and respect licenses. Avoid redistributing copyrighted content without permission.

---

## Configuration

- Environment
  - `OPENAI_API_KEY` enables AI features
  - `PORT` for any Express endpoints (if used)
  - `SESSION_FILE` path customization

- Media tools
  - Uses `ffmpeg-static` and `fluent-ffmpeg` for conversions
  - Uses `sharp` for image processing

- Browser automation
  - `puppeteer` manages the WhatsApp Web session under the hood for whatsapp-web.js

---

## Development

Project basics:
- Entry point: `index.js`
- Dependencies (highlights): axios, dotenv, express, ffmpeg-static, fluent-ffmpeg, fs-extra, image-size, mime-types, moment, openai, puppeteer, qrcode-terminal, sharp, whatsapp-web.js
- Dev tooling: minimal by default; add your linter/prettier/test stack if desired

Common tasks:
```bash
# run
node index.js

# add a start script (optional)
# package.json -> "scripts": { "start": "node index.js" }
npm start
```

Directory suggestions (optional):
```
assets/
  arisu-banner.png
  arisu-preview.gif
  screenshots/
data/
  rent.json
  users.json
.session/
  arisu.session.json   # gitignore this
```

---

## Roadmap Ideas

- Rich help menu with category navigation
- Persistent user profiles and preferences
- Admin dashboard (web UI) for rent tracking
- More media filters and sticker templates
- Multi-language support
- Plugin-style command loader

---

## Contributing

- Issues and PRs are welcome!
- Please discuss major changes with an issue first
- Consider sharing custom command modules as examples

---

## Disclaimer

This project is not affiliated with or endorsed by WhatsApp, Blue Archive, or Nexon. Use responsibly and in accordance with WhatsApp’s Terms of Service. Character theming is for fan-inspired presentation only; respect copyrights and licenses.

---

## License

This project is open source and released under the [MIT License](LICENSE).

Copyright (c) 2025 RuumiDev

---

## Credits

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)
- [Puppeteer](https://pptr.dev/)
- [FFmpeg](https://ffmpeg.org/) via `ffmpeg-static` and `fluent-ffmpeg`
- [sharp](https://sharp.pixelplumbing.com/)
- [OpenAI Node SDK](https://github.com/openai/openai-node) and `chatgpt`
- Arisu theme inspiration from Blue Archive