(function () {
  /* ---------------- reference data ---------------- */
  const WEST = {
    Aries:       { icon: "♈", element: "Fire",   planet: "Mars",      traits: "Bold · impulsive · courageous",   desc: "A natural pioneer — you charge first and figure it out on the way. Fierce loyalty, short fuse, big heart." },
    Taurus:      { icon: "♉", element: "Earth",  planet: "Venus",     traits: "Steady · sensory · loyal",         desc: "You crave stability and beauty. Patient and dependable, but unmovable once decided." },
    Gemini:      { icon: "♊", element: "Air",    planet: "Mercury",   traits: "Curious · witty · adaptable",      desc: "A restless mind that connects dots others miss. Social, talkative, endlessly varied." },
    Cancer:      { icon: "♋", element: "Water",  planet: "Moon",      traits: "Nurturing · intuitive · protective", desc: "Deeply emotional and loyal to those you trust. Home and family anchor you." },
    Leo:         { icon: "♌", element: "Fire",   planet: "Sun",       traits: "Charismatic · proud · generous",   desc: "Born to be seen. Warm, dramatic, and fiercely protective of your people." },
    Virgo:       { icon: "♍", element: "Earth",  planet: "Mercury",   traits: "Precise · helpful · analytical",  desc: "You notice what others miss and quietly fix it. Service is your love language." },
    Libra:       { icon: "♎", element: "Air",    planet: "Venus",     traits: "Diplomatic · charming · fair",     desc: "A born mediator who hates conflict. You seek harmony, beauty, and balance." },
    Scorpio:     { icon: "♏", element: "Water",  planet: "Pluto",     traits: "Intense · strategic · private",    desc: "All or nothing. Magnetic, secretive, and impossibly loyal once earned." },
    Sagittarius: { icon: "♐", element: "Fire",   planet: "Jupiter",   traits: "Adventurous · honest · free",      desc: "A wandering philosopher. You chase meaning, truth, and the next horizon." },
    Capricorn:   { icon: "♑", element: "Earth",  planet: "Saturn",    traits: "Ambitious · disciplined · stoic",  desc: "The architect of the long game. You build slowly and last longer than anyone." },
    Aquarius:    { icon: "♒", element: "Air",    planet: "Uranus",    traits: "Original · detached · visionary",  desc: "A rebel with a blueprint. You think for the collective and future, not the crowd." },
    Pisces:      { icon: "♓", element: "Water",  planet: "Neptune",   traits: "Empathic · dreamy · artistic",     desc: "Deeply feeling and imaginative. You absorb the room and feel everything." },
  };
  const CHINA = {
    Rat:    { traits: "Clever · charming · resourceful",  desc: "Quick-witted and adaptable; you turn scarcity into opportunity." },
    Ox:     { traits: "Diligent · patient · strong",      desc: "Silent force of nature — steady, honest, and unbreakable." },
    Tiger:  { traits: "Brave · passionate · rebellious",  desc: "A protective firecracker who leads from the front." },
    Rabbit: { traits: "Gentle · elegant · diplomatic",    desc: "Soft-spoken but shrewd; you keep peace without losing ground." },
    Dragon: { traits: "Confident · visionary · lucky",    desc: "Born to lead loudly. Charismatic, ambitious, impossible to ignore." },
    Snake:  { traits: "Wise · mysterious · elegant",      desc: "Quietly brilliant; you watch, wait, then strike with precision." },
    Horse:  { traits: "Energetic · free · social",        desc: "Restless and warm — you bring motion and morale wherever you go." },
    Goat:   { traits: "Kind · artistic · calm",          desc: "Gentle and creative; you soften every room you enter." },
    Monkey: { traits: "Witty · inventive · playful",     desc: "A problem-solver who treats life like a puzzle to enjoy." },
    Rooster:{ traits: "Sharp · confident · meticulous",  desc: "Precise and proud; you hold a standard and meet it." },
    Dog:    { traits: "Loyal · honest · protective",      desc: "The trusted guardian — fair, brave, and deeply principled." },
    Pig:    { traits: "Generous · sincere · easygoing",   desc: "Big-hearted and乐观; you give more than you get, gladly." },
  };
  const MBTI = {
    INFJ:  { nick: "The Advocate",     desc: "Idealistic and insightful; you want to leave people better than you found them." },
    ENFJ:  { nick: "The Protagonist",  desc: "Charismatic mentor; you inspire groups toward a shared purpose." },
    INTJ:  { nick: "The Architect",    desc: "Independent strategist; you rebuild the world in your head, then build it for real." },
    ISFJ:  { nick: "The Defender",     desc: "Quietly devoted; you remember the details others forget and protect what matters." },
    ENTP:  { nick: "The Debater",      desc: "Relentlessly curious; you poke ideas until the truth falls out." },
    ESFJ:  { nick: "The Consul",       desc: "Warm host of any room; you keep people connected and cared for." },
    INFP:  { nick: "The Mediator",     desc: "Gentle dreamer; you live by a private code of meaning and authenticity." },
    ENFP:  { nick: "The Campaigner",   desc: "Effervescent connector; you turn strangers into friends in minutes." },
    ISTJ:  { nick: "The Logistician",  desc: "Reliable backbone; you do what you said, exactly, every time." },
    ESTJ:  { nick: "The Executive",     desc: "Capable organizer; you turn chaos into order without drama." },
    INTP:  { nick: "The Logician",     desc: "Abstract thinker; you chase the elegant explanation behind everything." },
    ENTJ:  { nick: "The Commander",    desc: "Decisive leader; you set the direction and move people to it." },
    ISFP:  { nick: "The Adventurer",   desc: "Sensitive aesthete; you experience life as art and act on feeling." },
    ESFP:  { nick: "The Entertainer",  desc: "Spontaneous spark; you make ordinary moments feel like a party." },
    ISTP:  { nick: "The Virtuoso",     desc: "Cool-handed tinkerer; you fix things by understanding how they work." },
    ESTP:  { nick: "The Entrepreneur", desc: "Bold risk-taker; you act first and figure out the rules later." },
  };

  /* ---------------- helpers ---------------- */
  function getWestern(m, d) {
    if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return "Aries";
    if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return "Taurus";
    if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return "Gemini";
    if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return "Cancer";
    if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return "Leo";
    if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return "Virgo";
    if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return "Libra";
    if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return "Scorpio";
    if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return "Sagittarius";
    if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return "Capricorn";
    if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return "Aquarius";
    return "Pisces";
  }
  function getChineseAnimal(y) {
    return ["Monkey","Rooster","Dog","Pig","Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat"][((y % 12) + 12) % 12];
  }
  function getElement(y) {
    return ["Wood","Wood","Fire","Fire","Earth","Earth","Metal","Metal","Water","Water"][Math.floor(y / 2) % 10];
  }

  /* ---------------- DOM ---------------- */
  const $ = (id) => document.getElementById(id);
  const yearI = $("year"), monthI = $("month"), dayI = $("day");
  const mbtiTags = document.querySelectorAll(".mbti-tag");
  let selectedMbti = "ENTJ";

  yearI.value = 2002; monthI.value = 12; dayI.value = 6;
  mbtiTags.forEach((t) => {
    if (t.dataset.mbti === "ENTJ") t.classList.add("selected");
    t.addEventListener("click", () => { mbtiTags.forEach((x) => x.classList.remove("selected")); t.classList.add("selected"); selectedMbti = t.dataset.mbti; });
  });

  function reveal() {
    const y = +yearI.value, m = +monthI.value, d = +dayI.value;
    if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) { alert("Enter a valid birth date."); return; }

    const w = getWestern(m, d), c = getChineseAnimal(y), e = getElement(y), mb = selectedMbti;
    const W = WEST[w], C = CHINA[c], M = MBTI[mb];

    $("westIcon").textContent = W.icon; $("westName").textContent = w;
    $("westMeta").textContent = `${W.element} · ruled by ${W.planet}`;
    $("westTraits").textContent = W.traits; $("westDesc").textContent = W.desc;

    $("chinaIcon").textContent = "🐉"; $("chinaName").textContent = `${c} (${e})`;
    $("chinaMeta").textContent = `${e} element year`;
    $("chinaTraits").textContent = C.traits; $("chinaDesc").textContent = C.desc;

    $("mbtiIcon").textContent = "🧠"; $("mbtiName").textContent = `${mb} · ${M.nick}`;
    $("mbtiMeta").textContent = "cognitive profile";
    $("mbtiTraits").textContent = M.nick;
    $("mbtiDesc").textContent = M.desc;

    $("summaryText").textContent =
      `You read as a ${W.element} ${w} with the ${c}'s ${C.traits.split(" · ")[0].toLowerCase()} nature, expressed through an ${mb} lens (${M.nick}). ` +
      `That's someone who ${W.desc.split(". ")[0].toLowerCase()} — yet ${C.desc.split(". ")[0].toLowerCase()}, and ${M.desc.split(". ")[0].toLowerCase()}.`;

    $("profile").hidden = false;
  }
  $("checkBtn").addEventListener("click", reveal);

  /* ---------------- compatibility ---------------- */
  const ELEM_COMPAT = { Fire: { Fire: 8, Air: 9, Earth: 5, Water: 5 }, Air: { Fire: 9, Air: 8, Earth: 6, Water: 6 }, Earth: { Fire: 5, Air: 6, Earth: 9, Water: 7 }, Water: { Fire: 5, Air: 6, Earth: 7, Water: 9 } };
  function compatWith(pYear, pMonth, pDay) {
    const aSign = getWestern(+monthI.value, +dayI.value);
    const bSign = getWestern(pMonth, pDay);
    const aW = WEST[aSign], bW = WEST[bSign];
    const aE = getElement(+yearI.value), bE = getElement(pYear);
    const aC = getChineseAnimal(+yearI.value), bC = getChineseAnimal(pYear);
    let s = 50 + (ELEM_COMPAT[aW.element][bW.element] - 6) * 4;
    if (aE === bE) s += 8; if (aC === bC) s += 6; if (aSign === bSign) s += 10;
    s += Math.floor(Math.random() * 7) - 3;
    return Math.max(28, Math.min(99, Math.round(s)));
  }
  $("compatBtn").addEventListener("click", () => {
    const py = +$("pYear").value, pm = +$("pMonth").value, pd = +$("pDay").value;
    if (!py || !pm || !pd) { alert("Enter your partner's birth date."); return; }
    const pct = compatWith(py, pm, pd);
    $("compatPct").textContent = pct + "%";
    $("compatDesc").textContent = pct >= 80 ? "Cosmic match — your energies dance in sync." :
      pct >= 60 ? "Strong potential — a few differences keep it interesting." :
      pct >= 45 ? "Balanced bond — opposites that can complement." : "Different wavelengths — but every pair can learn.";
    $("compatResult").hidden = false;
  });

  /* ---------------- theme ---------------- */
  (function () {
    const root = document.documentElement, btn = $("themeToggle");
    if (localStorage.getItem("raiscape-theme") === "light") { root.setAttribute("data-theme", "light"); btn.textContent = "☾"; }
    btn.addEventListener("click", () => {
      const isLight = root.getAttribute("data-theme") === "light";
      if (isLight) { root.removeAttribute("data-theme"); btn.textContent = "☀︎"; localStorage.setItem("raiscape-theme", "dark"); }
      else { root.setAttribute("data-theme", "light"); btn.textContent = "☾"; localStorage.setItem("raiscape-theme", "light"); }
    });
  })();
})();
