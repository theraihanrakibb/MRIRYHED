# RaiScope · Cosmic Profile & Compatibility

A single-page **cosmic profile** app that turns a birth date into a rich, readable
personality reading — and lets you check compatibility with a partner. Built by
**RaiVerse** as part of the Raihan portfolio.

Instead of a single "match %", RaiScope reveals **three interlocking profiles**:

- **Western zodiac** (Aries … Pisces) — element, ruling planet, core traits, and a
  short archetype description.
- **Chinese zodiac** — birth-year animal plus its Wood / Fire / Earth / Metal / Water
  element.
- **MBTI** — pick one of 16 types to get its nickname and a personality snapshot.

It then composes everything into a **generated summary paragraph** and offers a
**compatibility checker** that blends the two partners' elements and signs into a
flavourful result.

The whole UI is a self-contained vanilla JS app — **no build step, no dependencies**.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Markup + layout (brand, inputs, profile cards, compat checker) |
| `style.css`  | Cosmic-glass theme with light / dark modes |
| `script.js`  | Zodiac / Chinese-zodiac / MBTI data + `reveal()` + `compatWith()` + UI wiring |

## Run

Just open `index.html` in any modern browser — no server required.

```bash
# optional: serve it locally
python -m http.server 8000
# then visit http://localhost:8000
```

Pick a birth date, tap an MBTI tag, and hit **Reveal Profile →**. Add a partner's
date to run the compatibility checker.

## How it works

- Western sign is derived from month/day boundaries.
- Chinese animal comes from `(year % 12)`; the element from `floor(year / 2) % 10`
  over the repeating Wood→Water cycle.
- Compatibility uses an **element-compatibility matrix** (e.g. Water feeds Wood,
  Metal cuts Wood) plus a touch of sign-based randomness so results feel human.

---

Part of the **RaiVerse** suite: **RaiCast** (weather), **RaiForge** (code editor +
Forge Agent), **RaiScope** (this app), **RaiChat** (realtime social), **RaiMind** (ML).
