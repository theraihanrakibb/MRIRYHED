/* ------------------------------------------------------------------ *
 * MRIRYHED Chat — client-side first, real-time when a server is present.
 * State persists in localStorage; cross-tab realtime via BroadcastChannel.
 * If served by chatx/server (Node + WebSocket) it also relays live across
 * devices. Simulated wallet (no real money). Open index.html and you're in.
 * ------------------------------------------------------------------ */
const $ = (id) => document.getElementById(id);
const bc = ("BroadcastChannel" in window) ? new BroadcastChannel("mrichat") : null;
let ws = null;

const KEYS = {
  users: "mrichat-users", msg: "mrichat-msg", feed: "mrichat-feed",
  tx: "mrichat-tx", session: "mrichat-session",
};
let me = null;
let users = {};                 // username -> { wallet, friends:[] }
let messages = [];             // { from, to, text, ts }
let feed = [];                 // { id, author, text, ts, likes:[] }
let txs = [];                  // { id, from, to, amount, note, ts }
let online = new Set();        // online usernames (live, from BroadcastChannel)
let activeChat = null;
let seq = 1;
const nextId = (p) => p + "_" + Date.now() + "_" + seq++;

/* ---------- persistence ---------- */
function load() {
  users = JSON.parse(localStorage.getItem(KEYS.users) || "null") || {};
  messages = JSON.parse(localStorage.getItem(KEYS.msg) || "[]");
  feed = JSON.parse(localStorage.getItem(KEYS.feed) || "[]");
  txs = JSON.parse(localStorage.getItem(KEYS.tx) || "[]");
}
function save() {
  localStorage.setItem(KEYS.users, JSON.stringify(users));
  localStorage.setItem(KEYS.msg, JSON.stringify(messages));
  localStorage.setItem(KEYS.feed, JSON.stringify(feed));
  localStorage.setItem(KEYS.tx, JSON.stringify(txs));
}

/* ---------- seed demo data (first run only) ---------- */
function seed() {
  if (Object.keys(users).length) return;
  const demo = ["Maya", "Leo", "Priya", "Aria"];
  demo.forEach((u) => (users[u] = { wallet: 5000, friends: [] }));
  // Maya & Leo are friends
  users.Maya.friends = ["Leo"]; users.Leo.friends = ["Maya"];
  messages.push({ from: "Maya", to: "Leo", text: "Hey Leo, welcome to MRIRYHED! 👋", ts: Date.now() - 60000 });
  messages.push({ from: "Leo", to: "Maya", text: "This looks slick 🔥", ts: Date.now() - 30000 });
  feed.push({ id: nextId("p"), author: "Maya", text: "Just deployed my first project with MRIRYHED. Loving the vibe! ✨", ts: Date.now() - 120000, likes: ["Leo"] });
  feed.push({ id: nextId("p"), author: "Aria", text: "Anyone up for a quick call later? ☕", ts: Date.now() - 60000, likes: [] });
  txs.push({ id: nextId("t"), from: "Leo", to: "Maya", amount: 250, note: "lunch 🍜", ts: Date.now() - 90000 });
  users.Maya.wallet = 5250; users.Leo.wallet = 4750;
  save();
}

/* ---------- helpers ---------- */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const av = (n) => (n ? n.trim().charAt(0).toUpperCase() : "?");
function timeStr(ts) { return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function dayStr(ts) { return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" }); }
function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 2600); }
const isOnline = (n) => online.has(n) || n === me;
const myFriends = () => (users[me] ? users[me].friends : []);

/* ---------- login ---------- */
function enter() {
  const name = $("usernameInput").value.trim();
  if (!name) { toast("Pick a username first."); return; }
  me = name;
  if (!users[me]) users[me] = { wallet: 5000, friends: [] };
  localStorage.setItem(KEYS.session, me);
  $("login").hidden = true;
  $("app").hidden = false;
  $("meName").textContent = me;
  $("meAvatar").textContent = av(me);
  $("balance").textContent = users[me].wallet.toLocaleString();
  renderChatList(); renderFeed(); renderFriends(); renderAll(); renderTxs();
  broadcast({ type: "presence", user: me, online: true });
  if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: "hello", user: me }));
}
$("enterBtn").addEventListener("click", enter);
$("usernameInput").addEventListener("keydown", (e) => { if (e.key === "Enter") enter(); });

