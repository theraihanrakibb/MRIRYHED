/* ------------------------------------------------------------------ *
 * RaiCast — multi-location weather (iPhone-style)
 * Live OpenWeatherMap when the key works; otherwise a built-in mock
 * dataset so the app always feels alive. Locations persist locally.
 * ------------------------------------------------------------------ */

const API_KEY = "f0417d2d7d085cacc02287e7f52b696a";
const BASE = "https://api.openweathermap.org/data/2.5/weather";

const $ = (id) => document.getElementById(id);
const scene = $("scene");
const statusEl = $("status");

let unit = "metric";
let locations = [];      // [{id, name, data}]
let selectedId = null;

/* ---------- curated mock dataset (used when the live API is off) ---------- */
const KNOWN = {
  "xi'an":     { display: "Xi'an",     country: "CN", tz: 28800,  temp: 24, feels: 26, humidity: 58, pressure: 1011, wind: 2.4, vis: 9,  main: "Clear",   desc: "clear sky" },
  "xian":      { display: "Xi'an",     country: "CN", tz: 28800,  temp: 24, feels: 26, humidity: 58, pressure: 1011, wind: 2.4, vis: 9,  main: "Clear",   desc: "clear sky" },
  "london":    { display: "London",    country: "GB", tz: 0,      temp: 13, feels: 11, humidity: 78, pressure: 1008, wind: 4.1, vis: 10, main: "Clouds",  desc: "scattered clouds" },
  "tokyo":     { display: "Tokyo",     country: "JP", tz: 32400,  temp: 19, feels: 20, humidity: 65, pressure: 1013, wind: 3.0, vis: 12, main: "Rain",    desc: "light rain" },
  "new york":  { display: "New York",  country: "US", tz: -18000, temp: 17, feels: 16, humidity: 60, pressure: 1015, wind: 5.2, vis: 14, main: "Clouds",  desc: "broken clouds" },
  "paris":     { display: "Paris",     country: "FR", tz: 3600,   temp: 15, feels: 14, humidity: 70, pressure: 1010, wind: 3.3, vis: 11, main: "Drizzle", desc: "light drizzle" },
  "dubai":     { display: "Dubai",     country: "AE", tz: 14400,  temp: 36, feels: 39, humidity: 40, pressure: 1004, wind: 3.8, vis: 9,  main: "Clear",   desc: "clear sky" },
  "sydney":    { display: "Sydney",    country: "AU", tz: 36000,  temp: 22, feels: 22, humidity: 62, pressure: 1016, wind: 4.6, vis: 13, main: "Clear",   desc: "clear sky" },
  "dhaka":     { display: "Dhaka",     country: "BD", tz: 21600,  temp: 31, feels: 35, humidity: 74, pressure: 1006, wind: 2.6, vis: 6,  main: "Rain",    desc: "moderate rain" },
  "sylhet":    { display: "Sylhet",    country: "BD", tz: 21600,  temp: 30, feels: 34, humidity: 76, pressure: 1007, wind: 2.2, vis: 7,  main: "Drizzle", desc: "light drizzle" },
};

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/* build a full weather data object for a city (mock when needed) */
function mockData(rawName) {
  const key = rawName.trim().toLowerCase();
  const known = KNOWN[key];
  const now = Math.floor(Date.now() / 1000);
  const dayStart = Math.floor(now / 86400) * 86400;
  const sunrise = dayStart - (known ? known.tz : 0) + 6 * 3600 + 10 * 60;
  const sunset  = dayStart - (known ? known.tz : 0) + 18 * 3600 + 42 * 60;

  if (known) {
    return {
      name: known.display, country: known.country, tz: known.tz,
      dt: now, main: { temp: known.temp, feels_like: known.feels, humidity: known.humidity,
        pressure: known.pressure }, wind: { speed: known.wind },
      visibility: known.vis * 1000,
      weather: [{ main: known.main, description: known.desc }],
      sys: { country: known.country, sunrise, sunset },
    };
  }
  // deterministic pseudo-weather for any other city
  const h = hashStr(key);
  const conds = ["Clear", "Clouds", "Rain", "Drizzle", "Mist", "Snow"];
  const main = conds[h % conds.length];
  const temp = -5 + (h % 38);
  const cap = rawName.trim().charAt(0).toUpperCase() + rawName.trim().slice(1);
  return {
    name: cap, country: "", tz: 0,
    dt: now, main: { temp, feels_like: temp + ((h >> 3) % 7) - 3, humidity: 40 + (h % 55),
      pressure: 998 + (h % 28) }, wind: { speed: 1 + (h % 7) }, visibility: 8000 + (h % 6000),
    weather: [{ main, description: main.toLowerCase() + " skies" }],
    sys: { country: "", sunrise, sunset },
  };
}

