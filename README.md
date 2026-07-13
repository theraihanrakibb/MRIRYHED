<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:7c3aed,100:06b6d4&height=200&section=header&text=MRIRYHED&fontSize=64&fontAlignY=36&fontColor=ffffff" alt="MRIRYHED" />
</p>

<h1 align="center">MRIRYHED</h1>

<p align="center">
  <b>Three worlds. One name. Eternal.</b>
</p>

<p align="center">
  A unified suite of modern web apps &amp; ML projects by <a href="https://github.com/theraihanrakibb">MD RAKIBUL ISLAM RAIHAN</a>.<br/>
  Four polished products, one brand — built to look exceptional and run anywhere.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/vanilla%20JS-HTML%2FCSS%2FJS-61dafb?logo=javascript&logoColor=black" alt="vanilla JS" />
  <img src="https://img.shields.io/badge/ML-Python%20%2F%20Jupyter-F7931E?logo=python&logoColor=white" alt="ML" />
  <img src="https://img.shields.io/badge/theme-light%20%26%20dark-8b5cf6" alt="themed" />
  <img src="https://img.shields.io/badge/zero%20build-step-22c55e" alt="no build" />
</p>

---

## What's inside

MRIRYHED collects four independently-shippable web products under a single identity. Every web
app is **self-contained vanilla HTML/CSS/JS — no build step, no framework, no install**. Open the
file and it works. The machine-learning work lives in its own repo:
[**ML-DL-AI**](https://github.com/theraihanrakibb/ML-DL-AI).

| App | Folder | What it does | Stack |
|-----|--------|--------------|-------|
| **MRIRYHED Weather** | [`weather-dashboard/`](weather-dashboard) | iPhone-style multi-location weather with live geolocation, weather-reactive scenes, notes & light/dark theme. | Vanilla JS · OpenWeatherMap · Geolocation |
| **MRIRYHED Code** | [`online-code-editor/`](online-code-editor) | In-browser IDE that **runs JS & Python** (Pyodide) and routes other languages to the **MRIRYHED Agent** (LLM). | Vanilla JS · Pyodide · LLM API |
| **MRIRYHED Zodiac** | [`zodiac-calculator/`](zodiac-calculator) | Cosmic profile: Western + Chinese zodiac + MBTI with a generated summary & compatibility check. | Vanilla JS |
| **MRIRYHED Chat** | [`chatx/client/`](chatx/client) | Realtime social — chat, feed, friends & a wallet. Client-side by default, with **optional Node + WebSocket server** for true cross-device realtime. | Vanilla JS · WebSocket · localStorage |
| **ML / DL / AI** | [theraihanrakibb/ML-DL-AI](https://github.com/theraihanrakibb/ML-DL-AI) | 8 ML mini-projects: classification, regression, clustering & a recommender. | Python · Jupyter · scikit-learn |

---

## Highlights

- **One brand, four products.** Consistent naming (`MRIRYHED *`), shared light/dark theming, and a
  common identity across every app — each footer reads *"Powered by MRIRYHED"*.
- **Runs anywhere.** No bundlers, no `npm install`, no servers for the web apps. Open
  `index.html` (or serve with `python -m http.server`) and you're in.
- **Real features, not demos.** Live weather & geolocation, an in-browser code runner with an
  LLM agent, a personality profiler, and a genuinely realtime chat/wallet — all client-side.
- **Career-ready.** Each project is documented, self-contained, and portfolio-grade.

---

## Quick start

```bash
# Clone the suite
git clone https://github.com/theraihanrakibb/MRIRYHED.git
cd MRIRYHED

# Run any web app — e.g. the weather dashboard
cd weather-dashboard
python -m http.server 8000
# open http://localhost:8000
```

> Tip: open **MRIRYHED Chat** in two browser tabs with different usernames to see realtime
> sync, and try **MRIRYHED Code**'s ▶ Run (JS/Python) or the 🤖 MRIRYHED Agent.

---

## Per-product setup

- **MRIRYHED Weather** — ships with a free OpenWeatherMap key; works offline via a built-in mock dataset.
- **MRIRYHED Code** — JS runs in a sandbox; Python via Pyodide CDN. The MRIRYHED Agent works with
  **any OpenAI-compatible provider** (OpenAI, Anthropic, Google, Mistral, NVIDIA, DeepSeek, Alibaba,
  Z.ai, BAAI and more). Pick a provider, add your key, validate to load models, then choose by token cost.
- **MRIRYHED Chat** — client-side first: it just works from `chatx/client/`. For real cross-device
  realtime, run the included zero-dependency server: `cd chatx/server && npm start` (or `node server.js`),
  then open the page — the client auto-connects.
- **ML / DL / AI** — lives at [theraihanrakibb/ML-DL-AI](https://github.com/theraihanrakibb/ML-DL-AI):
  `pip install -r requirements.txt && jupyter notebook`.

See each folder's `README.md` for details.

---

<p align="center"><sub>MRIRYHED — Three worlds. One name. Eternal. — Powered by MRIRYHED</sub></p>
