# RaiCast · Live Weather Dashboard

A modern, single-page weather app that pulls **live conditions for any city** from the
[OpenWeatherMap](https://openweathermap.org/) API and frames them in a glassy, weather-reactive
interface. Built by **RaiVerse** as part of the Raihan portfolio. The whole page subtly shifts its
background to match the sky — sunny gold for *clear*, deep blue for *rain*, violet for *thunder*,
and so on.

Built with vanilla HTML / CSS / JS (Sora typeface), no build step required.

## Features

- **Live search** — type any city and get current conditions instantly.
- **Multiple saved locations** — open the ☰ list to add cities and switch between them; the
  selection (plus the list) is saved to `localStorage`, iPhone-Weather style. Default seed: Xi'an.
- **Current location** — on load (and via "use my location") the app requests the browser's
  Geolocation API and fetches weather for where you actually are.
- **Weather-reactive scene** — the background gradient & glow morph to the current condition.
- **Rich detail grid** — temperature, "feels like", humidity, wind, pressure, visibility, sunrise & sunset.
- **°C / °F toggle** — switch units on the fly, data re-fetches automatically.
- **Local time** — shows the searched city's local clock using the API timezone offset.
- **Dark / light theme** — toggle in the top-right; choice is saved to `localStorage`.
- **Graceful fallback** — if the live API is unreachable, a built-in mock dataset (Xi'an, London,
  Tokyo, New York, Paris, Dubai, Sydney, Dhaka…) is used so the app always looks alive; unknown
  cities get a deterministic sample.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Markup: search bar, unit toggle, weather card, stat grid |
| `style.css`  | Aerial-glass theme + CSS variables + `[data-theme]` light mode + scene classes |
| `script.js`  | Fetches data, renders the DOM, swaps icons, manages theme/units |
| `images/`    | Weather + UI icons (PNG) |

## Run

Open `index.html` in a browser. The app first asks for your location; allow it to see your
local weather, or just search any city. Press Enter (or the search button) to look up a place.

```bash
# optional: serve locally (recommended so Geolocation is allowed)
python -m http.server 8000
# then visit http://localhost:8000
```

> Note: browsers only grant Geolocation on secure contexts (`https://` or `localhost`).
> Opening the file directly via `file://` may block it — the app then falls back to a sample city.

## Configuration

The API key lives in `script.js`:

```js
const API_KEY = "f0417d2d7d085cacc02287e7f52b696a";
```

It's a free-tier OpenWeatherMap key shipped for convenience. To use your own, replace `API_KEY`
with a key from your OpenWeatherMap account. On an unknown city the app shows an inline error
rather than crashing.

---

Part of the **RaiVerse** suite: **RaiCast** (this app), **RaiForge** (code editor + Forge Agent),
**RaiScope** (cosmic profile), **RaiChat** (realtime social), **RaiMind** (ML).
