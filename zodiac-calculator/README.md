# MRIRYHED Zodiac · Cosmic Profile & Compatibility

A single-page **cosmic profile** app that turns a birth date into a rich, readable
personality reading — and lets you check compatibility with a partner. Built by
**MRIRYHED** as part of the Raihan portfolio.

Instead of a single "match %", MRIRYHED Zodiac reveals **three interlocking profiles**:

- **Western zodiac** (Aries … Pisces) — element, ruling planet, core traits, and a
  short archetype description.
- **Chinese zodiac** — birth-year animal plus its Wood / Fire / Earth / Metal / Water
  element.
- **MBTI** — pick one of 16 types to get its nickname and a personality snapshot.

It then composes everything into a **generated summary paragraph** and offers a
**Cosmic Match** panel — two side-by-side profiles (Mine / Partner) that blend your
Western, Chinese, and MBTI energies into a live full-compatibility score.

The whole UI is a self-contained vanilla JS app — **no build step, no dependencies**.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Markup + layout (brand, inputs, profile cards, Cosmic Match panel) |
| `style.css`  | Cosmic-glass theme with light / dark modes |
| `script.js`  | Zodiac / Chinese-zodiac / MBTI data + `reveal()` + `computeMatch()` + UI wiring |

## Run

Just open `index.html` in any modern browser — no server required.

```bash
# optional: serve it locally
python -m http.server 8000
# then visit http://localhost:8000
```

Pick a birth date, tap an MBTI tag, and hit **Reveal Profile →**. Then open the
**Cosmic Match** panel to compare two people side by side — the full compatibility
score updates live as you change any input, gender toggle, or MBTI chip.

## How it works

- Western sign is derived from month/day boundaries.
- Chinese animal comes from `(year % 12)`; the element from `floor(year / 2) % 10`
  over the repeating Wood→Water cycle.
- **Cosmic Match** combines three 0–100 subsystem scores into one weighted result:
  - **Western** — the element-compatibility matrix (`ELEM_COMPAT`) mapped to 40–100.
  - **Chinese** — traditional animal pairing (six-harmony / allied triad / conflict /
    harm) plus a five-element bonus (same, productive, or controlling).
  - **MBTI** — dimension-based scoring (N/S weighted strongest) plus golden-pair and
    rocky-pair bonuses.
  - Overall = 35% Western + 35% Chinese + 30% MBTI, with a short verdict line.

---

Part of the **MRIRYHED** suite: **MRIRYHED Weather**, **MRIRYHED Code**,
**MRIRYHED Zodiac** (this app), **MRIRYHED Chat** (realtime social), and **MRIRYHED Mind** (ML).
