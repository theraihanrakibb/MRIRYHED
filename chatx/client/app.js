/* ------------------------------------------------------------------ *
 * MRIRYHED Chat — app page (WeChat / Telegram style)
 * Auth-gated (see login.js). Left sidebar: MRIRYHED Agent (default AI
 * contact) + friends + chats. Menu drawer: feed / friends / invite /
 * wallet / profile. Realtime via the Node + WebSocket server when present,
 * else BroadcastChannel (same-browser demo). Simulated wallet. Local-only.
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
  if (!me || !USERS[me]) { localStorage.removeItem(KEYS.session); location.replace("index.html"); return; }

  /* ---------- state ---------- */
  let users = {}, messages = [], feed = [], txs = [], online = new Set(), activeChat = null, seq = 1;
  const nextId = (p) => p + "_" + Date.now() + "_" + seq++;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const av = (n) => (n ? n.trim().charAt(0).toUpperCase() : "?");
  const timeStr = (ts) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const isOnline = (n) => online.has(n) || n === me || n === AGENT;
  const myFriends = () => (users[me] ? users[me].friends : []);
  const myUnread = () => (users[me] ? (users[me].unread = users[me].unread || {}) : {});
  const myArchived = () => (users[me] ? (users[me].archived = users[me].archived || []) : []);
  const toast = (m) => { const t = $("toast"); if (!t) return; t.textContent = m; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 2600); };

  /* ---------- persistence ---------- */
  function load() {
    users = JSON.parse(localStorage.getItem(KEYS.users) || "null") || {};
    messages = JSON.parse(localStorage.getItem(KEYS.msg) || "[]");
    feed = JSON.parse(localStorage.getItem(KEYS.feed) || "[]");
    txs = JSON.parse(localStorage.getItem(KEYS.tx) || "[]");
    if (!users[me]) users[me] = { wallet: 5000, friends: [], unread: {}, archived: [] };
  }
  function save() {
    localStorage.setItem(KEYS.users, JSON.stringify(users));
    localStorage.setItem(KEYS.msg, JSON.stringify(messages));
    localStorage.setItem(KEYS.feed, JSON.stringify(feed));
    localStorage.setItem(KEYS.tx, JSON.stringify(txs));
  }
  function seed() {
    // No fake demo users. New accounts start clean with only the MRIRYHED Agent.
    if (!users[me]) users[me] = { wallet: 5000, friends: [], unread: {}, archived: [] };
    save();
  }

  /* ---------- invite from URL ---------- */
  (function handleInvite() {
    const params = new URLSearchParams(location.search);
    const inv = params.get("invite");
    if (!inv || inv === me) return;
    if (!users[inv]) users[inv] = { wallet: 5000, friends: [], unread: {}, archived: [] };
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
      case "message": {
        messages.push(msg.msg); save();
        if (msg.msg.to === me && activeChat !== msg.msg.from) {
          const u = myUnread(); u[msg.msg.from] = (u[msg.msg.from] || 0) + 1; save();
        }
        renderConversations();
        if (activeChat === msg.msg.from || activeChat === msg.msg.to) appendMessage(msg.msg);
        if (msg.msg.to === me && activeChat !== msg.msg.from) toast("💬 " + msg.msg.from + ": " + (msg.msg.text || mediaLabel(msg.msg.kind)));
        break;
      }
      case "feed-new": feed.unshift(msg.post); save(); if (drawerView === "feed") renderDrawer(); break;
      case "feed-like": { const p = feed.find((x) => x.id === msg.id); if (p) { p.likes = msg.likes; if (drawerView === "feed") renderDrawer(); } break; }
      case "friends": if (users[msg.user]) { users[msg.user].friends = msg.friends; save(); renderConversations(); } break;
      case "wallet": if (users[msg.user]) { users[msg.user].wallet = msg.wallet; save(); if (drawerView === "wallet" && msg.user === me) renderDrawer(); } break;
      case "tx-new": txs.unshift(msg.tx); save(); if (msg.tx.from === me || msg.tx.to === me) { renderConversations(); if (drawerView === "wallet") renderDrawer(); } break;
      case "roster": (msg.users || []).forEach((u) => { if (u !== me) online.add(u); }); renderConversations(); break;
    }
  }
  function mediaLabel(kind) {
    return ({ image: "📷 Photo", video: "🎬 Video", audio: "🎤 Voice message", sticker: "⭐ Sticker" })[kind] || "Message";
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
  function lastText(name) { const m = messages.filter((x) => (x.from === name && x.to === me) || (x.from === me && x.to === name)).slice(-1)[0]; return m ? (m.text || mediaLabel(m.kind)) : "No messages yet"; }

  const convEls = {};
  function renderConversations() {
    const list = $("convList");
    if (!list) return;
    const keepTop = list.scrollTop;
    const archived = myArchived();
    const activePeers = convPeers().filter((n) => !archived.includes(n));
    const archivedPeers = convPeers().filter((n) => archived.includes(n));
    const convs = [{ name: AGENT, ai: true }].concat(activePeers.map((n) => ({ name: n })));
    const wanted = new Set(convs.map((c) => c.name));
    // drop conversation rows that no longer belong (including stale archived rows)
    Object.keys(convEls).forEach((k) => {
      const base = k.startsWith("arc_") ? k.slice(4) : k;
      const wantedNow = k.startsWith("arc_") ? archived.includes(base) : wanted.has(base);
      if (!wantedNow) { convEls[k].remove(); delete convEls[k]; }
    });
    const unread = myUnread();
    convs.forEach((c, i) => {
      const sub = c.ai ? "AI assistant" : lastText(c.name);
      const dot = c.ai ? "" : (isOnline(c.name) ? '<span class="dot on"></span>' : '<span class="dot"></span>');
      const icon = c.ai ? "🤖" : av(c.name);
      const badge = (!c.ai && unread[c.name] > 0) ? `<span class="badge">${unread[c.name] > 99 ? "99+" : unread[c.name]}</span>` : "";
      let li = convEls[c.name];
      if (!li) {
        li = document.createElement("li");
        li.className = "conv";
        li.addEventListener("click", (e) => { if (e.target.closest(".conv__menu")) return; openChat(c.name); });
        const menuBtn = document.createElement("button");
        menuBtn.className = "conv__menu"; menuBtn.title = "More"; menuBtn.textContent = "⋯";
        menuBtn.addEventListener("click", (e) => { e.stopPropagation(); openConvMenu(e, c.name); });
        li.appendChild(menuBtn);
        convEls[c.name] = li;
      }
      li.classList.toggle("is-active", activeChat === c.name);
      const label = c.ai ? "MRIRYHED" : c.name;
      const inner = document.createElement("div");
      inner.className = "conv__inner";
      inner.innerHTML = `<span class="avatar ${c.ai ? "avatar--ai" : ""}">${icon}${dot}</span>
        <div class="conv__meta"><b>${esc(label)}</b><p>${esc(sub)}</p></div>${badge}`;
      const old = li.querySelector(".conv__inner");
      if (old) li.replaceChild(inner, old); else li.insertBefore(inner, li.firstChild);
      const ref = list.children[i];
      if (ref !== li) list.insertBefore(li, ref || null);
    });
    // archived section
    if (archivedPeers.length) {
      let head = $("archivedHead");
      if (!head) { head = document.createElement("li"); head.id = "archivedHead"; head.className = "conv__sep"; head.textContent = "Archived"; list.appendChild(head); }
      archivedPeers.forEach((n) => {
        const sub = lastText(n);
        const dot = isOnline(n) ? '<span class="dot on"></span>' : '<span class="dot"></span>';
        let li = convEls["arc_" + n];
        if (!li) { li = document.createElement("li"); li.className = "conv conv--archived"; li.addEventListener("click", () => openChat(n)); convEls["arc_" + n] = li; }
        li.innerHTML = `<span class="avatar">${av(n)}${dot}</span><div class="conv__meta"><b>${esc(n)}</b><p>${esc(sub)}</p></div>`;
        list.appendChild(li);
      });
    }
    list.scrollTop = keepTop;
  }

  function openConvMenu(e, name) {
    const archived = myArchived();
    const items = [
      { label: "Mark as read", onClick: () => { const u = myUnread(); u[name] = 0; save(); renderConversations(); } },
      archived.includes(name)
        ? { label: "Unarchive", onClick: () => { const a = myArchived(); const i = a.indexOf(name); if (i >= 0) a.splice(i, 1); save(); renderConversations(); toast("Unarchived " + name); } }
        : { label: "Archive", onClick: () => { const a = myArchived(); if (!a.includes(name)) a.push(name); const u = myUnread(); u[name] = 0; save(); if (activeChat === name) showWelcome(); renderConversations(); toast("Archived " + name); } },
      { label: "Delete chat", danger: true, onClick: () => {
          if (!confirm("Delete this chat with " + name + "? Messages will be removed.")) return;
          messages = messages.filter((m) => !((m.from === me && m.to === name) || (m.from === name && m.to === me)));
          const u = myUnread(); delete u[name];
          const a = myArchived(); const ai = a.indexOf(name); if (ai >= 0) a.splice(ai, 1);
          save(); if (activeChat === name) showWelcome(); renderConversations(); toast("Chat deleted");
        } },
    ];
    popupMenu(e.clientX, e.clientY, items);
  }

  function showWelcome() {
    activeChat = null; renderConversations();
    const thread = $("thread");
    thread.innerHTML = `
      <div class="thread__welcome" id="welcome">
        <div class="welcome__logo">M</div>
        <h2>Welcome to Chat</h2>
        <p>Pick a conversation on the left — or start with <b>MRIRYHED</b>, your built-in AI assistant.</p>
      </div>`;
  }

  function openChat(name) {
    activeChat = name;
    const u = myUnread(); u[name] = 0; save();
    renderConversations();
    const thread = $("thread");
    const ai = name === AGENT;
    const msgs = messages.filter((m) => (m.from === name && m.to === me) || (m.from === me && m.to === name));
    thread.innerHTML = `
      <header class="thread__head">
        <button class="iconbtn thread__back" id="backBtn" title="Back">‹</button>
        <span class="avatar ${ai ? "avatar--ai" : ""}">${ai ? "🤖" : av(name)}${ai ? "" : (isOnline(name) ? '<span class="dot on"></span>' : "")}</span>
        <div class="thread__who"><b>${ai ? "MRIRYHED" : esc(name)}</b><span>${ai ? "AI assistant · powered by MRIRYHED" : (isOnline(name) ? "online" : "offline")}</span></div>
        <button class="iconbtn thread__call" data-call="voice" title="Voice call">📞</button><button class="iconbtn thread__call" data-call="video" title="Video call">📹</button>
      </header>
      <div class="msgs" id="msgBox"></div>
      <form class="composer" id="composer">
        <div class="composer__tools">
          <button type="button" class="tool" data-act="emoji" title="Emoji">😊</button>
          <button type="button" class="tool" data-act="sticker" title="Stickers">⭐</button>
          <button type="button" class="tool" data-act="image" title="Photo">🖼️</button>
          <button type="button" class="tool" data-act="video" title="Video">🎬</button>
          <button type="button" class="tool" id="voiceBtn" data-act="voice" title="Voice message">🎤</button>
        </div>
        <div class="composer__row">
          <input id="msgInput" placeholder="${ai ? "Ask MRIRYHED…" : "Message " + esc(name) + "…"}" autocomplete="off" />
          <button type="submit" class="sendbtn">Send</button>
        </div>
      </form>
      <input type="file" id="imgInput" accept="image/*" hidden />
      <input type="file" id="vidInput" accept="video/*" hidden />`;
    msgs.forEach(appendMessage);
    scrollMessages();

    $("backBtn").addEventListener("click", showWelcome);
    thread.querySelectorAll(".thread__call").forEach((b) => b.addEventListener("click", () => openCall(b.dataset.call, name)));

    // composer toolbar
    const composer = $("composer");
    composer.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = $("msgInput").value.trim(); if (!text) return;
      sendText(text);
      $("msgInput").value = "";
    });
    wireComposerTools(name, ai);

    if (!ai) startTypingObserver(name);
  }

  function sendText(text) {
    const name = activeChat; if (!name) return;
    const msg = { id: nextId("m"), from: me, to: name, text, ts: Date.now(), kind: "text" };
    messages.push(msg); save(); broadcast({ type: "message", msg });
    if (activeChat === name) appendMessage(msg);
    renderConversations();
    if (name === AGENT) setTimeout(() => agentRespond(text), 500);
  }
  function sendMedia(kind, data, label) {
    const name = activeChat; if (!name) return;
    const msg = { id: nextId("m"), from: me, to: name, kind, data, ts: Date.now() };
    messages.push(msg); save(); broadcast({ type: "message", msg });
    if (activeChat === name) appendMessage(msg);
    renderConversations();
    if (name === AGENT) setTimeout(() => agentRespond(label || "nice"), 500);
  }

  function appendMessage(m) {
    const box = $("msgBox"); if (!box) return;
    const d = document.createElement("div");
    d.className = "msg " + (m.from === me ? "me" : "them");
    let body = "";
    if (m.kind === "image") body = `<img class="msg-media" src="${esc(m.data)}" alt="photo" />`;
    else if (m.kind === "video") body = `<video class="msg-media" src="${esc(m.data)}" controls></video>`;
    else if (m.kind === "audio") body = `<audio class="msg-audio" src="${esc(m.data)}" controls></audio>`;
    else if (m.kind === "sticker") body = `<div class="sticker">${esc(m.data)}</div>`;
    else body = esc(m.text || "");
    d.innerHTML = body + `<span class="ts">${timeStr(m.ts)}</span>`;
    box.appendChild(d); scrollMessages();
  }
  function scrollMessages() { const b = $("msgBox"); if (b) b.scrollTop = b.scrollHeight; }

  /* typing indicator for real (non-agent) peers */
  let typingTimer = null;
  function startTypingObserver() { /* placeholder for future real-time typing */ }

  /* ===================== COMPOSER TOOLS ===================== */
  const EMOJIS = "😀 😁 😂 🤣 😊 😍 😘 😎 🤔 😴 🙄 😭 😡 👍 👎 👏 🙏 💪 🤝 ❤️ 💔 🔥 ✨ 🎉 💯 🚀 🌟 ⭐ 💡 💬 📷 🎬 🎤 💰 🍕 ☕ 🐱 🌈 💜 👋 🤩 😇".split(" ");
  const STICKERS = ["😺", "🐶", "🦄", "👻", "👽", "🤖", "💩", "🔥", "💖", "🎉", "🌟", "😂"];

  function wireComposerTools(name, ai) {
    const composer = $("composer"); if (!composer) return;
    const emojiPop = $("emojiPop"), stickerPop = $("stickerPop");
    composer.querySelectorAll(".tool").forEach((btn) => {
      btn.addEventListener("click", () => {
        const act = btn.dataset.act;
        if (act === "emoji") { buildEmojiPop(); togglePop(emojiPop, stickerPop); }
        else if (act === "sticker") { buildStickerPop(); togglePop(stickerPop, emojiPop); }
        else if (act === "image") $("imgInput").click();
        else if (act === "video") $("vidInput").click();
        else if (act === "voice") toggleVoice(btn);
      });
    });
    // file inputs
    $("imgInput").addEventListener("change", (e) => { const f = e.target.files[0]; if (f) fileToDataURL(f, (d) => sendMedia("image", d, "📷 Photo")); e.target.value = ""; hidePops(); });
    $("vidInput").addEventListener("change", (e) => { const f = e.target.files[0]; if (f) fileToDataURL(f, (d) => sendMedia("video", d, "🎬 Video")); e.target.value = ""; hidePops(); });
  }
  function togglePop(pop, other) { other.hidden = true; pop.hidden = !pop.hidden; if (!pop.hidden) positionPop(pop); }
  function hidePops() { const a = $("emojiPop"), b = $("stickerPop"); if (a) a.hidden = true; if (b) b.hidden = true; }
  function outsidePops(e) {
    const ep = $("emojiPop"), sp = $("stickerPop");
    if (ep && !e.target.closest(".emoji-pop") && !e.target.closest('[data-act="emoji"]')) ep.hidden = true;
    if (sp && !e.target.closest(".sticker-pop") && !e.target.closest('[data-act="sticker"]')) sp.hidden = true;
  }
  function positionPop(pop) {
    const tool = document.querySelector(".composer__tools");
    const w = pop.offsetWidth, h = pop.offsetHeight;
    let left = 16, bottom = 76;
    if (tool) { const r = tool.getBoundingClientRect(); left = r.left; bottom = window.innerHeight - r.top + 8; }
    left = Math.max(12, Math.min(left, window.innerWidth - w - 12));
    bottom = Math.max(12, Math.min(bottom, window.innerHeight - h - 12));
    pop.style.left = left + "px"; pop.style.bottom = bottom + "px";
  }
  function buildEmojiPop() {
    let pop = $("emojiPop"); if (!pop) { pop = document.createElement("div"); pop.id = "emojiPop"; pop.className = "emoji-pop"; pop.hidden = true; document.body.appendChild(pop); }
    if (pop.childElementCount) return;
    EMOJIS.forEach((em) => { const s = document.createElement("button"); s.type = "button"; s.className = "emoji-cell"; s.textContent = em; s.addEventListener("click", () => { const i = $("msgInput"); if (i) { i.value += em; i.focus(); } }); pop.appendChild(s); });
  }
  function buildStickerPop() {
    let pop = $("stickerPop"); if (!pop) { pop = document.createElement("div"); pop.id = "stickerPop"; pop.className = "sticker-pop"; pop.hidden = true; document.body.appendChild(pop); }
    if (pop.childElementCount) return;
    STICKERS.forEach((em) => { const s = document.createElement("button"); s.type = "button"; s.className = "sticker-cell"; s.textContent = em; s.addEventListener("click", () => { sendMedia("sticker", em); hidePops(); }); pop.appendChild(s); });
  }
  function fileToDataURL(file, cb) {
    const r = new FileReader();
    r.onload = () => cb(r.result);
    r.onerror = () => toast("Could not read file");
    r.readAsDataURL(file);
  }

  /* voice recording */
  let mediaRec = null, mediaStream = null, recording = false;
  function toggleVoice(btn) {
    if (recording) { stopVoice(btn); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) { toast("Recording not supported here"); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      mediaStream = stream; mediaRec = new MediaRecorder(stream); const chunks = [];
      mediaRec.ondataavailable = (e) => chunks.push(e.data);
      mediaRec.onstop = () => {
        const blob = new Blob(chunks); const r = new FileReader();
        r.onload = () => sendMedia("audio", r.result, "🎤 Voice message");
        r.readAsDataURL(blob); stream.getTracks().forEach((t) => t.stop());
      };
      mediaRec.start(); recording = true;
      btn.classList.add("is-rec"); btn.textContent = "⏹";
      toast("Recording… tap 🎤 again to send");
    }).catch(() => toast("Microphone permission denied"));
  }
  function stopVoice(btn) {
    if (mediaRec && mediaRec.state !== "inactive") mediaRec.stop();
    recording = false; btn.classList.remove("is-rec"); btn.textContent = "🎤";
  }

  /* ===================== CALLS (simulated) ===================== */
  function openCall(type, name) {
    let modal = $("callModal");
    if (!modal) {
      modal = document.createElement("div"); modal.id = "callModal"; modal.className = "call-modal"; modal.hidden = true;
      document.body.appendChild(modal);
    }
    modal.innerHTML = `
      <div class="call__card">
        <span class="avatar avatar--lg">${av(name)}</span>
        <h3>${esc(name)}</h3>
        <p class="call__status" id="callStatus">Calling…</p>
        <div class="call__timer" id="callTimer">00:00</div>
        <div class="call__actions">
          <button class="call__btn call__mute" id="callMute" title="Mute">🎙️</button>
          ${type === "video" ? '<div class="call__video">📹 video call (demo)</div>' : ""}
          <button class="call__btn call__end" id="callEnd" title="End">📞</button>
        </div>
      </div>`;
    modal.hidden = false;
    let secs = 0; const timer = setInterval(() => { secs++; const m = String(Math.floor(secs / 60)).padStart(2, "0"); const s = String(secs % 60).padStart(2, "0"); const t = $("callTimer"); if (t) t.textContent = m + ":" + s; }, 1000);
    setTimeout(() => { const st = $("callStatus"); if (st) st.textContent = type === "video" ? "Video call connected" : "Voice call connected"; }, 1400);
    $("callEnd").addEventListener("click", () => { clearInterval(timer); modal.hidden = true; toast((type === "video" ? "Video" : "Voice") + " call ended"); });
    $("callMute").addEventListener("click", () => { const b = $("callMute"); b.classList.toggle("is-muted"); b.textContent = b.classList.contains("is-muted") ? "🔇" : "🎙️"; });
  }

  /* ===================== MRIRYHED AGENT ===================== */
  async function agentRespond(userText) {
    const typing = document.createElement("div");
    typing.className = "msg them"; typing.textContent = "…";
    const box = $("msgBox"); if (box) { box.appendChild(typing); scrollMessages(); }
    const reply = await agentReply(userText);
    if (typing.parentNode) typing.parentNode.removeChild(typing);
    const msg = { id: nextId("m"), from: AGENT, to: me, text: reply, ts: Date.now(), kind: "text" };
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
    if (/(hi|hello|hey|yo|sup)\b/.test(s)) return "Hey " + me + "! I'm MRIRYHED 👋 Ask me anything, or use the toolbar below to send stickers, photos, voice & more.";
    if (/who are you|your name|what are you/.test(s)) return "I'm MRIRYHED — your built-in assistant in MRIRYHED Chat. I can chat, help you find features, or just keep you company.";
    if (/help|how (do|to)|feature/.test(s)) return "Try: open a friend from the sidebar to chat, tap ☰ for Feed / Friends / Invite / Wallet, or use ✚ to add friends. The composer has emoji, stickers, photo, video and voice. Want me to explain any?";
    if (/weather/.test(s)) return "MRIRYHED Weather gives live, iPhone-style forecasts. Open it from the main portal.";
    if (/code|python|javascript|bug/.test(s)) return "For coding help, MRIRYHED Code has a built-in agent. Here I'm happy to chat or brainstorm!";
    if (/zodiac|horoscope|sign/.test(s)) return "Curious about signs? MRIRYHED Zodiac profiles your Western + Chinese signs and MBTI, plus a Cosmic Match. 🔮";
    if (/friend|invite/.test(s)) return "Tap ✚ (or ☰ → Friends / Invite) to add or invite friends. They'll show up right here on the left.";
    if (/sticker|emoji|photo|voice|video|call/.test(s)) return "Use the toolbar under the message box: 😊 emoji, ⭐ stickers, 🖼️ photo, 🎬 video, 🎤 voice, and 📞/📹 to call.";
    if (/bye|goodbye/.test(s)) return "Catch you later, " + me + "! I'm always one tap away. 👋";
    if (/\?$/.test(s)) return "Good question! In short: MRIRYHED Chat keeps your conversations, feed and wallet together — and I'm here whenever you need a hand.";
    return "Got it. I'm MRIRYHED — tell me more and I'll do my best to help! 😊";
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
      <h3 class="subhead">Your friends</h3><ul class="people" id="friendsList"></ul>`;
    const fl = body.querySelector("#friendsList");
    if (!myFriends().length) fl.innerHTML = '<li class="person-empty">No friends yet — add one above or share your invite link (☰ → Invite).</li>';
    myFriends().forEach((f) => fl.appendChild(personItem(f)));
    body.querySelector("#addFriendForm").addEventListener("submit", (e) => {
      e.preventDefault(); const n = body.querySelector("#friendInput").value.trim(); if (!n || n === me) return;
      if (!users[n]) users[n] = { wallet: 5000, friends: [], unread: {}, archived: [] };
      if (!myFriends().includes(n)) { myFriends().push(n); users[n].friends.push(me); save(); broadcast({ type: "friends", user: me, friends: myFriends() }); broadcast({ type: "friends", user: n, friends: users[n].friends }); toast("Added " + n); }
      body.querySelector("#friendInput").value = ""; renderFriends(body); renderConversations();
    });
  }
  function personItem(u) {
    const li = document.createElement("li"); li.className = "person";
    const isFriend = myFriends().includes(u);
    li.innerHTML = `<span class="avatar">${av(u)}<span class="dot ${isOnline(u) ? "on" : ""}"></span></span>
      <div class="grow"><b>${esc(u)}</b><div class="status">${isOnline(u) ? "online" : "offline"}</div></div>
      ${isFriend
        ? '<button class="mini" data-act="chat">Chat</button><button class="mini mini--danger" data-act="remove">Remove</button>'
        : '<button class="mini" data-act="add">Add</button>'}`;
    const chatBtn = li.querySelector('[data-act="chat"]'); if (chatBtn) chatBtn.addEventListener("click", () => { closeDrawer(); openChat(u); });
    const addBtn = li.querySelector('[data-act="add"]'); if (addBtn) addBtn.addEventListener("click", () => {
      if (!users[u]) users[u] = { wallet: 5000, friends: [], unread: {}, archived: [] };
      myFriends().push(u); users[u].friends.push(me); save();
      broadcast({ type: "friends", user: me, friends: myFriends() }); broadcast({ type: "friends", user: u, friends: users[u].friends });
      toast("Added " + u); renderFriends($("drawerBody")); renderConversations();
    });
    const rmBtn = li.querySelector('[data-act="remove"]'); if (rmBtn) rmBtn.addEventListener("click", () => {
      if (!confirm("Remove " + u + " from your friends?")) return;
      const mf = myFriends(); const i = mf.indexOf(u); if (i >= 0) mf.splice(i, 1);
      const uf = users[u] ? users[u].friends : []; const j = uf.indexOf(me); if (j >= 0) uf.splice(j, 1);
      save(); renderFriends($("drawerBody")); renderConversations(); toast("Removed " + u);
    });
    return li;
  }

  function renderWallet(body) {
    body.innerHTML = `
      <div class="wallet-card">
        <span class="balance__label">Balance</span>
        <div class="balance__row"><span class="balance__amount" id="balance">${users[me].wallet.toLocaleString()}</span><span class="balance__cur">CXC</span></div>
        <span class="balance__chip">💳</span>
      </div>
      <form class="send" id="sendForm"><input id="sendTo" placeholder="To (username)" autocomplete="off" /><input id="sendAmount" type="number" step="0.01" min="0" placeholder="Amount" /><input id="sendNote" placeholder="Note (optional)" maxlength="120" autocomplete="off" /><button type="submit">Send</button></form>
      <h3 class="subhead">Transactions</h3><ul class="txs" id="txList"></ul>`;
    const ul = body.querySelector("#txList");
    if (!txs.length) ul.innerHTML = '<li class="person-empty">No transactions yet.</li>';
    txs.forEach((t) => ul.appendChild(txItem(t)));
    body.querySelector("#sendForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const to = body.querySelector("#sendTo").value.trim(), amt = parseFloat(body.querySelector("#sendAmount").value), note = body.querySelector("#sendNote").value.trim();
      if (!to || to === me) return toast("Enter a valid recipient.");
      if (!(amt > 0)) return toast("Enter an amount.");
      if (users[me].wallet < amt) return toast("Not enough CXC.");
      if (!users[to]) users[to] = { wallet: 5000, friends: [], unread: {}, archived: [] };
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
      <p class="invite__hint">Tip: your invite code is <b>${esc(me)}</b>. Friends can also add you by username from ☰ → Friends.</p>`;
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
        <div class="profile__btns">
          <button class="btn" id="logoutBtn">Log out</button>
          <button class="btn btn--danger" id="delBtn">Delete account</button>
        </div>
        <p class="login__hint">Deleting removes your account, friends and messages from this device.</p>
      </div>`;
    body.querySelector("#logoutBtn").addEventListener("click", () => {
      localStorage.removeItem(KEYS.session); location.replace("index.html");
    });
    body.querySelector("#delBtn").addEventListener("click", () => {
      if (!confirm("Permanently delete your MRIRYHED account? This cannot be undone.")) return;
      const accounts = JSON.parse(localStorage.getItem("mrichat-accounts") || "{}");
      delete accounts[me];
      localStorage.setItem("mrichat-accounts", JSON.stringify(accounts));
      delete users[me];
      save();
      localStorage.removeItem(KEYS.session);
      toast("Account deleted"); location.replace("index.html");
    });
  }

  /* ===================== popup menu ===================== */
  function popupMenu(x, y, items) {
    closePopup();
    const el = document.createElement("div"); el.id = "ctxMenu"; el.className = "ctx-menu";
    items.forEach((it) => {
      const b = document.createElement("button"); b.className = "ctx-item" + (it.danger ? " ctx-item--danger" : "");
      b.textContent = it.label; b.addEventListener("click", () => { closePopup(); it.onClick(); });
      el.appendChild(b);
    });
    document.body.appendChild(el);
    const w = el.offsetWidth, h = el.offsetHeight;
    el.style.left = Math.min(x, window.innerWidth - w - 8) + "px";
    el.style.top = Math.min(y, window.innerHeight - h - 8) + "px";
    setTimeout(() => document.addEventListener("click", closePopup), 0);
  }
  function closePopup() { const el = $("ctxMenu"); if (el) el.remove(); document.removeEventListener("click", closePopup); }

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
  document.addEventListener("click", outsidePops);
  load(); seed(); connectWS();
  $("meName").textContent = me; $("meAvatar").textContent = av(me);
  renderConversations();
  broadcast({ type: "presence", user: me, online: true });
  window.addEventListener("beforeunload", () => broadcast({ type: "presence", user: me, online: false }));
})();
