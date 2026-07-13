<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:6d28d9,100:06b6d4&height=180&section=header&text=RaiVerse&fontSize=56&fontAlignY=38&fontColor=ffffff" alt="RaiVerse" />
</p>

<h1 align="center">RaiVerse</h1>

<p align="center">
  <b>A unified suite of modern web apps &amp; ML projects by <a href="https://github.com/theraihanrakibb">MD RAKIBUL ISLAM RAIHAN</a>.</b><br/>
  Five polished products, one brand — built to look great and run anywhere.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/vanilla%20JS-HTML%2FCSS%2FJS-61dafb?logo=javascript&logoColor=black" alt="vanilla JS" />
  <img src="https://img.shields.io/badge/ML-Python%20%2F%20Jupyter-F7931E?logo=python&logoColor=white" alt="ML" />
  <img src="https://img.shields.io/badge/theme-light%20%26%20dark-8b5cf6" alt="themed" />
  <img src="https://img.shields.io/badge/zero%20build-step-22c55e" alt="no build" />
</p>

---

## What's inside

RaiVerse collects five independently-shippable projects under a single identity. Every web
app is **self-contained vanilla HTML/CSS/JS — no build step, no framework, no install**. Open
the file and it works.

| App | Folder | What it does | Stack |
|-----|--------|--------------|-------|
| **RaiCast** | [`weather-dashboard/`](weather-dashboard) | iPhone-style multi-location weather with live geolocation, weather-reactive scenes, notes & light/dark theme. | Vanilla JS · OpenWeatherMap · Geolocation |
| **RaiForge** | [`online-code-editor/`](online-code-editor) | In-browser IDE that **runs JS & Python** (Pyodide) and routes other languages to the **Forge Agent** (LLM). | Vanilla JS · Pyodide · LLM API |
| **RaiScope** | [`zodiac-calculator/`](zodiac-calculator) | Cosmic profile: Western + Chinese zodiac + MBTI with a generated summary & compatibility check. | Vanilla JS |
| **RaiChat** | [`chatx/`](chatx) | Realtime social — chat, feed, friends & a wallet. **100% client-side**, syncs live across tabs. | Vanilla JS · BroadcastChannel · localStorage |
| **RaiMind** | [`machine-learning-projects/`](machine-learning-projects) | 8 ML mini-projects: classification, regression, clustering & a recommender. | Python · Jupyter · scikit-learn |

---

## Highlights

- **One brand, five products.** Consistent naming (`Rai*`), shared light/dark theming, and a
  common RaiVerse identity across every app.
- **Runs anywhere.** No bundlers, no `npm install`, no servers for the web apps. Open
  `index.html` (or serve with `python -m http.server`) and you're in.
- **Real features, not demos.** Live weather & geolocation, an in-browser code runner with an
  LLM agent, a personality profiler, and a genuinely realtime chat/wallet — all client-side.
- **Career-ready.** Each project is documented, self-contained, and portfolio-grade.

---

## Quick start

```bash
# Clone the suite
git clone https://github.com/theraihanrakibb/RaiVerse.git
cd RaiVerse

# Run any web app — e.g. the weather dashboard
cd weather-dashboard
python -m http.server 8000
# open http://localhost:8000
```

> Tip: open **RaiChat** in two browser tabs with different usernames to see realtime
> sync, and try **RaiForge**'s ▶ Run (JS/Python) or the 🤖 Forge Agent.

---

## Per-project setup

- **RaiCast** — ships with a free OpenWeatherMap key; works offline via a built-in mock dataset.
- **RaiForge** — JS runs in a sandbox; Python via Pyodide CDN. The Forge Agent needs an
  OpenAI-compatible API key (entered in-app Settings, stored locally).
- **RaiMind** — `pip install -r machine-learning-projects/requirements.txt && jupyter notebook`.

See each folder's `README.md` for details.

---

## Author

**MD RAKIBUL ISLAM RAIHAN** — building polished, useful web apps & ML projects.
[GitHub](https://github.com/theraihanrakibb)

<p align="center"><sub>RaiVerse · crafted with vanilla JS &amp; Python</sub></p>