/* ---------- broadcast ---------- */
function broadcast(obj) {
  if (bc) bc.postMessage(obj);
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
}
if (bc) bc.onmessage = (e) => handleRemote(e.data);

/* ---------- optional real-time server (Node + WebSocket) ---------- */
let wsTries = 0;
const WS_MAX_TRIES = 6;
function connectWS() {
  if (!("WebSocket" in window)) return;
  const url = window.CHAT_RELAY
    ? window.CHAT_RELAY
    : (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host;
  if (wsTries >= WS_MAX_TRIES) return; // stop hammering hosts without WebSocket (e.g. GitHub Pages)
  try { ws = new WebSocket(url); } catch { return; }
  ws.onopen = () => { wsTries = 0; if (me) ws.send(JSON.stringify({ type: "hello", user: me })); };
  ws.onmessage = (e) => { try { handleRemote(JSON.parse(e.data)); } catch { /* ignore */ } };
  ws.onclose = () => { ws = null; wsTries++; if (wsTries < WS_MAX_TRIES) setTimeout(connectWS, 3000); };
  ws.onerror = () => { try { ws.close(); } catch {} };
}
function handleRemote(msg) {
  switch (msg.type) {
    case "presence":
      msg.online ? online.add(msg.user) : online.delete(msg.user);
      renderChatList(); renderFriends(); renderAll();
      break;
    case "message":
      messages.push(msg.msg); save(); renderChatList();
      if (activeChat === msg.msg.from || activeChat === msg.msg.to) appendMessage(msg.msg);
      if (msg.msg.to === me) toast("💬 " + msg.msg.from + ": " + msg.msg.text.slice(0, 30));
      break;
    case "feed-new":
      feed.unshift(msg.post); save(); renderFeed(); break;
    case "feed-like":
      { const p = feed.find((x) => x.id === msg.id); if (p) { p.likes = msg.likes; renderFeed(); } break; }
    case "friends":
      if (users[msg.user]) { users[msg.user].friends = msg.friends; save(); renderChatList(); renderFriends(); }
      break;
    case "wallet":
      if (users[msg.user]) { users[msg.user].wallet = msg.wallet; save(); if (msg.user === me) $("balance").textContent = msg.wallet.toLocaleString(); }
      break;
    case "tx-new":
      txs.unshift(msg.tx); save(); if (msg.tx.from === me || msg.tx.to === me) renderTxs(); break;
    case "roster":
      (msg.users || []).forEach((u) => { if (u !== me) online.add(u); });
      renderChatList(); renderFriends(); renderAll();
      break;
  }
}
window.addEventListener("beforeunload", () => { if (me) broadcast({ type: "presence", user: me, online: false }); });

/* ---------- navigation ---------- */
document.querySelectorAll(".navbtn").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".navbtn").forEach((x) => x.classList.remove("is-active"));
    document.querySelectorAll(".tabpanel").forEach((x) => x.classList.remove("is-active"));
    b.classList.add("is-active");
    document.querySelector(`.tabpanel[data-panel="${b.dataset.tab}"]`).classList.add("is-active");
  });
});

