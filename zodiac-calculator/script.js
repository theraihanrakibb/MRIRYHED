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
  const CHINA_ICON = {
    Rat: "🐭", Ox: "🐂", Tiger: "🐯", Rabbit: "🐰", Dragon: "🐲", Snake: "🐍",
    Horse: "🐴", Goat: "🐐", Monkey: "🐵", Rooster: "🐔", Dog: "🐶", Pig: "🐷",
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

    $("chinaIcon").textContent = CHINA_ICON[c] || "🐉"; $("chinaName").textContent = `${c} (${e})`;
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

  /* ---------------- element compatibility table (shared by Cosmic Match) ---------------- */
  const ELEM_COMPAT = { Fire: { Fire: 8, Air: 9, Earth: 5, Water: 5 }, Air: { Fire: 9, Air: 8, Earth: 6, Water: 6 }, Earth: { Fire: 5, Air: 6, Earth: 9, Water: 7 }, Water: { Fire: 5, Air: 6, Earth: 7, Water: 9 } };

  /* ---------------- cosmic match ---------------- */
  const MATCH_TYPES = Object.keys(MBTI);
  let mSel = "ENTJ", pSel = "ENFP";
  let mGender = "Male", pGender = "Female";

  function buildMatchChips(containerId, side) {
    const c = $(containerId);
    MATCH_TYPES.forEach((type) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "mbti-tag"; b.dataset.mbti = type; b.textContent = type;
      if (type === (side === "m" ? mSel : pSel)) b.classList.add("selected");
      b.addEventListener("click", () => {
        c.querySelectorAll(".mbti-tag").forEach((x) => x.classList.remove("selected"));
        b.classList.add("selected");
        if (side === "m") mSel = type; else pSel = type;
        computeMatch();
      });
      c.appendChild(b);
    });
  }
  buildMatchChips("mMBTI", "m");
  buildMatchChips("pMBTI2", "p");

  $("mYear").value = 1998; $("mMonth").value = 5; $("mDay").value = 15;
  $("pYear2").value = 2000; $("pMonth2").value = 10; $("pDay2").value = 22;

  document.querySelectorAll(".gender").forEach((g) => {
    const side = g.dataset.side;
    g.querySelectorAll(".gender__btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        g.querySelectorAll(".gender__btn").forEach((x) => x.classList.remove("selected"));
        btn.classList.add("selected");
        const gen = btn.dataset.gender;
        if (side === "m") { mGender = gen; $("mWho").textContent = (gen === "Male" ? "♂ " : "♀ ") + "Mine"; }
        else { pGender = gen; $("pWho").textContent = (gen === "Male" ? "♂ " : "♀ ") + "Partner"; }
      });
    });
  });

  /* chinese zodiac relation tables */
  const TRIADS = [["Rat","Dragon","Monkey"],["Ox","Snake","Rooster"],["Tiger","Horse","Dog"],["Rabbit","Goat","Pig"]];
  const HARMONY = [["Rat","Ox"],["Tiger","Pig"],["Rabbit","Dog"],["Dragon","Rooster"],["Snake","Monkey"],["Horse","Goat"]];
  const CONFLICT = [["Rat","Horse"],["Ox","Goat"],["Tiger","Monkey"],["Rabbit","Rooster"],["Dragon","Dog"],["Snake","Pig"]];
  const HARM = [["Rat","Goat"],["Ox","Horse"],["Tiger","Snake"],["Rabbit","Dragon"],["Monkey","Pig"],["Dog","Rooster"]];
  const pkey = (a, b) => [a, b].sort().join("|");
  const HARMONY_SET = new Set(HARMONY.map((p) => pkey(p[0], p[1])));
  const CONFLICT_SET = new Set(CONFLICT.map((p) => pkey(p[0], p[1])));
  const HARM_SET = new Set(HARM.map((p) => pkey(p[0], p[1])));
  const TRIAD_SET = new Set();
  TRIADS.forEach((t) => { for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) TRIAD_SET.add(pkey(t[i], t[j])); });

  /* five-element productive (generates) and controlling (overcomes) cycles */
  const GEN = { Wood: "Fire", Fire: "Earth", Earth: "Metal", Metal: "Water", Water: "Wood" };
  const CON = { Wood: "Earth", Earth: "Water", Water: "Fire", Fire: "Metal", Metal: "Wood" };

  /* curated MBTI affinity sets (sorted keys) */
  const GOLDEN = new Set([
    "ENFP|INFJ","ENFP|INTJ","ENFJ|INFP","ENFJ|ISFP","ENTJ|INFP","ENTJ|ISFP",
    "ENTP|INFJ","ENTP|INTJ","ESFP|ISFJ","ESFP|ISTJ","ESTP|ISFJ","ESFJ|ISFP",
    "INFP|ENFJ","INFJ|ENFP","INTJ|ENFP","ISFJ|ESFP","ISFJ|ESTP","ISFP|ENFJ",
    "ISFP|ENTJ","ISTJ|ESFP","ISTP|ESFJ","INTP|ENTJ"
  ]);
  const ROCKY = new Set([
    "ENFP|ISTJ","ENTP|ISFJ","INFP|ESTJ","INTP|ESFJ","ESFP|INTJ","ESTP|INFJ",
    "ISFJ|ENTP","ESTJ|INFP","ESFJ|INTP","INTJ|ESFP","INFJ|ESTP","ISTJ|ENFP"
  ]);

  const WPHRASE = {
    "Air|Air": "Twin Air — endless conversation and ideas",
    "Air|Earth": "Air and Earth — ideas grounded in reality",
    "Air|Fire": "Air feeds Fire — lively and free-spirited",
    "Air|Water": "Air and Water — talk that flows into feeling",
    "Earth|Earth": "Twin Earth — loyal, sensible, unshakable",
    "Earth|Fire": "Fire meets Earth — passion tempered by steadiness",
    "Earth|Water": "Earth and Water — nurturing and rooted",
    "Fire|Fire": "Twin Fire — bold, intense, never boring",
    "Fire|Water": "Fire and Water — a dynamic, testing tension",
    "Water|Water": "Twin Water — deeply emotional and intuitive",
  };

  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

  function westernScore(sA, sB) {
    const sc = ELEM_COMPAT[WEST[sA].element][WEST[sB].element];        /* 5..9 */
    return Math.round(40 + (sc - 5) * 15);                            /* 40..100 */
  }
  function chineseScore(yA, yB) {
    const a = getChineseAnimal(yA), b = getChineseAnimal(yB);
    const ea = getElement(yA), eb = getElement(yB);
    const k = pkey(a, b);
    let base;
    if (a === b) base = 76;
    else if (HARMONY_SET.has(k)) base = 90;
    else if (TRIAD_SET.has(k)) base = 78;
    else if (CONFLICT_SET.has(k)) base = 40;
    else if (HARM_SET.has(k)) base = 47;
    else base = 62;
    let eb2 = 0;
    if (ea === eb) eb2 = 10;
    else if (GEN[ea] === eb || GEN[eb] === ea) eb2 = 5;
    else if (CON[ea] === eb || CON[eb] === ea) eb2 = -5;
    return clamp(Math.round(base + eb2), 0, 100);
  }
  function mbtiScore(a, b) {
    let s = 50;
    s += (a[1] === b[1]) ? (a[1] === "N" ? 18 : 12) : -12;   /* N/S strongest */
    s += (a[2] === b[2]) ? 8 : 4;                            /* T/F */
    s += (a[0] === b[0]) ? 6 : 4;                            /* E/I */
    s += (a[3] === b[3]) ? 8 : 4;                            /* J/P */
    const k = pkey(a, b);
    if (GOLDEN.has(k)) s += 12;
    if (ROCKY.has(k)) s -= 14;
    return clamp(Math.round(s), 0, 100);
  }

  function computeMatch() {
    const my = +$("mYear").value, mm = +$("mMonth").value, md = +$("mDay").value;
    const py = +$("pYear2").value, pm = +$("pMonth2").value, pd = +$("pDay2").value;
    const bad = (y, m, d) => !y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31;
    if (bad(my, mm, md) || bad(py, pm, pd)) { $("matchResult").hidden = true; return; }

    const wA = getWestern(mm, md), wB = getWestern(pm, pd);
    const aAn = getChineseAnimal(my), bAn = getChineseAnimal(py);
    const aEl = getElement(my), bEl = getElement(py);

    const w = westernScore(wA, wB);
    const c = chineseScore(my, py);
    const m = mbtiScore(mSel, pSel);
    const overall = Math.round(w * 0.35 + c * 0.35 + m * 0.30);

    $("matchPct").textContent = overall + "%";
    $("matchVerdict").textContent =
      overall >= 85 ? "Cosmic match — your worlds interlock" :
      overall >= 70 ? "Strong potential — momentum favors you" :
      overall >= 55 ? "Balanced bond — differences that complement" :
                      "Different wavelengths — but every pair can grow";

    $("westScore").textContent = w + "%";
    $("westFill").style.width = w + "%";
    $("westNote").textContent = `${WEST[wA].element} + ${WEST[wB].element} = ${WPHRASE[pkey(WEST[wA].element, WEST[wB].element)]}`;

    const ck = pkey(aAn, bAn);
    let cRel;
    if (aAn === bAn) cRel = "Same sign — instant understanding";
    else if (HARMONY_SET.has(ck)) cRel = "Six harmony — effortless unity";
    else if (TRIAD_SET.has(ck)) cRel = "Allied signs — naturally in sync";
    else if (CONFLICT_SET.has(ck)) cRel = "Six conflict — sparks needing patience";
    else if (HARM_SET.has(ck)) cRel = "Mild friction — needs a little give";
    else cRel = "Steady pairing — comfortable and calm";
    const cElNote = aEl === bEl ? ` · shared ${aEl} element` : "";
    $("chinaScore").textContent = c + "%";
    $("chinaFill").style.width = c + "%";
    $("chinaNote").textContent = `${aAn} (${aEl}) + ${bAn} (${bEl}) = ${cRel}${cElNote}`;

    const mk = pkey(mSel, pSel);
    let mRel;
    if (mSel === pSel) mRel = "Same type — deep mutual understanding";
    else if (GOLDEN.has(mk)) mRel = "Magnetic, well-balanced pair";
    else if (ROCKY.has(mk)) mRel = "Opposites who meet halfway";
    else if (mSel[1] === pSel[1] && mSel[1] === "N") mRel = "Shared intuition — you read each other's minds";
    else if (mSel[1] === pSel[1] && mSel[1] === "S") mRel = "Shared practicality — a grounded team";
    else mRel = "Different lenses — curiosity keeps it fresh";
    $("mbtiScore").textContent = m + "%";
    $("mbtiFill").style.width = m + "%";
    $("mbtiNote").textContent = `${mSel} + ${pSel} = ${mRel}`;

    $("matchResult").hidden = false;
  }

  ["mYear","mMonth","mDay","pYear2","pMonth2","pDay2"].forEach((id) =>
    $(id).addEventListener("input", computeMatch));
  $("matchBtn").addEventListener("click", computeMatch);
  computeMatch();

  /* ---------------- theme ---------------- */
  (function () {
    const root = document.documentElement, btn = $("themeToggle");
    if (localStorage.getItem("mrizodiac-theme") === "light") { root.setAttribute("data-theme", "light"); btn.textContent = "☾"; }
    btn.addEventListener("click", () => {
      const isLight = root.getAttribute("data-theme") === "light";
      if (isLight) { root.removeAttribute("data-theme"); btn.textContent = "☀︎"; localStorage.setItem("mrizodiac-theme", "dark"); }
      else { root.setAttribute("data-theme", "light"); btn.textContent = "☾"; localStorage.setItem("mrizodiac-theme", "light"); }
    });
  })();
})();
