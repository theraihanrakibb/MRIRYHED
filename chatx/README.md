# MRIRYHED Chat · Realtime Social

A full realtime chat platform — **chat, feed, friends, and a wallet** — in the spirit of
WeChat but with a cleaner, more modern interface. Built by **MRIRYHED** as part of the Raihan
portfolio. It's a **100% client-side web app**: no server, no build step, no API keys. Just
open `index.html`.

```
chatx/
├── client/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── .gitignore
└── README.md
```

## Features

- **Realtime chat** — 1:1 messaging. Open the app in two browser tabs with two usernames
  and messages sync live between them (via `BroadcastChannel`).
- **Feed** — post status updates and like friends' posts; new posts & likes stream live.
- **Friends** — add anyone on MRIRYHED Chat by username, see online/offline presence, jump into a chat.
- **Wallet (simulated)** — every user starts with **5,000 CXC**. Send money to friends;
  balances & transaction history update live. *No real currency — purely a demo wallet.*
- **Presence** — live online/offline indicators.
- **Dark / light theme** — toggle in the sidebar; saved to `localStorage`.
- **Seeded demo** — comes pre-populated with a few users (Maya, Leo, Priya, Aria), sample
  messages, feed posts, and a transaction, so it feels alive on first open.

## How it works

State (users, messages, feed, friendships, wallets, transactions) is stored in the browser's
**`localStorage`**. Cross-tab realtime sync uses the **`BroadcastChannel`** API. There is no
backend — everything runs in the browser.

## Run

Just open the file:

```bash
# option A — double-click client/index.html, or:
# option B — serve it (recommended for a clean origin)
cd client
python -m http.server 8000
# then visit http://localhost:8000
```

> **Tip:** open the app in two tabs with different usernames (e.g. `you` and `friend`) to see
> realtime chat, feed, and wallet sync between them. Clearing site data (localStorage) resets
> the seeded demo.

---

Part of the **MRIRYHED** suite: **MRIRYHED Weather**, **MRIRYHED Code**, **MRIRYHED Zodiac**,
**MRIRYHED Chat** (this app), and **MRIRYHED Mind** (ML).
