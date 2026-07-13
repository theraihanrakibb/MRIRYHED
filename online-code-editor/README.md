# MRIRYHED Code · Online Code Editor + Forge Agent

A sleek, in-browser **IDE** with an AI coding copilot — part of the **MRIRYHED** suite.
Tabbed HTML/CSS/JS playground with live preview, a synced line-number gutter, and a
**Forge Agent** (LLM) that can explain, debug, and run code. Built with vanilla JS — no build step.

## Features

- **Tabbed editors** — switch between HTML, CSS, and JS with colored language dots.
- **Line-number gutter** — scrolls in sync with the active editor for a real IDE feel.
- **Live preview** — renders into a sandboxed `<iframe>` as you type.
- **Run (all languages)**
  - **JavaScript** → executes in a sandbox; `console.*` is captured to the **Console** tab.
  - **Python** → runs in-browser via **Pyodide** (WebAssembly) — no install.
  - **Other languages** (Java, C++, C#, Go, Rust, Ruby, PHP, TypeScript, SQL, Bash…) →
    one click routes the code to the **Forge Agent**, which runs/reasons about it and returns output.
- **Forge Agent** — an LLM assistant panel (🤖). Ask it to *explain*, *debug*, or *run* your code;
  it sees what's in the editor. Works with any **OpenAI-compatible** API (key stored locally).
- **Console capture** — `console.log / warn / error` shown with a live count badge.
- **Auto-run toggle**, **Copy**, **Save** (download), **persistence** (code + language saved to `localStorage`).
- **Dark / light theme** — toggle top-right, saved locally.

## Forge Agent setup

Click **🤖 Agent → ⚙** and enter:
- **API base URL** (default `https://api.openai.com/v1`)
- **API key** (your key; stored only in this browser)
- **Model** (default `gpt-4o-mini`)

Without a key the agent still opens and frames your request, but live answers require a key.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Toolbar, editor + preview panes, agent panel, settings modal |
| `style.css`  | IDE theme, CSS variables, `[data-theme]` light mode, agent styles |
| `script.js`  | Language modes, run engine, gutter sync, Forge Agent (LLM) |

## Run

Open `index.html` in a browser and start typing. For Python/Pyodide and the Forge Agent you
need an internet connection.

```bash
# optional: serve locally
python -m http.server 8000
# then visit http://localhost:8000
```

> Client-side only — JavaScript runs in your browser; don't paste untrusted code.
