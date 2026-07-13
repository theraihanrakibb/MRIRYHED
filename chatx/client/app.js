/* ------------------------------------------------------------------ *
 * MRIRYHED Chat — app page (WeChat / Telegram style)
 * Auth-gated (see login.js). Left sidebar: MRIRYHED Agent (default AI
 * contact) + friends. Menu drawer: feed / friends / invite / wallet /
 * profile. Realtime via the Node + WebSocket server when present, else
 * BroadcastChannel (same-browser demo). Simulated wallet.
 * ------------------------------------------------------------------ */
(function () {
  const $ = (id) => document.getElementById(id);
  const AGENT = "__agent__";
  const bc = ("BroadcastChannel" in window) ? new BroadcastChannel("mrichat") : null;
  let ws = null, wsTries = 0; const WS_MAX_TRIES = 6;

  const KEYS = {
    users: "mrichat-users", msg: "mrichat-msg", feed: "mrichat-feed",
    tx: "mrichat-tx", session: "mrichat-session", theme: "mrichat-theme",
  };

  /* ---------- auth gate ---------- */
  let me = localStorage.getItem(KEYS.session);
  const USERS = (function () { try { return JSON.parse(localStorage.getItem("mrichat-accounts") || "{}"); } catch { return {}; } })();
  // If the session is stale (account gone) clear it and land on login ONCE.
  // Returning to index.html with no session stops the login↔app redirect loop.
  if (!me || !USERS[me]) { localStorage.removeItem(KEYS.session); location.replace("index.html"); return; }

  /* ---------- state ---------- */
  let users = {}, messages = [], feed = [], txs = [], online = new Set(), activeChat = null, seq = 1;
  const nextId = (p) => p + "_" + Date.now() + "_" + seq++;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const av = (n) => (n ? n.trim().charAt(0).toUpperCase() : "?");
  const timeStr = (ts) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const isOnline = (n) => online.has(n) || n === me || n === AGENT;
  const myFriends = () => (users[me] ? users[me].friends : []);
  const toast = (m) => { const t = $("toast"); if (!t) return; t.textContent = m; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 2600); };

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
  function seed() {
    if (Object.keys(users).length) return;
    ["Maya", "Leo", "Priya", "Aria"].forEach((u) => (users[u] = { wallet: 5000, friends: [] }));
    users.Maya.friends = ["Leo"]; users.Leo.friends = ["Maya"];
    messages.push({ from: "Maya", to: "Leo", text: "Hey Leo, welcome to MRIRYHED! 👋", ts: Date.now() - 60000 });
    messages.push({ from: "Leo", to: "Maya", text: "This looks slick 🔥", ts: Date.now() - 30000 });
    feed.push({ id: nextId("p"), author: "Maya", text: "Just deployed my first project with MRIRYHED. Loving the vibe! ✨", ts: Date.now() - 120000, likes: ["Leo"] });
    feed.push({ id: nextId("p"), author: "Aria", text: "Anyone up for a quick call later? ☕", ts: Date.now() - 60000, likes: [] });
    txs.push({ id: nextId("t"), from: "Leo", to: "Maya", amount: 250, note: "lunch 🍜", ts: Date.now() - 90000 });
    users.Maya.wallet = 5250; users.Leo.wallet = 4750;
    save();
  }

  /* ---------- invite from URL ---------- */
  (function handleInvite() {
    const params = new URLSearchParams(location.search);
    const inv = params.get("invite");
    if (!inv || inv === me) return;
    if (!users[inv]) users[inv] = { wallet: 5000, friends: [] };
    if (!myFriends().includes(inv)) {
      myFriends().push(inv); users[inv].friends.push(me); save();
      setTimeout(() => toast("Added " + inv + " from your invite link 🤝"), 600);
    }
    history.replaceState({}, "", "app.html");
  })();

  /* ---------- broadcast / realtime ---------- */
  function broadcast(obj) {
    if (bc) bc.postMessage(obj);
    if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
  }
  if (bc) bc.onmessage = (e) => handleRemote(e.data);
  function connectWS() {
    if (!("WebSocket" in window)) return;
    const url = window.CHAT_RELAY ? window.CHAT_RELAY : (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host;
    if (wsTries >= WS_MAX_TRIES) return;
    try { ws = new WebSocket(url); } catch { return; }
    ws.onopen = () => { wsTries = 0; ws.send(JSON.stringify({ type: "hello", user: me })); };
    ws.onmessage = (e) => { try { handleRemote(JSON.parse(e.data)); } catch {} };
    ws.onclose = () => { ws = null; wsTries++; if (wsTries < WS_MAX_TRIES) setTimeout(connectWS, 3000); };
    ws.onerror = () => { try { ws.close(); } catch {} };
  }
  function handleRemote(msg) {
    switch (msg.type) {
      case "presence":
        msg.online ? online.add(msg.user) : online.delete(msg.user);
        renderConversations(); break;
      case "message":
        messages.push(msg.msg); save(); renderConversations();
        if (activeChat === msg.msg.from || activeChat === msg.msg.to) appendMessage(msg.msg);
        if (msg.msg.to === me && activeChat !== msg.msg.from) toast("💬 " + msg.msg.from + ": " + msg.msg.text.slice(0, 30));
        break;
      case "feed-new": feed.unshift(msg.post); save(); if (drawerView === "feed") renderDrawer(); break;
      case "feed-like": { const p = feed.find((x) => x.id === msg.id); if (p) { p.likes = msg.likes; if (drawerView === "feed") renderDrawer(); } break; }
      case "friends": if (users[msg.user]) { users[msg.user].friends = msg.friends; save(); renderConversations(); } break;
      case "wallet": if (users[msg.user]) { users[msg.user].wallet = msg.wallet; save(); if (drawerView === "wallet" && msg.user === me) renderDrawer(); } break;
      case "tx-new": txs.unshift(msg.tx); save(); if (msg.tx.from === me || msg.tx.to === me) { renderConversations(); if (drawerView === "wallet") renderDrawer(); } break;
      case "roster": (msg.users || []).forEach((u) => { if (u !== me) online.add(u); }); renderConversations(); break;
    }
  }

  /* ===================== SIDEBAR ===================== */
  function convPeers() {
    const set = new Set();
    myFriends().forEach((f) => set.add(f));
    messages.forEach((m) => { if (m.from === me) set.add(m.to); else if (m.to === me) set.add(m.from); });
    set.delete(AGENT); set.delete(me);
    return [...set].sort((a, b) => lastTs(b) - lastTs(a));
  }
  function lastTs(name) { const m = messages.filter((x) => (x.from === name && x.to === me) || (x.from === me && x.to === name)).slice(-1)[0]; return m ? m.ts : 0; }
  function lastText(name) { const m = messages.filter((x) => (x.from === name && x.to === me) || (x.from === me && x.to === name)).slice(-1)[0]; return m ? m.text : "Say hi 👋"; }

  /* diff-friendly: update list items in place so scroll position and the
     active highlight never flicker/jump when a new message arrives. */
  const convEls = {};
  function renderConversations() {
    const list = $("convList");
    if (!list) return;
    const keepTop = list.scrollTop;
    const convs = [{ name: AGENT, ai: true }].concat(convPeers().map((n) => ({ name: n })));
    const wanted = new Set(convs.map((c) => c.name));
    // drop conversations that no longer exist
    Object.keys(convEls).forEach((n) => {
      if (!wanted.has(n)) { convEls[n].remove(); delete convEls[n]; }
    });
    convs.forEach((c, i) => {
      const sub = c.ai ? "AI assistant" : lastText(c.name);
      const dot = c.ai ? "" : (isOnline(c.name) ? '<span class="dot on"></span>' : '<span class="dot"></span>');
      const icon = c.ai ? "🤖" : av(c.name);
      let li = convEls[c.name];
      if (!li) {
        li = document.createElement("li");
        li.className = "conv";
        li.addEventListener("click", () => openChat(c.name));
        convEls[c.name] = li;
      }
      li.classList.toggle("is-active", activeChat === c.name);
      const label = c.ai ? "MRIRYHED Agent" : c.name;
      li.innerHTML = `<span class="avatar ${c.ai ? "avatar--ai" : ""}">${icon}${dot}</span>
        <div class="conv__meta"><b>${esc(label)}</b><p>${esc(sub)}</p></div>`;
      const ref = list.children[i];
      if (ref !== li) list.insertBefore(li, ref || null);
    });
    list.scrollTop = keepTop;
  }

  function openChat(name) {
    activeChat = name;
    renderConversations();
    const thread = $("thread");
    const ai = name === AGENT;
    const msgs = messages.filter((m) => (m.from === name && m.to === me) || (m.from === me && m.to === name));
    thread.innerHTML = `
      <header class="thread__head">
        <span class="avatar ${ai ? "avatar--ai" : ""}">${ai ? "🤖" : av(name)}${ai ? "" : (isOnline(name) ? '<span class="dot on"></span>' : "")}</span>
        <div class="thread__who"><b>${ai ? "MRIRYHED Agent" : esc(name)}</b><span>${ai ? "AI assistant · powered by MRIRYHED" : (isOnline(name) ? "online" : "offline")}</span></div>
      </header>
      <div class="msgs" id="msgBox"></div>
      <form class="composer" id="composer">
        <input id="msgInput" placeholder="${ai ? "Ask MRIRYHED Agent…" : "Message " + esc(name) + "…"}" autocomplete="off" />
        <button type="submit">Send</button>
      </form>`;
    msgs.forEach(appendMessage);
    scrollMessages();
    $("composer").addEventListener("submit", (e) => {
      e.preventDefault();
      const text = $("msgInput").value.trim(); if (!text) return;
      const msg = { from: me, to: name, text, ts: Date.now() };
      messages.push(msg); save(); broadcast({ type: "message", msg });
      if (activeChat === name) appendMessage(msg);
      $("msgInput").value = ""; renderConversations();
      if (ai) setTimeout(() => agentRespond(text), 500);
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

  /* ===================== MRIRYHED AGENT ===================== */
  async function agentRespond(userText) {
    const typing = document.createElement("div");
    typing.className = "msg them"; typing.textContent = "…";
    const box = $("msgBox"); if (box) { box.appendChild(typing); scrollMessages(); }
    const reply = await agentReply(userText);
    if (typing.parentNode) typing.parentNode.removeChild(typing);
    const msg = { from: AGENT, to: me, text: reply, ts: Date.now() };
    messages.push(msg); save();
    if (activeChat === AGENT) appendMessage(msg);
    renderConversations();
  }
  async function agentReply(text) {
    const key = localStorage.getItem("mricode-ai-key");
    const base = localStorage.getItem("mricode-ai-base");
    const model = localStorage.getItem("mricode-ai-model");
    if (key && base) {
      try {
        const res = await fetch(base.replace(/\/$/, "") + "/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
          body: JSON.stringify({
            model: model || "gpt-4o-mini",
            messages: [{ role: "system", content: "You are MRIRYHED Agent, a friendly, concise AI assistant inside MRIRYHED Chat. Keep replies short and helpful." }, { role: "user", content: text }],
            temperature: 0.5,
          }),
        });
        if (res.ok) { const d = await res.json(); const r = d.choices?.[0]?.message?.content; if (r) return r; }
      } catch {}
    }
    return localAgent(text);
  }
  function localAgent(t) {
    const s = t.toLowerCase();
    if (/(hi|hello|hey|yo|sup)\b/.test(s)) return "Hey " + me + "! I'm MRIRYHED Agent 👋 Ask me anything — about MRIRYHED, your day, or just to chat.";
    if (/who are you|your name|what are you/.test(s)) return "I'm MRIRYHED Agent — your built-in assistant in MRIRYHED Chat. I can chat, help you find features, or just keep you company.";
    if (/help|how (do|to)|feature/.test(s)) return "Try: open a friend from the sidebar to chat, tap ☰ for Feed / Friends / Invite / Wallet, or use ✚ to start a new chat. Want me to explain any of these?";
    if (/weather/.test(s)) return "MRIRYHED Weather (another app in the suite) gives live, iPhone-style forecasts. Open it from the main portal.";
    if (/code|python|javascript|bug/.test(s)) return "For coding help, MRIRYHED Code has a built-in agent that runs JS & Python. Here I'm happy to chat or brainstorm!";
    if (/zodiac|horoscope|sign/.test(s)) return "Curious about signs? MRIRYHED Zodiac profiles your Western + Chinese signs and MBTI, plus a Cosmic Match. 🔮";
    if (/friend|invite/.test(s)) return "Tap ✚ (or ☰ → Friends / Invite) to add or invite friends. They'll show up right here on the left.";
    if (/bye|goodbye/.test(s)) return "Catch you later, " + me + "! I'm always one tap away. 👋";
    if (/\?$/.test(s)) return "Good question! In short: MRIRYHED Chat keeps your conversations, feed and wallet together — and I'm here whenever you need a hand.";
    return "Got it. I'm MRIRYHED Agent — tell me more and I'll do my best to help! 😊";
  }

  /* ===================== DRAWER (feed/wallet/friends/invite/profile) ===================== */
  let drawerView = "feed";
  function openDrawer(view) { drawerView = view || "feed"; $("drawer").hidden = false; $("scrim").hidden = false; renderDrawer(); }
  function closeDrawer() { $("drawer").hidden = true; $("scrim").hidden = true; }
  function renderDrawer() {
    document.querySelectorAll(".dnav").forEach((b) => b.classList.toggle("is-active", b.dataset.view === drawerView));
    const body = $("drawerBody");
    if (drawerView === "feed") return renderFeed(body);
    if (drawerView === "friends") return renderFriends(body);
    if (drawerView === "wallet") return renderWallet(body);
    if (drawerView === "invite") return renderInvite(body);
    if (drawerView === "profile") return renderProfile(body);
  }

  function renderFeed(body) {
    body.innerHTML = `
      <div class="compose"><textarea id="postInput" placeholder="Share something with your world…" maxlength="600"></textarea><button id="postBtn">Post</button></div>
      <ul class="feed" id="feedList"></ul>`;
    const ul = body.querySelector("#feedList");
    feed.forEach((p) => ul.appendChild(feedItem(p)));
    body.querySelector("#postBtn").addEventListener("click", () => {
      const v = body.querySelector("#postInput").value.trim(); if (!v) return;
      const post = { id: nextId("p"), author: me, text: v, ts: Date.now(), likes: [] };
      feed.unshift(post); save(); broadcast({ type: "feed-new", post });
      body.querySelector("#postInput").value = ""; renderFeed(body);
    });
  }
  function feedItem(p) {
    const li = document.createElement("li"); li.className = "feed__item";
    const liked = p.likes.includes(me);
    li.innerHTML = `<div class="feed__top"><b>${esc(p.author)}</b><span>${timeStr(p.ts)}</span></div>
      <p>${esc(p.text)}</p>
      <button class="like ${liked ? "is-on" : ""}">♥ ${p.likes.length}</button>`;
    li.querySelector(".like").addEventListener("click", () => {
      const i = p.likes.indexOf(me); if (i >= 0) p.likes.splice(i, 1); else p.likes.push(me);
      save(); broadcast({ type: "feed-like", id: p.id, likes: p.likes }); renderFeed($("drawerBody"));
    });
    return li;
  }

  function renderFriends(body) {
    body.innerHTML = `
      <form class="addfriend" id="addFriendForm"><input id="friendInput" placeholder="Add friend by username" autocomplete="off" /><button type="submit">Add</button></form>
      <h3 class="subhead">Your friends</h3><ul class="people" id="friendsList"></ul>
      <h3 class="subhead">Everyone on MRIRYHED</h3><ul class="people" id="allList"></ul>`;
    const fl = body.querySelector("#friendsList");
    myFriends().forEach((f) => fl.appendChild(personItem(f)));
    const al = body.querySelector("#allList");
    Object.keys(users).filter((u) => u !== me && !myFriends().includes(u)).forEach((u) => al.appendChild(personItem(u)));
    body.querySelector("#addFriendForm").addEventListener("submit", (e) => {
      e.preventDefault(); const n = body.querySelector("#friendInput").value.trim(); if (!n || n === me) return;
      if (!users[n]) users[n] = { wallet: 5000, friends: [] };
      if (!myFriends().includes(n)) { myFriends().push(n); users[n].friends.push(me); save(); broadcast({ type: "friends", user: me, friends: myFriends() }); broadcast({ type: "friends", user: n, friends: users[n].friends }); toast("Added " + n); }
      body.querySelector("#friendInput").value = ""; renderFriends(body); renderConversations();
    });
  }
  function personItem(u) {
    const li = document.createElement("li"); li.className = "person";
    const isFriend = myFriends().includes(u);
    li.innerHTML = `<span class="avatar">${av(u)}<span class="dot ${isOnline(u) ? "on" : ""}"></span></span>
      <div class="grow"><b>${esc(u)}</b><div class="status">${isOnline(u) ? "online" : "offline"}</div></div>
      <button class="mini" ${isFriend ? "disabled" : ""}>${isFriend ? "Friends" : "Add"}</button>`;
    if (!isFriend) li.querySelector("button").addEventListener("click", () => {
      if (!users[u]) users[u] = { wallet: 5000, friends: [] };
      myFriends().push(u); users[u].friends.push(me); save();
      broadcast({ type: "friends", user: me, friends: myFriends() }); broadcast({ type: "friends", user: u, friends: users[u].friends });
      toast("Added " + u); renderFriends($("drawerBody")); renderConversations();
    });
    return li;
  }

  function renderWallet(body) {
    body.innerHTML = `
      <div class="balance"><span class="balance__label">Balance</span><span class="balance__amount" id="balance">${users[me].wallet.toLocaleString()}</span><span class="balance__cur">CXC</span></div>
      <form class="send" id="sendForm"><input id="sendTo" placeholder="To (username)" autocomplete="off" /><input id="sendAmount" type="number" step="0.01" min="0" placeholder="Amount" /><input id="sendNote" placeholder="Note (optional)" maxlength="120" autocomplete="off" /><button type="submit">Send</button></form>
      <h3 class="subhead">Transactions</h3><ul class="txs" id="txList"></ul>`;
    const ul = body.querySelector("#txList");
    txs.forEach((t) => ul.appendChild(txItem(t)));
    body.querySelector("#sendForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const to = body.querySelector("#sendTo").value.trim(), amt = parseFloat(body.querySelector("#sendAmount").value), note = body.querySelector("#sendNote").value.trim();
      if (!to || to === me) return toast("Enter a valid recipient.");
      if (!(amt > 0)) return toast("Enter an amount.");
      if (users[me].wallet < amt) return toast("Not enough CXC.");
      if (!users[to]) users[to] = { wallet: 5000, friends: [] };
      users[me].wallet -= amt; users[to].wallet += amt;
      const tx = { id: nextId("t"), from: me, to, amount: amt, note, ts: Date.now() };
      txs.unshift(tx); save(); broadcast({ type: "tx-new", tx }); broadcast({ type: "wallet", user: me, wallet: users[me].wallet }); broadcast({ type: "wallet", user: to, wallet: users[to].wallet });
      body.querySelector("#sendTo").value = ""; body.querySelector("#sendAmount").value = ""; body.querySelector("#sendNote").value = "";
      body.querySelector("#balance").textContent = users[me].wallet.toLocaleString();
      renderWallet(body); renderConversations(); toast("Sent " + amt + " CXC to " + to);
    });
  }
  function txItem(t) {
    const li = document.createElement("li"); li.className = "tx";
    const out = t.from === me;
    li.innerHTML = `<span class="tx__dir">${out ? "↑" : "↓"}</span><div class="grow"><b>${out ? "To " + esc(t.to) : "From " + esc(t.from)}</b><span>${esc(t.note || "")}</span></div><b class="tx__amt ${out ? "out" : "in"}">${out ? "-" : "+"}${t.amount} CXC</b>`;
    return li;
  }

  function renderInvite(body) {
    const link = location.origin + location.pathname.replace(/index\.html$|app\.html$/, "") + "index.html?invite=" + encodeURIComponent(me);
    body.innerHTML = `
      <p class="invite__copy">Share this link — when a friend opens it and logs in, you're automatically friends.</p>
      <div class="invite__row"><input id="inviteLink" readonly value="${esc(link)}" /><button id="copyInvite">Copy</button></div>
      <p class="invite__hint">Tip: your invite code is <b>${esc(me)}</b>. Friends can also add you by username.</p>`;
    body.querySelector("#copyInvite").addEventListener("click", () => {
      const inp = body.querySelector("#inviteLink"); inp.select();
      navigator.clipboard ? navigator.clipboard.writeText(inp.value).then(() => toast("Invite link copied!")) : (document.execCommand("copy"), toast("Invite link copied!"));
    });
  }

  function renderProfile(body) {
    body.innerHTML = `
      <div class="profile">
        <span class="avatar avatar--lg">${av(me)}</span>
        <h3>${esc(me)}</h3>
        <p class="status">${isOnline(me) ? "online" : "offline"} · MRIRYHED Chat</p>
        <button class="btn" id="logoutBtn">Log out</button>
      </div>`;
    body.querySelector("#logoutBtn").addEventListener("click", () => {
      localStorage.removeItem(KEYS.session); location.replace("index.html");
    });
  }

  /* ===================== events ===================== */
  $("menuBtn").addEventListener("click", () => openDrawer("feed"));
  $("drawerClose").addEventListener("click", closeDrawer);
  $("scrim").addEventListener("click", closeDrawer);
  document.querySelectorAll(".dnav").forEach((b) => b.addEventListener("click", () => openDrawer(b.dataset.view)));
  $("newChatBtn").addEventListener("click", () => openDrawer("friends"));
  $("searchInput").addEventListener("input", () => {
    const q = $("searchInput").value.trim().toLowerCase();
    document.querySelectorAll("#convList .conv").forEach((li) => {
      const name = li.querySelector("b").textContent.toLowerCase();
      li.style.display = !q || name.includes(q) ? "" : "none";
    });
  });
  (function theme() {
    const btn = $("themeToggle"), root = document.documentElement;
    if (localStorage.getItem(KEYS.theme) === "light") { root.setAttribute("data-theme", "light"); btn.textContent = "☾"; }
    btn.addEventListener("click", () => {
      const isLight = root.getAttribute("data-theme") === "light";
      if (isLight) { root.removeAttribute("data-theme"); btn.textContent = "☀︎"; localStorage.setItem(KEYS.theme, "dark"); }
      else { root.setAttribute("data-theme", "light"); btn.textContent = "☾"; localStorage.setItem(KEYS.theme, "light"); }
    });
  })();

  /* ===================== boot ===================== */
  load(); seed(); connectWS();
  $("meName").textContent = me; $("meAvatar").textContent = av(me);
  renderConversations();
  broadcast({ type: "presence", user: me, online: true });
  window.addEventListener("beforeunload", () => broadcast({ type: "presence", user: me, online: false }));
})();