/* ---------- chats ---------- */
function renderChatList() {
  const list = $("chatList");
  list.innerHTML = "";
  const peers = [...new Set(messages.map((m) => (m.from === me ? m.to : m.from))).concat(myFriends())];
  if (!peers.length) { list.innerHTML = `<li style="color:var(--muted);font-size:13px;cursor:default">No chats yet. Add friends!</li>`; return; }
  peers.forEach((name) => {
    const last = messages.filter((m) => (m.from === name && m.to === me) || (m.from === me && m.to === name)).slice(-1)[0];
    const li = document.createElement("li");
    if (name === activeChat) li.classList.add("is-active");
    li.innerHTML = `<div class="avatar" data-name="${esc(name)}">${av(name)}<span class="dot ${isOnline(name) ? "on" : ""}"></span></div>
      <div class="meta"><b>${esc(name)}</b><p>${last ? esc(last.text) : "Say hi 👋"}</p></div>`;
    li.addEventListener("click", () => openChat(name));
    list.appendChild(li);
  });
}
function openChat(name) {
  activeChat = name; renderChatList();
  const msgs = messages.filter((m) => (m.from === name && m.to === me) || (m.from === me && m.to === name));
  const thread = $("thread");
  thread.innerHTML = `<div class="thread__head">${esc(name)}</div>
    <div class="messages" id="msgBox"></div>
    <form class="composer" id="composer"><input id="msgInput" placeholder="Message ${esc(name)}…" autocomplete="off" /><button type="submit">Send</button></form>`;
  msgs.forEach(appendMessage); scrollMessages();
  $("composer").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = $("msgInput").value.trim(); if (!text) return;
    const msg = { from: me, to: name, text, ts: Date.now() };
    messages.push(msg); save(); broadcast({ type: "message", msg });
    if (activeChat === name) appendMessage(msg);
    $("msgInput").value = ""; renderChatList();
  });
}
function appendMessage(m) {
  const box = $("msgBox"); if (!box) return;
  const d = document.createElement("div");
  d.className = "msg " + (m.from === me ? "me" : "them");
  d.innerHTML = `${esc(m.text)}<span class="ts">${timeStr(m.ts)}</span>`;
  box.appendChild(d); scrollMessages();
}
function scrollMessages() { const b = $("msgBox"); if (b) b.scrollTop = b.scrollHeight; }

/* ---------- feed ---------- */
function renderFeed() {
  const list = $("feedList"); list.innerHTML = "";
  feed.forEach((p) => {
    const liked = p.likes.includes(me);
    const li = document.createElement("li"); li.className = "post";
    li.innerHTML = `<div class="post__head"><div class="avatar" style="width:34px;height:34px;font-size:14px">${av(p.author)}</div>
      <b>${esc(p.author)}</b><time>${dayStr(p.ts)} ${timeStr(p.ts)}</time></div>
      <div class="post__text">${esc(p.text)}</div>
      <button class="post__like ${liked ? "on" : ""}">${liked ? "❤" : "♡"} ${p.likes.length}</button>`;
    li.querySelector(".post__like").addEventListener("click", () => {
      const i = p.likes.indexOf(me); if (i >= 0) p.likes.splice(i, 1); else p.likes.push(me);
      save(); broadcast({ type: "feed-like", id: p.id, likes: p.likes }); renderFeed();
    });
    list.appendChild(li);
  });
}
$("postBtn").addEventListener("click", () => {
  const text = $("postInput").value.trim(); if (!text) return;
  const post = { id: nextId("p"), author: me, text, ts: Date.now(), likes: [] };
  feed.unshift(post); save(); broadcast({ type: "feed-new", post }); $("postInput").value = "";
});

/* ---------- friends ---------- */
function renderFriends() {
  const list = $("friendsList"); list.innerHTML = "";
  const fr = myFriends();
  if (!fr.length) list.innerHTML = `<li style="color:var(--muted);font-size:13px">No friends yet — add someone below.</li>`;
  fr.forEach((name) => {
    const li = document.createElement("li"); li.className = "person";
    li.innerHTML = `<div class="avatar" data-name="${esc(name)}" style="width:38px;height:38px">${av(name)}<span class="dot ${isOnline(name) ? "on" : ""}"></span></div>
      <div class="grow"><b>${esc(name)}</b><div class="status">${isOnline(name) ? "online" : "offline"}</div></div>
      <button class="mini" data-chat="${esc(name)}">Message</button>`;
    li.querySelector("[data-chat]").addEventListener("click", () => { document.querySelector('.navbtn[data-tab="chats"]').click(); openChat(name); });
    list.appendChild(li);
  });
}
function renderAll() {
  const list = $("allList"); list.innerHTML = "";
  Object.keys(users).filter((u) => u !== me).forEach((u) => {
    const li = document.createElement("li"); li.className = "person";
    const isFriend = myFriends().includes(u);
    li.innerHTML = `<div class="avatar" style="width:38px;height:38px">${av(u)}<span class="dot ${isOnline(u) ? "on" : ""}"></span></div>
      <div class="grow"><b>${esc(u)}</b><div class="status">${isOnline(u) ? "online" : "offline"}</div></div>
      <button class="mini" data-act="${esc(u)}">${isFriend ? "Friends" : "Add"}</button>`;
    li.querySelector("[data-act]").addEventListener("click", (e) => {
      if (isFriend) return;
      users[me].friends.push(u); users[u].friends.push(me); save();
      broadcast({ type: "friends", user: me, friends: users[me].friends });
      broadcast({ type: "friends", user: u, friends: users[u].friends });
      toast("Added " + u); renderChatList(); renderFriends();
    });
    list.appendChild(li);
  });
}
$("addFriendForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("friendInput").value.trim(); if (!name) return;
  if (!users[name]) { toast("User not found."); return; }
  if (name === me) { toast("That's you!"); return; }
  if (myFriends().includes(name)) { toast("Already friends."); return; }
  users[me].friends.push(name); users[name].friends.push(me); save();
  broadcast({ type: "friends", user: me, friends: users[me].friends });
  broadcast({ type: "friends", user: name, friends: users[name].friends });
  $("friendInput").value = ""; toast("Added " + name); renderChatList(); renderFriends();
});

