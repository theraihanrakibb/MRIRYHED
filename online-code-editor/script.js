/* ------------------------------------------------------------------ *
 * MRIRYHED Code — online code editor + Forge Agent (LLM)
 * Web (HTML/CSS/JS) → live preview. JS → sandbox. Python → Pyodide.
 * Other languages → routed to the Forge Agent. Vanilla JS, no build.
 * ------------------------------------------------------------------ */

const WEB_STARTER = {
  html: `<div class="card">
  <h1>Hello, MRIRYHED ⚡</h1>
  <p>Edit the code — it runs live.</p>
  <button id="go">Tap me</button>
</div>`,
  css: `body{font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0;background:#0f172a;color:#e2e8f0}
.card{background:#1e293b;padding:32px 40px;border-radius:18px;text-align:center;box-shadow:0 20px 50px -20px #000}
h1{margin:0 0 8px;font-size:26px}
p{margin:0 0 18px;opacity:.7}
button{background:#ff7a59;color:#1a0f0a;border:0;padding:10px 18px;border-radius:10px;font-weight:700;cursor:pointer}`,
  js: `document.getElementById('go').addEventListener('click', () => {
  console.log('Button clicked at', new Date().toLocaleTimeString());
});
console.log('MRIRYHED is ready 🚀');`,
};

const LANGS = [
  { id: "web", name: "Web (HTML/CSS/JS)", mode: "web" },
  { id: "js", name: "JavaScript", mode: "code", engine: "js", piston: "javascript",
    starter: `// JavaScript\nfunction greet(name) {\n  return \`Hello, \${name}!\`;\n}\nconsole.log(greet("MRIRYHED"));\n` },
  { id: "py", name: "Python", mode: "code", engine: "py",
    starter: `# Python\nimport math\n\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("MRIRYHED"))\nprint("pi =", round(math.pi, 4))\n` },
  { id: "ts", name: "TypeScript", mode: "code", engine: "agent", piston: "typescript", starter: `// TypeScript (ask Forge Agent to run)\nconst msg: string = "Hello, MRIRYHED";\nconsole.log(msg);\n` },
  { id: "java", name: "Java", mode: "code", engine: "agent", piston: "java", starter: `// Java (ask Forge Agent to run)\npublic class Main {\n  public static void main(String[] a) {\n    System.out.println("Hello, MRIRYHED");\n  }\n}\n` },
  { id: "cpp", name: "C++", mode: "code", engine: "agent", piston: "cpp", starter: `// C++ (ask Forge Agent to run)\n#include <iostream>\nint main() {\n  std::cout << "Hello, MRIRYHED\\n";\n  return 0;\n}\n` },
  { id: "c", name: "C", mode: "code", engine: "agent", piston: "c", starter: `// C (ask Forge Agent to run)\n#include <stdio.h>\nint main() {\n  printf("Hello, MRIRYHED\\n");\n  return 0;\n}\n` },
  { id: "cs", name: "C#", mode: "code", engine: "agent", piston: "csharp", starter: `// C# (ask Forge Agent to run)\nusing System;\nclass Program { static void Main() => Console.WriteLine("Hello, MRIRYHED"); }\n` },
  { id: "go", name: "Go", mode: "code", engine: "agent", piston: "go", starter: `// Go (ask Forge Agent to run)\npackage main\nimport "fmt"\nfunc main() { fmt.Println("Hello, MRIRYHED") }\n` },
  { id: "rs", name: "Rust", mode: "code", engine: "agent", piston: "rust", starter: `// Rust (ask Forge Agent to run)\nfn main() { println!("Hello, MRIRYHED"); }\n` },
  { id: "rb", name: "Ruby", mode: "code", engine: "agent", piston: "ruby", starter: `# Ruby (ask Forge Agent to run)\nputs "Hello, MRIRYHED"\n` },
  { id: "php", name: "PHP", mode: "code", engine: "agent", piston: "php", starter: `<?php\n// PHP (ask Forge Agent to run)\necho "Hello, MRIRYHED\\n";\n` },
  { id: "sql", name: "SQL", mode: "code", engine: "agent", starter: `-- SQL\nSELECT name, age FROM users\nWHERE age > 18\nORDER BY name;\n` },
  { id: "sh", name: "Bash", mode: "code", engine: "agent", starter: `#!/usr/bin/env bash\necho "Hello, MRIRYHED"\n` },
  { id: "json", name: "JSON", mode: "code", engine: "none", starter: `{\n  "name": "MRIRYHED",\n  "live": true\n}\n` },
  { id: "md", name: "Markdown", mode: "code", engine: "none", starter: `# MRIRYHED\n\nWrite **Markdown** here.\n` },
];

