# MRIRYHED Chat — realtime server

The chat works **out of the box**: open `chatx/client/index.html` (or the GitHub Pages link)
and it runs as a local demo — two tabs in the same browser sync live via `BroadcastChannel`.

For **real cross-device realtime** (chat with friends on other phones/laptops), run the
included zero-dependency Node + WebSocket server. It serves the chat UI *and* relays live
messages, presence, feed and wallet updates between every connected browser.

```bash
cd chatx/server
npm start          # or: node server.js   (listens on :3000)
# open http://localhost:3000
```

No `npm install` needed — the server has zero dependencies.

## Deploy free (one click)

GitHub Pages can't serve WebSockets, so deploy this tiny server to a free Node host. Both
options below read `render.yaml` / `railway.json` from the repo root.

**Render (recommended — free, WebSocket-friendly):**
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/theraihanrakibb/MRIRYHED)

> Replace the repo owner in the button URL if needed: `https://render.com/deploy?repo=https://github.com/<you>/MRIRYHED`

**Railway:**
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?repo=https://github.com/theraihanrakibb/MRIRYHED)

After deploy you get a URL like `https://mrihat.onrender.com`. Open it and the chat is live
for everyone. (Render's free tier spins down when idle — the first connect after a pause takes
~30s to wake up.)

## Point the GitHub Pages chat at your server (optional)

The GitHub Pages build stays a local demo unless you tell it where your server lives. Set the
relay in `chatx/client/relay.js`:

```js
window.CHAT_RELAY = "wss://mrihat.onrender.com";   // your deployed wss URL
```

Then the Pages chat talks to your server in real time too. Leave it `""` to auto-use
same-origin when the page is served by the Node server.

## Protocol

The client and server exchange JSON messages (`{type, ...}`): `presence`, `message`,
`feed-new`, `feed-like`, `friends`, `wallet`, `tx-new`, and a `hello`/`roster` handshake.
The server is a dumb relay — it doesn't store anything — so the client-side `localStorage`
state remains the source of truth.
