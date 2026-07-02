# Alphalumina + Alpha Lab — Session Notes
**Date:** 2026-06-07 / 2026-06-08  
**Branch:** main (both repos)

---

## 1. Alpha Lab — Paper Trader Overhaul

### Entry Quality Gates added to `services/paper_trader.py`
- **Price momentum gate:** Reject entries where `price_change_5m_pct > +40%` (already pumped) or `< -15%` (already dumping). Root cause discovery: losing trades had deeply *negative* p5m at entry — they were entering tokens already in decline.
- **Buy ratio gate for low scores:** If score ≤ 59, require `buy_ratio ≥ 0.55` or skip.
- **Liquidity floor:** Hard reject below $10k liquidity. Half-size positions between $10k–$20k.
- **Fixed field names:** Real GMGN field names are `dex_price_change_m5` and `micro_buy_ratio_h1` — not the assumed names. Fixed in `main.py` with a fallback chain.

### Dynamic Blacklist — DB-backed restart fix
- Previous bug: in-memory blacklist cleared on every scanner restart → same stopped-out tokens re-entered immediately.
- Fix: `_check_dynamic_blacklist()` now falls back to querying `paper_events` DB on cache miss. Blacklist survives restarts.

### Stop-Loss Reentry Cooldown
- After a stop-loss close: **4-hour** reentry cooldown on that mint (up from the default 20 min).
- After any other close: standard 20-min cooldown.
- Config field: `stop_loss_reentry_cooldown_hours = 4.0`

### `consecutive_loss_days` — Persistent state
- Bug: mode governor's loss-day counter reset to 0 on every restart.
- Fix: new `paper_state` SQLite table stores the counter. `_load_state()` restores it on startup, `_save_state()` writes it on change.

### Telegram Notifications for Paper Trades
- Paper trader now calls `alerts/telegram.py` on every OPEN and CLOSE event.
- Format: `📄 [paper] OPEN $SYM  sc=XX  size=0.XXX SOL  fill=...` and `✅/❌ [paper] CLOSE_reason $SYM  pnl=+0.XXXX SOL`

### Old Losses Archived
- All pre-recalibration paper events archived to `paper_events_pre_recal_2026_06_07`.
- Fresh book started from 2026-06-07.

---

## 2. Alpha Lab — New Files

### `alerts/subscriber.py` — Subscriber-facing Telegram channel
Separate from the internal ops bot. Sends clean, human-readable signal alerts to a public/invite-only channel.

**Setup (one-time):**
1. Message @BotFather → `/newbot` → get token
2. Create a Telegram channel, add bot as admin
3. Get channel chat_id (public: `@channelname`, private: forward to @userinfobot)
4. Set in `~/alpha_lab/.env`:
   ```
   SUBSCRIBER_BOT_TOKEN=<token>
   SUBSCRIBER_CHANNEL_ID=<@channel or -100xxxxxxx>
   SUBSCRIBER_ENABLED=true
   ```

**Features:**
- Rate-limited: 30/hour max, 3s minimum interval
- HTML-formatted message with score bar, MC/Vol/Liq, wallet activity, reasons, GMGN link
- Wired into `main.py` — fires automatically on every quality-pass signal

### `scripts/rotate_logs.sh` — Log rotation
- Rotates `scanner.log` when it exceeds 10MB
- Keeps 5 compressed archives (`.1.gz` → `.5.gz`)
- Truncates in-place (preserves launchd file descriptor)
- Installed as cron: `*/30 * * * *`

### `scripts/push_site_stats.sh` — Live stats cron
- Queries `signals.db` and `paper.db`
- Writes `stats.json` to `~/alphalumina-site/`
- Commits and pushes to git if changed
- Installed as cron: `0 * * * *`

---

## 3. `main.py` — Signal dict field names fixed
```python
"price_change_5m_pct": _token_value(token, "dex_price_change_m5", "price_change_5m_pct", ...),
"price_change_1h_pct": _token_value(token, "dex_price_change_h1", "price_change_1h_pct", ...),
"buy_ratio":           _token_value(token, "micro_buy_ratio_h1",  "micro_buy_ratio_m5",  ...),
```

### Subscriber wiring in `main.py`
```python
from alerts.subscriber import send_signal as _subscriber_send_signal
```
Fires `send_signal()` on every `quality_pass` signal with full token context.

---

## 4. Alphalumina Site — SEO & OG

### `index.html` — Meta tags added
```html
<meta name="description" content="...">
<link rel="canonical" href="https://alphalumina.com/">
<meta property="og:type" content="website">
<meta property="og:url" content="https://alphalumina.com/">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:image" content="https://alphalumina.com/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<!-- + JSON-LD structured data -->
```

### `og-image.png` — Social preview image
- 1200×630 PNG generated with Pillow
- Dark background + gold glow, logo mark, wordmark, headline, tagline
- Used by Facebook, Twitter, LinkedIn, Discord link previews

### `og-image.svg` — Source SVG (also committed)

---

## 5. Alphalumina Site — Email Autoresponder

### `netlify/functions/submission-created.js`
Fires automatically on every Netlify Forms submission. Sends a branded HTML welcome email via SendGrid.

**To activate — add in Netlify dashboard → Site Settings → Environment Variables:**
```
NETLIFY_EMAILS_PROVIDER_API_KEY=<your SendGrid API key>
FROM_EMAIL=hello@alphalumina.com
```

**`netlify.toml`** updated with `functions = "netlify/functions"`.

---

## 6. Telegram Ops Bot — Status & Next Steps

### Current state
| Setting | Value |
|---|---|
| `TELEGRAM_ENABLED` | `false` |
| `ALERTS_ENABLED` | `false` |
| `TELEGRAM_BOT_TOKEN` | not set |
| `TELEGRAM_CHAT_ID` | not set |
| `ALERT_THRESHOLD` | 45 (too low — causes ~15–20 alerts/hour) |

### To re-enable cleanly
1. Add to `~/alpha_lab/.env`:
   ```
   TELEGRAM_BOT_TOKEN=<token from BotFather>
   TELEGRAM_CHAT_ID=<your personal chat ID or group ID>
   ```
2. Raise `ALERT_THRESHOLD` in `main.py` from `45` → `65` (gets ~3–8 high-conviction alerts/day)
3. Run: `./telegram_on.sh`

### Controls
```bash
~/alpha_lab/telegram_on.sh    # enable + restart scanner
~/alpha_lab/telegram_off.sh   # disable + restart scanner
~/alpha_lab/telegram_status.sh  # check current state
```

---

## 7. Git Identity
```bash
git config --global user.name "Yomi"
git config --global user.email "yombotin@gmail.com"
```

---

## Current System State
- **Scanner:** running (PID 33548, launchd: `com.alphalumina.scanner`)
- **Regime:** hot
- **Signals last 24h:** ~456, last hour: ~26
- **Paper book:** fresh from 2026-06-07 (old -22.18 SOL history archived)
- **Paper trades since reset:** 0 (market producing scores 37–47, below 50 threshold)
- **Site:** deployed on Netlify, auto-deploy on push to `main`
- **Stats cron:** hourly, pushes `stats.json` to site repo