const $ = (id) => document.getElementById(id);
const langSelect = $("langSelect");
const editorTabs = $("editorTabs");
const viewTabs = $("viewTabs");
const gutter = $("gutter");
const preview = $("preview");
const consoleEl = $("console");
const consoleCount = $("consoleCount");
const autoRun = $("autoRun");

let mode = "web";
let activeLang = "html";
let currentLangId = "web";
let consoleLines = 0;
let pyodide = null, pyLoading = false;

/* ---------- language dropdown ---------- */
LANGS.forEach((l) => { const o = document.createElement("option"); o.value = l.id; o.textContent = l.name; langSelect.appendChild(o); });

/* ---------- persistence ---------- */
const storeKey = (id) => "mricode-" + id;
function loadSaved() {
  let any = false;
  for (const k of ["html", "css", "js"]) {
    const v = localStorage.getItem(storeKey(k));
    $("" + k).value = v !== null ? v : WEB_STARTER[k];
    if (v !== null) any = true;
  }
  const savedLang = localStorage.getItem("mricode-lang") || "web";
  langSelect.value = savedLang;
  applyLang(savedLang, false);
}
function saveAll() {
  if (mode === "web") for (const k of ["html", "css", "js"]) localStorage.setItem(storeKey(k), $("" + k).value);
  else localStorage.setItem(storeKey("code-" + currentLangId), activeEditor().value);
}

/* ---------- active editor + gutter ---------- */
function activeEditor() { return mode === "web" ? $("" + activeLang) : $("code"); }
function refreshGutter() {
  const ta = activeEditor();
  const lines = ta.value.split("\n").length || 1;
  let out = ""; for (let i = 1; i <= lines; i++) out += i + "\n";
  gutter.textContent = out; gutter.scrollTop = ta.scrollTop;
}
function syncScroll() { gutter.scrollTop = activeEditor().scrollTop; }

/* ---------- console bridge ---------- */
window.__forgeLog = function (type, args) {
  const text = args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
  const line = document.createElement("div");
  line.className = "line" + (type === "error" ? " line--err" : type === "warn" ? " line--warn" : "");
  line.textContent = "› " + text;
  consoleEl.appendChild(line); consoleEl.scrollTop = consoleEl.scrollHeight;
  consoleLines++; consoleCount.textContent = consoleLines;
};
function clearConsole() { consoleEl.innerHTML = ""; consoleLines = 0; consoleCount.textContent = "0"; showView("preview"); }
function showView(v) {
  viewTabs.querySelectorAll(".tab").forEach((t) => t.classList.toggle("is-active", t.dataset.view === v));
  preview.hidden = v !== "preview"; consoleEl.hidden = v !== "console";
}

/* ---------- run ---------- */
function run() { mode === "web" ? runWeb() : runCode(currentLangId); }

function runWeb() {
  const html = $("html").value, css = $("css").value, js = $("js").value;
  preview.srcdoc = `<!DOCTYPE html><html><head><style>${css}</style></head><body>${html}
<script>(function(){
  const send=(t,a)=>{try{window.parent.__forgeLog(t,a);}catch(e){}};
  const o={log:console.log,warn:console.warn,error:console.error};
  console.log=(...a)=>{o.log.apply(console,a);send('log',a);};
  console.warn=(...a)=>{o.warn.apply(console,a);send('warn',a);};
  console.error=(...a)=>{o.error.apply(console,a);send('error',a);};
  window.onerror=(m)=>send('error',[m]);
  try{${js}}catch(e){send('error',[e.message]);}
})();<\/script></body></html>`;
}

