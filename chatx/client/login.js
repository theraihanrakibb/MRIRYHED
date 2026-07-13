/* ------------------------------------------------------------------ *
 * MRIRYHED Chat — login / signup (username + password, local accounts)
 * Redirects to app.html on success. No server needed; accounts live in
 * localStorage (demo-grade — not real cryptography).
 * ------------------------------------------------------------------ */
(function () {
  const $ = (id) => document.getElementById(id);
  const ACC_KEY = "mrichat-accounts";

  function hashPW(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return "mri" + h;
  }
  function getAccounts() {
    try { return JSON.parse(localStorage.getItem(ACC_KEY) || "{}"); } catch { return {}; }
  }
  function setAccounts(a) { localStorage.setItem(ACC_KEY, JSON.stringify(a)); }
  function av(n) { return n ? n.trim().charAt(0).toUpperCase() : "?"; }

  let mode = "login";
  $("tabLogin").addEventListener("click", () => { mode = "login"; $("tabLogin").classList.add("is-active"); $("tabSignup").classList.remove("is-active"); $("authBtn").textContent = "Log in →"; $("authHint").innerHTML = 'New here? Switch to <b>Sign up</b>. Accounts are stored locally on this device.'; });
  $("tabSignup").addEventListener("click", () => { mode = "signup"; $("tabSignup").classList.add("is-active"); $("tabLogin").classList.remove("is-active"); $("authBtn").textContent = "Create account →"; $("authHint").textContent = "Pick a username and password. Stored on this device only."; });

  function go(name) {
    localStorage.setItem("mrichat-session", name);
    // carry an invite code through to the app, if present
    const params = new URLSearchParams(location.search);
    const invite = params.get("invite");
    location.replace("app.html" + (invite ? "?invite=" + encodeURIComponent(invite) : ""));
  }

  $("authBtn").addEventListener("click", () => {
    const name = $("username").value.trim();
    const pw = $("password").value;
    if (!name) { shake("username"); return; }
    if (!pw || pw.length < 3) { $("authHint").textContent = "Password needs at least 3 characters."; shake("password"); return; }
    const accounts = getAccounts();

    if (mode === "signup") {
      if (accounts[name]) { $("authHint").textContent = "That username is taken. Try logging in."; shake("username"); return; }
      accounts[name] = { pw: hashPW(pw) };
      setAccounts(accounts);
      // seed the social profile for this user
      const users = JSON.parse(localStorage.getItem("mrichat-users") || "{}");
      if (!users[name]) users[name] = { wallet: 5000, friends: [] };
      localStorage.setItem("mrichat-users", JSON.stringify(users));
      go(name);
    } else {
      if (!accounts[name] || accounts[name].pw !== hashPW(pw)) { $("authHint").textContent = "Wrong username or password."; shake("password"); return; }
      go(name);
    }
  });

  [$("username"), $("password")].forEach((el) => el.addEventListener("keydown", (e) => { if (e.key === "Enter") $("authBtn").click(); }));

  function shake(id) { const el = $(id); el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); }

  // if already logged in, skip straight to the app
  if (localStorage.getItem("mrichat-session")) location.replace("app.html");
})();
