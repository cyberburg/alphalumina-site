# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Alphalumina is a single-page static marketing/landing site for an AI-powered signal intelligence platform targeting Solana traders. It has no build system — the entire site lives in `index.html` with embedded CSS and JavaScript. Deployed via Netlify.

## Development

No build, install, or compile steps. To preview locally, open `index.html` directly in a browser or use any static file server:

```bash
python3 -m http.server 8080
# or
npx serve .
```

Deployment is automatic via Netlify on push to `main`. Netlify also handles the email waitlist form submission (`data-netlify="true"`).

## Architecture

Everything is in `index.html` (~685 lines):

- **`<style>`** — all CSS, using `:root` CSS variables for the color system (`--gold`, `--teal`, `--bg`, `--fg`) and glass-morphism effects. Responsive breakpoints at 960px and 560px.
- **`<body>`** — sections in order: nav → hero → marquee → stats → engine (how it works) → technology → method → FAQ → CTA/form → footer
- **`<script>`** — all JS at the bottom, including two canvas animations and an Intersection Observer for scroll reveals.

### Canvas Animations

There are two `<canvas>` elements with continuous `requestAnimationFrame` render loops:

1. **Hero canvas** (`#heroCanvas`) — 3D particle sphere (220 particles) with rotating golden rings. Orbiting ecosystem logos (Solana, Jupiter, etc.) are positioned by projecting particle ray endpoints.

2. **Flow canvas** (`#flowCanvas`) — Animated signal pipeline. Packets spawn at input nodes (Wallets, Liquidity, Momentum, Risk, Converge), travel bezier curves to a central scoring engine, then branch to an "Approved" output or get eaten by an animated pac-man "Filtered" node. Packet lifecycle is fully managed in JS (spawn, travel, die).

Both canvases have `resize` event listeners that re-derive layout from `canvas.width/height`.

### Form Submission

The CTA email form uses Netlify Forms (`data-netlify="true"`). The JS intercepts submit, posts via `fetch`, and shows a success message — no external service needed beyond Netlify's built-in form handler.