async function runCode(id) {
  const lang = LANGS.find((l) => l.id === id);
  const code = $("code").value;
  clearConsole(); showView("console");
  if (lang.engine === "js") { runInIframe(code); return; }
  if (lang.engine === "py") { await runPython(code); return; }
  if (lang.engine === "none") { noteLine(`▶ ${lang.name} is a data/markup language — nothing to execute. Use Copy / Save.`); return; }
  // engine === "agent": hand off to Forge Agent
  noteLine(`▶ ${lang.name} can't run in-browser. Opening Forge Agent to run & explain it…`);
  openAgent();
  setTimeout(() => sendToAgent(`Run the following ${lang.name} code and show the exact output. If you can't truly execute it, simulate the result by reasoning carefully through the code.\n\n\`\`\`\n${code}\n\`\`\``), 350);
}
function runInIframe(code) {
  preview.srcdoc = `<!DOCTYPE html><html><body><script>(function(){
  const send=(t,a)=>{try{window.parent.__forgeLog(t,a);}catch(e){}};
  const o={log:console.log,warn:console.warn,error:console.error};
  console.log=(...a)=>{o.log.apply(console,a);send('log',a);};
  console.warn=(...a)=>{o.warn.apply(console,a);send('warn',a);};
  console.error=(...a)=>{o.error.apply(console,a);send('error',a);};
  window.onerror=(m)=>send('error',[m]);
  try{${code}}catch(e){send('error',[e.message]);}
})();<\/script></body></html>`;
}
function noteLine(t) { const d = document.createElement("div"); d.className = "line"; d.textContent = t; consoleEl.appendChild(d); consoleLines++; consoleCount.textContent = consoleLines; }

async function runPython(code) {
  if (pyLoading) return;
  if (!pyodide) {
    pyLoading = true; noteLine("› loading Python runtime (Pyodide)…");
    try {
      await new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js"; s.onload = res; s.onerror = () => rej(); document.head.appendChild(s); });
      pyodide = await window.loadPyodide();
    } catch { consoleEl.appendChild(Object.assign(document.createElement("div"), { className: "line line--err", textContent: "✗ Couldn't load Python runtime (needs internet)." })); pyLoading = false; return; }
    pyLoading = false;
  }
  pyodide.setStdout({ batched: (s) => window.__forgeLog("log", [s]) });
  pyodide.setStderr({ batched: (s) => window.__forgeLog("error", [s]) });
  try { await pyodide.runPythonAsync(code); } catch (e) { window.__forgeLog("error", [String(e)]); }
}

/* ---------- language switching ---------- */
function applyLang(id, runAfter = true) {
  currentLangId = id;
  const lang = LANGS.find((l) => l.id === id);
  mode = lang.mode;
  localStorage.setItem("mricode-lang", id);
  if (mode === "web") {
    editorTabs.style.display = ""; $("code").hidden = true;
    for (const k of ["html", "css", "js"]) $("" + k).hidden = k !== activeLang;
    autoRun.parentElement.style.display = "";
  } else {
    editorTabs.style.display = "none";
    for (const k of ["html", "css", "js"]) $("" + k).hidden = true;
    const saved = localStorage.getItem(storeKey("code-" + id));
    $("code").value = saved !== null ? saved : lang.starter;
    $("code").hidden = false;
    autoRun.parentElement.style.display = "none";
  }
  refreshGutter();
  if (runAfter && mode === "web") { clearConsole(); run(); }
}

/* ---------- events ---------- */
langSelect.addEventListener("change", (e) => applyLang(e.target.value));
editorTabs.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => {
  editorTabs.querySelectorAll(".tab").forEach((t) => t.classList.remove("is-active"));
  tab.classList.add("is-active"); activeLang = tab.dataset.lang;
  for (const k of ["html", "css", "js"]) $("" + k).hidden = k !== activeLang;
  refreshGutter();
}));
viewTabs.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => showView(tab.dataset.view)));
[ $("html"), $("css"), $("js"), $("code") ].forEach((ta) => {
  ta.addEventListener("input", () => { saveAll(); refreshGutter(); if (mode === "web" && autoRun.checked) debounceRun(); });
  ta.addEventListener("scroll", syncScroll);
});
$("runBtn").addEventListener("click", () => { saveAll(); clearConsole(); run(); });
$("copyBtn").addEventListener("click", async () => { try { await navigator.clipboard.writeText(activeEditor().value); flash($("copyBtn"), "Copied!"); } catch { flash($("copyBtn"), "Copy failed"); } });
$("dlBtn").addEventListener("click", () => {
  const ext = { js: "js", py: "py", ts: "ts", java: "java", cpp: "cpp", c: "c", cs: "cs", go: "go", rs: "rs", rb: "rb", php: "php", sql: "sql", sh: "sh", json: "json", md: "md", web: "html" }[currentLangId] || "txt";
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([activeEditor().value], { type: "text/plain" })); a.download = "mricode." + ext; a.click(); URL.revokeObjectURL(a.href); flash($("dlBtn"), "Saved");
});
function flash(btn, msg) { const old = btn.textContent; btn.textContent = msg; setTimeout(() => (btn.textContent = old), 1200); }
let timer = null; function debounceRun() { clearTimeout(timer); timer = setTimeout(() => { clearConsole(); run(); }, 500); }