/* ---------- helpers ---------- */
function applyScene(main) {
  const map = { Clear: "clear", Clouds: "clouds", Rain: "rain", Drizzle: "drizzle", Thunderstorm: "thunder", Snow: "snow", Mist: "mist", Smoke: "mist", Haze: "mist", Fog: "mist" };
  const key = map[main] || "clouds";
  scene.className = "scene scene--" + key;
}
function fmtTime(unix, tzOffset) {
  const d = new Date((unix + tzOffset) * 1000);
  return d.toUTCString().slice(17, 22);
}
function iconFor(main) {
  const set = { Clear: "clear", Clouds: "clouds", Rain: "rain", Drizzle: "drizzle", Thunderstorm: "rain", Snow: "snow", Mist: "mist" };
  return "images/" + (set[main] || "clouds") + ".png";
}
function tempStr(t) { return `${Math.round(t)}<span class="unit-sym">°</span>`; }
function setStatus(msg, ok = false) { statusEl.textContent = msg; statusEl.classList.toggle("is-ok", ok); }

/* ---------- rendering ---------- */
function renderDetail(loc) {
  if (!loc) return;
  const d = loc.data;
  $("weather").hidden = false;
  $("cityName").textContent = d.name;
  $("countryPill").textContent = (d.sys.country || "—").toUpperCase();
  $("localTime").textContent = fmtTime(d.dt, d.tz) + " local";
  $("temp").innerHTML = tempStr(unit === "metric" ? d.main.temp : d.main.temp);
  $("condition").textContent = d.weather[0].description;
  $("weatherIcon").src = iconFor(d.weather[0].main);
  $("weatherIcon").alt = d.weather[0].description;
  $("feelsLike").textContent = Math.round(d.main.feels_like) + "°";
  $("humidity").textContent = d.main.humidity + "%";
  $("wind").textContent = unit === "metric"
    ? Math.round(d.wind.speed * 3.6) + " km/h"
    : Math.round(d.wind.speed) + " mph";
  $("pressure").textContent = d.main.pressure + " hPa";
  $("visibility").textContent = (d.visibility ? (d.visibility / 1000).toFixed(1) : "--") + " km";
  $("sunrise").textContent = fmtTime(d.sys.sunrise, d.tz);
  $("sunset").textContent = fmtTime(d.sys.sunset, d.tz);
  applyScene(d.weather[0].main);
  document.title = `${d.name} · ${Math.round(d.main.temp)}° · RaiCast`;
}

function renderList() {
  const list = $("locList");
  list.innerHTML = "";
  if (!locations.length) {
    list.innerHTML = `<li class="loc-empty">No saved cities yet.<br>Search above to add one.</li>`;
    return;
  }
  locations.forEach((loc) => {
    const li = document.createElement("li");
    li.className = "loc-item" + (loc.id === selectedId ? " is-active" : "");
    li.innerHTML = `
      <button class="loc-item__del" title="Remove" data-del="${loc.id}">🗑</button>
      <div class="loc-item__top">
        <span class="loc-item__name">${loc.data.name}</span>
        <span class="loc-item__temp">${Math.round(loc.data.main.temp)}°</span>
      </div>
      <div class="loc-item__cond">${loc.data.weather[0].description}</div>`;
    li.addEventListener("click", (e) => {
      if (e.target.dataset.del) return;
      selectedId = loc.id;
      save(); renderList(); renderDetail(loc); closeDrawer();
    });
    li.querySelector(".loc-item__del").addEventListener("click", (e) => {
      e.stopPropagation();
      locations = locations.filter((x) => x.id !== loc.id);
      if (selectedId === loc.id) selectedId = locations[0] ? locations[0].id : null;
      save(); renderList();
      const sel = locations.find((x) => x.id === selectedId);
      sel ? renderDetail(sel) : ($("weather").hidden = true);
    });
    list.appendChild(li);
  });
}

/* ---------- data ops ---------- */
function findLoc(name) {
  const key = name.trim().toLowerCase();
  return locations.find((l) => l.data.name.trim().toLowerCase() === key);
}
function addLocation(data) {
  const existing = findLoc(data.name);
  if (existing) { existing.data = data; selectedId = existing.id; }
  else {
    const id = "loc_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    locations.push({ id, data });
    selectedId = id;
  }
  save(); renderList(); renderDetail(findLoc(data.name) || locations[locations.length - 1]);
}

