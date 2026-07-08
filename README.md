# Enterprise Discord Security Bot

A high-performance, enterprise-grade Discord security bot inspired by SecurityBot, Wick, and AuthGG.

## Features

- **Anti-Nuke**: Channel, role, webhook, emoji, sticker, bot-add, permission, server update, vanity, prune, timeout, mass action protection.
- **AutoMod**: Bad words, spam, flood, caps, emojis, mentions, invites, links, scam links, phishing, IP loggers, NSFW, attachments, duplicate messages, ghost pings.
- **AntiRaid**: Join raids, leave raids, DM raids, verification lockdown, auto-lockdown, quarantine, raid detection.
- **AntiSpam & AntiTamper**
- **Advanced Whitelist System**
- **Complete Audit Logs & Real-time Alerts**
- **Moderation Commands & Verification**
- **Server Backup & Restore**
- **Security Score & Incident Reports**
- **User History & Analytics**
- **Premium-ready & Multi-language**
- **Slash & Prefix (`!`) Commands**
- **Docker & Railway Support**

## Setup

1. Clone repo
2. Copy `.env.example` to `.env` and fill values
3. Run `docker-compose up` or deploy to Railway with `nixpacks.toml`
4. Invite bot with necessary permissions
5. Use `/setup` to configure defaults

## Commands

- `/antinuke threshold set <action> <value>`
- `/antiraid enable`
- `/automod config`
- `/backup create`
- `/security-score`
- And more...