/* ===================== Forge Agent (LLM) ===================== */
const agent = $("agent"), agentMsgs = $("agentMsgs"), agentInput = $("agentInput");
let agentHistory = [];
function openAgent() { agent.classList.add("is-open"); agent.setAttribute("aria-hidden", "false"); agentInput.focus(); }
function closeAgent() { agent.classList.remove("is-open"); agent.setAttribute("aria-hidden", "true"); }
$("agentBtn").addEventListener("click", openAgent);
$("agentClose").addEventListener("click", closeAgent);

function agentSettingsLoad() {
  $("setBase").value = localStorage.getItem("mricode-ai-base") || "https://api.openai.com/v1";
  $("setKey").value = localStorage.getItem("mricode-ai-key") || "";
  $("setModel").value = localStorage.getItem("mricode-ai-model") || "gpt-4o-mini";
}
$("agentSettings").addEventListener("click", () => { agentSettingsLoad(); $("settingsModal").hidden = false; });
$("setCancel").addEventListener("click", () => ($("settingsModal").hidden = true));
$("setSave").addEventListener("click", () => {
  localStorage.setItem("mricode-ai-base", $("setBase").value.trim());
  localStorage.setItem("mricode-ai-key", $("setKey").value.trim());
  localStorage.setItem("mricode-ai-model", $("setModel").value.trim());
  $("settingsModal").hidden = true; toast("Forge Agent settings saved");
});

function addMsg(role, text) {
  const d = document.createElement("div");
  d.className = "amsg " + (role === "user" ? "amsg--user" : "amsg--bot");
  d.innerHTML = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>").replace(/`([^`]+)`/g, "<code>$1</code>");
  agentMsgs.appendChild(d); agentMsgs.scrollTop = agentMsgs.scrollHeight; return d;
}
function toast(m) { const t = $("toast"); if (!t) return; t.textContent = m; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 2600); }

async function sendToAgent(prompt) {
  const base = localStorage.getItem("mricode-ai-base") || "https://api.openai.com/v1";
  const key = localStorage.getItem("mricode-ai-key") || "";
  const model = localStorage.getItem("mricode-ai-model") || "gpt-4o-mini";
  const code = activeEditor().value;
  const langName = LANGS.find((l) => l.id === currentLangId).name;
  const sys = "You are Forge, an expert coding assistant inside the MRIRYHED Code web IDE. Be concise. Use markdown code blocks. The user's current editor language is " + langName + ".";
  const userContent = (prompt || agentInput.value).trim();
  if (!userContent) return;
  addMsg("user", userContent);
  agentInput.value = "";
  if (!key) { addMsg("bot", "⚙ Forge Agent isn't configured yet. Click ⚙ and add an OpenAI-compatible API key to enable live responses. Until then I can only frame your request."); return; }
  agentHistory.push({ role: "user", content: userContent + "\n\n[Current " + langName + " code in editor:]\n```\n" + code + "\n```" });
  const typing = addMsg("bot", "…");
  try {
    const res = await fetch(base.replace(/\/$/, "") + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
      body: JSON.stringify({ model, messages: [{ role: "system", content: sys }].concat(agentHistory), temperature: 0.4 }),
    });
    if (!res.ok) { const e = await res.text(); typing.remove(); addMsg("bot", "⚠ API error: " + res.status + " " + e.slice(0, 200)); return; }
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "(empty)";
    typing.remove();
    addMsg("bot", reply);
    agentHistory.push({ role: "assistant", content: reply });
  } catch (e) { typing.remove(); addMsg("bot", "⚠ Network error: " + e.message); }
}
$("agentForm").addEventListener("submit", (e) => { e.preventDefault(); sendToAgent(); });
document.querySelectorAll(".agent__quick button").forEach((b) => b.addEventListener("click", () => sendToAgent(b.dataset.q)));

/* ---------- theme ---------- */
(function () {
  const btn = $("themeToggle"), root = document.documentElement;
  if (localStorage.getItem("mricode-theme") === "light") root.setAttribute("data-theme", "light");
  btn.addEventListener("click", () => {
    const isLight = root.getAttribute("data-theme") === "light";
    if (isLight) { root.removeAttribute("data-theme"); localStorage.setItem("mricode-theme", "dark"); }
    else { root.setAttribute("data-theme", "light"); localStorage.setItem("mricode-theme", "light"); }
  });
})();

/* ---------- init ---------- */
loadSaved(); refreshGutter();
if (mode === "web") run();