function save() {
  localStorage.setItem("raicast-locations", JSON.stringify(locations.map((l) => ({ id: l.id, data: l.data }))));
  localStorage.setItem("raicast-selected", selectedId || "");
}
function load() {
  try {
    const raw = localStorage.getItem("raicast-locations");
    if (raw) { locations = JSON.parse(raw); selectedId = localStorage.getItem("raicast-selected") || (locations[0] && locations[0].id); }
  } catch (e) { locations = []; }
  if (!locations.length) {
    // seed with Xi'an (default) + a couple to demonstrate the list
    ["Xi'an", "London", "Tokyo"].forEach((n) => locations.push({ id: "seed_" + n, data: mockData(n) }));
    selectedId = locations[0].id;
  }
}

/* ---------- live API ---------- */
async function fetchWeather(city) {
  setStatus("Fetching " + city + "…");
  try {
    const url = `${BASE}?q=${encodeURIComponent(city)}&units=${unit}&appid=${API_KEY}`;
    const res = await fetch(url);
    if (res.status === 404) { setStatus(`“${city}” not found — showing sample.`); addLocation(mockData(city)); return; }
    if (!res.ok) throw new Error("api");
    const data = await res.json();
    setStatus("Updated just now", true);
    addLocation(data);
  } catch (err) {
    setStatus("Live API off — showing sample for “" + city + "”.", true);
    addLocation(mockData(city));
  }
}
async function fetchByCoords(lat, lon) {
  setStatus("Locating you…");
  try {
    const url = `${BASE}?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("api");
    const data = await res.json();
    data.name = "My Location";
    setStatus("Your current location", true);
    addLocation(data);
  } catch (err) {
    const mock = mockData("My Location");
    mock.name = "My Location";
    setStatus("Location found (sample)", true);
    addLocation(mock);
  }
}
function useMyLocation() {
  if (!navigator.geolocation) { setStatus("Geolocation unsupported — search a city."); return; }
  setStatus("Requesting location…");
  navigator.geolocation.getCurrentPosition(
    (p) => fetchByCoords(p.coords.latitude, p.coords.longitude),
    () => { setStatus("Location blocked — showing sample."); addLocation(mockData("My Location")); }
  );
}

/* ---------- events ---------- */
$("searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const city = $("cityInput").value.trim();
  if (city) { fetchWeather(city); $("cityInput").value = ""; }
});
document.querySelectorAll(".unit__btn").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".unit__btn").forEach((x) => x.classList.remove("is-active"));
    b.classList.add("is-active");
    unit = b.dataset.unit;
    const sel = locations.find((l) => l.id === selectedId);
    if (sel) renderDetail(sel);
  });
});
$("myLocBtn").addEventListener("click", useMyLocation);
$("listToggle").addEventListener("click", openDrawer);
$("drawerClose").addEventListener("click", closeDrawer);
$("scrim").addEventListener("click", closeDrawer);
function openDrawer() { $("drawer").classList.add("is-open"); $("scrim").classList.add("is-open"); $("drawer").setAttribute("aria-hidden", "false"); }
function closeDrawer() { $("drawer").classList.remove("is-open"); $("scrim").classList.remove("is-open"); $("drawer").setAttribute("aria-hidden", "true"); }

/* notes drawer */
function openNotes() { $("notesDrawer").classList.add("is-open"); $("scrim").classList.add("is-open"); }
function closeNotes() { $("notesDrawer").classList.remove("is-open"); if (!$("drawer").classList.contains("is-open")) $("scrim").classList.remove("is-open"); }
$("notesBtn").addEventListener("click", openNotes);
$("notesClose").addEventListener("click", closeNotes);
$("notesArea").value = localStorage.getItem("raicast-notes") || "";
$("notesArea").addEventListener("input", (e) => localStorage.setItem("raicast-notes", e.target.value));

/* theme */
(function () {
  const btn = $("themeToggle");
  const root = document.documentElement;
  if (localStorage.getItem("raicast-theme") === "light") { root.setAttribute("data-theme", "light"); btn.textContent = "☾"; }
  btn.addEventListener("click", () => {
    const isLight = root.getAttribute("data-theme") === "light";
    if (isLight) { root.removeAttribute("data-theme"); btn.textContent = "☀︎"; localStorage.setItem("raicast-theme", "dark"); }
    else { root.setAttribute("data-theme", "light"); btn.textContent = "☾"; localStorage.setItem("raicast-theme", "light"); }
  });
})();

/* ---------- init ---------- */
load();
renderList();
const sel = locations.find((l) => l.id === selectedId);
if (sel) renderDetail(sel);