/* ---------- wallet ---------- */
function renderTxs() {
  const list = $("txList"); list.innerHTML = "";
  if (!txs.length) { list.innerHTML = `<li style="color:var(--muted);font-size:13px">No transactions yet.</li>`; return; }
  txs.forEach((t) => {
    const inc = t.to === me;
    const li = document.createElement("li"); li.className = "tx";
    li.innerHTML = `<div class="txicon ${inc ? "in" : "out"}">${inc ? "↓" : "↑"}</div>
      <div><b>${inc ? "From " + esc(t.from) : "To " + esc(t.to)}</b><div class="txmeta">${t.note || (inc ? "received" : "sent")} · ${dayStr(t.ts)}</div></div>
      <div class="txamt ${inc ? "in" : "out"}">${inc ? "+" : "-"}${Number(t.amount).toLocaleString()} CXC</div>`;
    list.appendChild(li);
  });
}
$("sendForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const to = $("sendTo").value.trim(); const amount = Math.round(parseFloat($("sendAmount").value) * 100) / 100; const note = $("sendNote").value.trim();
  if (!users[to]) { toast("Recipient not found."); return; }
  if (to === me) { toast("Can't send to yourself."); return; }
  if (!(amount > 0)) { toast("Enter an amount > 0."); return; }
  if (users[me].wallet < amount) { toast("Insufficient balance."); return; }
  users[me].wallet -= amount; users[to].wallet += amount;
  const tx = { id: nextId("t"), from: me, to, amount, note, ts: Date.now() };
  txs.unshift(tx); save();
  broadcast({ type: "wallet", user: me, wallet: users[me].wallet });
  broadcast({ type: "wallet", user: to, wallet: users[to].wallet });
  broadcast({ type: "tx-new", tx });
  $("balance").textContent = users[me].wallet.toLocaleString();
  $("sendTo").value = ""; $("sendAmount").value = ""; $("sendNote").value = "";
  toast("Sent " + amount + " CXC to " + to); renderTxs();
});

/* ---------- theme ---------- */
(function () {
  const btn = $("themeToggle"); const root = document.documentElement;
  if (localStorage.getItem("mrichat-theme") === "light") { root.setAttribute("data-theme", "light"); btn.textContent = "☾"; }
  btn.addEventListener("click", () => {
    const isLight = root.getAttribute("data-theme") === "light";
    if (isLight) { root.removeAttribute("data-theme"); btn.textContent = "☀︎"; localStorage.setItem("mrichat-theme", "dark"); }
    else { root.setAttribute("data-theme", "light"); btn.textContent = "☾"; localStorage.setItem("mrichat-theme", "light"); }
  });
})();

/* ---------- boot ---------- */
load();
seed();
connectWS();
const saved = localStorage.getItem(KEYS.session);
if (saved && users[saved]) {
  me = saved;
  $("login").hidden = true; $("app").hidden = false;
  $("meName").textContent = me; $("meAvatar").textContent = av(me);
  $("balance").textContent = users[me].wallet.toLocaleString();
  renderChatList(); renderFeed(); renderFriends(); renderAll(); renderTxs();
  broadcast({ type: "presence", user: me, online: true });
  if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: "hello", user: me }));
} else {
  // leave login visible; clicking enter() wires everything
}
