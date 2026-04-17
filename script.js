// ═══════════════════════════════════════════════════
//  CELESTIAL BIRTH CHART — script.js
// ═══════════════════════════════════════════════════

// ─── STARFIELD ────────────────────────────────────
(function createStars() {
  const container = document.getElementById('stars');
  for (let i = 0; i < 160; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const size = Math.random() * 2.2 + 0.4;
    s.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      top:${Math.random()*100}%;
      --d:${(Math.random()*4+2).toFixed(1)}s;
      --delay:-${(Math.random()*6).toFixed(1)}s;
      --op:${(Math.random()*0.6+0.2).toFixed(2)};
    `;
    container.appendChild(s);
  }
})();

// ─── DATA TABLES ──────────────────────────────────
const ZODIAC_SIGNS = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
];

const ZODIAC_SYMBOLS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];

const ELEMENTS = {
  Aries:"Fire", Leo:"Fire", Sagittarius:"Fire",
  Taurus:"Earth", Virgo:"Earth", Capricorn:"Earth",
  Gemini:"Air", Libra:"Air", Aquarius:"Air",
  Cancer:"Water", Scorpio:"Water", Pisces:"Water"
};

const MODALITIES = {
  Aries:"Cardinal", Cancer:"Cardinal", Libra:"Cardinal", Capricorn:"Cardinal",
  Taurus:"Fixed", Leo:"Fixed", Scorpio:"Fixed", Aquarius:"Fixed",
  Gemini:"Mutable", Virgo:"Mutable", Sagittarius:"Mutable", Pisces:"Mutable"
};

const SIGN_TRAITS = {
  Aries:       "bold, competitive, quick to act — a natural pioneer who rushes headfirst into new territory",
  Taurus:      "patient, persistent, and deeply sensory — you find power in consistency and material mastery",
  Gemini:      "curious, communicative, and mentally agile — your mind delights in duality and rapid synthesis",
  Cancer:      "intuitive, empathetic, and fiercely protective — your emotional intelligence is your superpower",
  Leo:         "radiant, creative, and magnetically warm — you carry a regal confidence that draws others in",
  Virgo:       "analytical, precise, and quietly devoted — you find beauty in the details others overlook",
  Libra:       "balanced, diplomatic, and aesthetically attuned — you seek harmony in all things",
  Scorpio:     "intense, perceptive, and deeply strategic — you see beneath every surface",
  Sagittarius: "philosophical, expansive, and freedom-loving — your arrow always aims at distant horizons",
  Capricorn:   "disciplined, ambitious, and quietly formidable — you build empires with patience and will",
  Aquarius:    "innovative, independent, and visionary — you imagine futures others cannot yet see",
  Pisces:      "imaginative, empathetic, and spiritually fluid — you dissolve boundaries between worlds"
};

const MATH_FIELDS = {
  Fire:  "Probability & Statistics, Game Theory, Chaos Theory, Dynamical Systems",
  Earth: "Applied Mathematics, Numerical Analysis, Financial Mathematics, Optimization",
  Air:   "Logic & Set Theory, Discrete Mathematics, Combinatorics, Graph Theory",
  Water: "Topology, Complex Analysis, Mathematical Physics, Differential Geometry"
};

const CAREER_FIELDS = {
  Aries:       "Entrepreneurship, Surgical Medicine, Military Strategy, Sports Science, Emergency Services",
  Taurus:      "Architecture, Financial Analysis, Agriculture, Geology, Culinary Arts, Engineering",
  Gemini:      "Journalism, Software Development, Teaching, Marketing, Linguistics, Publishing",
  Cancer:      "Psychology, Nursing, Social Work, Marine Biology, Hospitality, Child Development",
  Leo:         "Entertainment, Politics, UX/Creative Direction, Executive Leadership, Fashion",
  Virgo:       "Data Science, Medicine, Accounting, Scientific Research, Editing, Nutrition",
  Libra:       "Law, Diplomacy, Art Direction, Human Resources, Interior Design, Mediation",
  Scorpio:     "Forensic Science, Intelligence Agencies, Psychotherapy, Cybersecurity, Surgery",
  Sagittarius: "Academia, Philosophy, Travel & Tourism, Publishing, Religious Studies, Law",
  Capricorn:   "Government, Civil Engineering, Corporate Management, Banking, Urban Planning",
  Aquarius:    "Technology, Aerospace, AI Research, Social Reform, Humanitarianism, Futurism",
  Pisces:      "Visual Arts, Music, Oceanography, Spiritual Counseling, Film, Nursing"
};

const MODALITY_NOTES = {
  Cardinal: "You are an initiator — a natural starter who launches new cycles and leads with fresh energy.",
  Fixed:    "You are a sustainer — once committed, your iron will sees every endeavor through to completion.",
  Mutable:  "You are an adapter — fluid and versatile, you excel at transitions, synthesis, and evolution."
};

const ELEMENT_COLORS = {
  Fire: "#e8643a", Earth: "#7ab04e", Air: "#6ab8d4", Water: "#7064c8"
};

// ─── TIMEZONE OFFSET DATA (no API needed) ────────
// Simple longitude-based solar time offset. For a static site, we approximate
// using the user-provided UTC offset from their local browser for the calculation.
// This avoids needing a backend while still being astronomically meaningful.

function getTimezoneOffsetHours(date) {
  // Returns local offset from UTC in hours (e.g. +4, -5)
  return -date.getTimezoneOffset() / 60;
}

// ─── GEOCODING (OpenStreetMap Nominatim — free, no key) ───
async function geocodePlace(place) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`;
  const resp = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const data = await resp.json();
  if (!data.length) throw new Error(`Could not find location: "${place}"`);
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display: data[0].display_name };
}

async function fetchSuggestions(query) {
  if (query.length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&featuretype=city`;
  const resp = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  return await resp.json();
}

// ─── AUTOCOMPLETE ─────────────────────────────────
let suggestTimeout = null;
document.getElementById('placeInput').addEventListener('input', function() {
  clearTimeout(suggestTimeout);
  const val = this.value;
  if (val.length < 3) { clearSuggestions(); return; }
  suggestTimeout = setTimeout(async () => {
    const results = await fetchSuggestions(val).catch(() => []);
    showSuggestions(results);
  }, 350);
});

function showSuggestions(results) {
  const box = document.getElementById('geoSuggestions');
  box.innerHTML = '';
  results.slice(0, 5).forEach(r => {
    const item = document.createElement('div');
    item.className = 'geo-suggestion-item';
    const short = r.display_name.split(',').slice(0,3).join(', ');
    item.textContent = short;
    item.addEventListener('click', () => {
      document.getElementById('placeInput').value = short;
      clearSuggestions();
    });
    box.appendChild(item);
  });
}
function clearSuggestions() {
  document.getElementById('geoSuggestions').innerHTML = '';
}
document.addEventListener('click', e => {
  if (!e.target.closest('#placeInput') && !e.target.closest('#geoSuggestions')) clearSuggestions();
});

// ─── MAIN CALCULATION ─────────────────────────────
async function calculateChart() {
  const name  = document.getElementById('nameInput').value.trim();
  const date  = document.getElementById('dateInput').value;
  const time  = document.getElementById('timeInput').value;
  const place = document.getElementById('placeInput').value.trim();
  const errEl = document.getElementById('formError');

  errEl.classList.add('hidden');

  if (!name || !date || !time || !place) {
    errEl.textContent = 'Please fill in all fields before calculating.';
    errEl.classList.remove('hidden');
    return;
  }

  const btn = document.getElementById('calculateBtn');
  btn.disabled = true;

  show('loadingSection');
  hide('formSection');

  const loadingMessages = [
    "Locating your birth coordinates...",
    "Computing Julian Day Number...",
    "Calculating Sun's true longitude...",
    "Tracing the Moon's perturbations...",
    "Determining your Ascendant...",
    "Mapping the zodiac wheel...",
    "Composing your cosmic reading..."
  ];
  let msgIdx = 0;
  const msgEl = document.getElementById('loadingText');
  const msgInterval = setInterval(() => {
    msgIdx = (msgIdx + 1) % loadingMessages.length;
    msgEl.textContent = loadingMessages[msgIdx];
  }, 900);

  try {
    // Parse inputs
    const [Y, M, D]   = date.split('-').map(Number);
    const [hr, mn]    = time.split(':').map(Number);

    // Geocode
    const geo = await geocodePlace(place);
    const lat = geo.lat;
    const lon = geo.lon;

    // Build Date object (local) and get UTC offset
    const localDate = new Date(Y, M - 1, D, hr, mn, 0);
    const tzOffsetHrs = getTimezoneOffsetHours(localDate);

    // Universal Time (decimal hours)
    const UT = hr + mn / 60.0 - tzOffsetHrs;

    // ── JULIAN DAY NUMBER ──────────────────────────
    // Formula: Meeus "Astronomical Algorithms"
    let Yj = Y, Mj = M;
    if (Mj <= 2) { Yj -= 1; Mj += 12; }
    const A = Math.floor(Yj / 100);
    const B = 2 - A + Math.floor(A / 4);
    const JDN = Math.floor(365.25 * (Yj + 4716))
              + Math.floor(30.6001 * (Mj + 1))
              + D + B - 1524.5
              + UT / 24.0;

    // ── JULIAN CENTURIES FROM J2000.0 ─────────────
    const T = (JDN - 2451545.0) / 36525.0;

    // ── SUN LONGITUDE ─────────────────────────────
    // Mean longitude
    let L0 = (280.46646 + 36000.76983 * T) % 360;
    if (L0 < 0) L0 += 360;
    // Mean anomaly
    let M_sun = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) % 360;
    if (M_sun < 0) M_sun += 360;
    const M_sun_r = toRad(M_sun);
    // Equation of center
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M_sun_r)
            + (0.019993 - 0.000101 * T) * Math.sin(2 * M_sun_r)
            + 0.000289 * Math.sin(3 * M_sun_r);
    let sunLon = (L0 + C) % 360;
    if (sunLon < 0) sunLon += 360;

    // ── MOON LONGITUDE ────────────────────────────
    // Moon's mean longitude
    let Lm = (218.3165 + 481267.8813 * T) % 360;
    if (Lm < 0) Lm += 360;
    // Moon's mean anomaly
    let Mm = (134.9634 + 477198.8676 * T) % 360;
    if (Mm < 0) Mm += 360;
    // Moon's argument of latitude
    let F  = (93.2721 + 483202.0175 * T) % 360;
    if (F < 0) F += 360;
    // Perturbation corrections
    const dL = 6.289 * Math.sin(toRad(Mm))
             - 1.274 * Math.sin(toRad(2 * F - Mm))
             + 0.658 * Math.sin(toRad(2 * F))
             - 0.214 * Math.sin(toRad(2 * Mm))
             - 0.186 * Math.sin(toRad(M_sun))
             - 0.114 * Math.sin(toRad(2 * F));
    let moonLon = (Lm + dL) % 360;
    if (moonLon < 0) moonLon += 360;

    // ── ASCENDANT ─────────────────────────────────
    // Obliquity of ecliptic
    const epsilon = 23.439291 - 0.013004 * T;
    // Greenwich Mean Sidereal Time
    let GMST = (280.46061837 + 360.98564736629 * (JDN - 2451545.0)) % 360;
    if (GMST < 0) GMST += 360;
    // Local Sidereal Time
    let LST = (GMST + lon) % 360;
    if (LST < 0) LST += 360;
    // Ascendant
    const num = Math.cos(toRad(LST));
    const den = -(Math.sin(toRad(LST)) * Math.cos(toRad(epsilon))
               + Math.tan(toRad(lat)) * Math.sin(toRad(epsilon)));
    let asc = toDeg(Math.atan2(num, den)) % 360;
    if (asc < 0) asc += 360;

    // ── SIGNS ─────────────────────────────────────
    const sunSign    = getSign(sunLon);
    const moonSign   = getSign(moonLon);
    const risingSign = getSign(asc);

    const sunEl    = ELEMENTS[sunSign];
    const moonEl   = ELEMENTS[moonSign];
    const risingEl = ELEMENTS[risingSign];
    const modality = MODALITIES[sunSign];

    // Dominant element
    const elCount = { Fire:0, Earth:0, Air:0, Water:0 };
    [sunEl, moonEl, risingEl].forEach(e => elCount[e]++);
    const dominant = Object.keys(elCount).reduce((a,b) => elCount[a] >= elCount[b] ? a : b);

    // ── MATH LOG ──────────────────────────────────
    const mathLog = [
      `INPUT`,
      `  Date/Time  : ${D.toString().padStart(2,'0')}/${M.toString().padStart(2,'0')}/${Y}  ${hr.toString().padStart(2,'0')}:${mn.toString().padStart(2,'0')} local`,
      `  Location   : ${place}`,
      `  Latitude   : ${lat.toFixed(4)}°   Longitude: ${lon.toFixed(4)}°`,
      `  TZ Offset  : ${tzOffsetHrs >= 0 ? '+' : ''}${tzOffsetHrs}h   UT = ${UT.toFixed(4)}h`,
      ``,
      `JULIAN DAY NUMBER`,
      `  Y=${Yj}  M=${Mj}  A=${A}  B=${B}`,
      `  JDN = 365.25×(Y+4716) + 30.6001×(M+1) + D + B - 1524.5 + UT/24`,
      `  JDN = ${JDN.toFixed(6)}`,
      `  T   = (JDN - 2451545.0) / 36525 = ${T.toFixed(8)}  [Julian centuries]`,
      ``,
      `SUN POSITION`,
      `  L0  = 280.46646 + 36000.76983×T        = ${L0.toFixed(4)}°  [mean longitude]`,
      `  M☉  = 357.52911 + 35999.05029×T        = ${M_sun.toFixed(4)}°  [mean anomaly]`,
      `  C   = Equation of Center (sine series)  = ${C.toFixed(4)}°`,
      `  ☀ Sun Longitude  = L0 + C              = ${sunLon.toFixed(4)}°  →  ${sunSign}`,
      ``,
      `MOON POSITION`,
      `  Lm  = 218.3165 + 481267.8813×T         = ${Lm.toFixed(4)}°  [mean longitude]`,
      `  Mm  = 134.9634 + 477198.8676×T         = ${Mm.toFixed(4)}°  [mean anomaly]`,
      `  F   = 93.2721  + 483202.0175×T         = ${F.toFixed(4)}°  [arg. of latitude]`,
      `  ΔL  = perturbation corrections          = ${dL.toFixed(4)}°`,
      `  ☽ Moon Longitude = Lm + ΔL             = ${moonLon.toFixed(4)}°  →  ${moonSign}`,
      ``,
      `ASCENDANT`,
      `  ε   = 23.439291 - 0.013004×T           = ${epsilon.toFixed(4)}°  [obliquity]`,
      `  GMST= 280.46061837 + 360.985647×(JDN-J2000)`,
      `  GMST= ${GMST.toFixed(4)}°`,
      `  LST = GMST + longitude                  = ${LST.toFixed(4)}°`,
      `  ASC = atan2(cos LST, -(sin LST·cos ε + tan φ·sin ε))`,
      `  ↑ Ascendant                             = ${asc.toFixed(4)}°  →  ${risingSign}`,
    ].join('\n');

    clearInterval(msgInterval);
    hide('loadingSection');

    // ── RENDER RESULTS ────────────────────────────
    renderResults({
      name, date, time, place,
      sunLon, moonLon, asc,
      sunSign, moonSign, risingSign,
      sunEl, moonEl, risingEl,
      modality, dominant, mathLog,
      lat, lon
    });

  } catch (err) {
    clearInterval(msgInterval);
    hide('loadingSection');
    show('formSection');
    errEl.textContent = `Error: ${err.message}`;
    errEl.classList.remove('hidden');
    btn.disabled = false;
  }
}

// ─── RENDER ───────────────────────────────────────
function renderResults(d) {
  document.getElementById('resultName').textContent = d.name;
  document.getElementById('resultSubtitle').textContent =
    `${formatDate(d.date)} · ${d.time} · ${d.place}`;

  // Signs
  setText('sunSign', d.sunSign);
  setText('moonSign', d.moonSign);
  setText('risingSign', d.risingSign);
  setText('sunDeg', `${d.sunLon.toFixed(1)}°`);
  setText('moonDeg', `${d.moonLon.toFixed(1)}°`);
  setText('risingDeg', `${d.asc.toFixed(1)}°`);

  setElementBadge('sunElement', d.sunEl);
  setElementBadge('moonElement', d.moonEl);
  setElementBadge('risingElement', d.risingEl);

  // Math
  document.getElementById('mathOutput').textContent = d.mathLog;

  // Chart wheel
  drawWheel(d.sunLon, d.moonLon, d.asc);

  // Reading
  buildReading(d);

  // Fields
  setText('mathField', MATH_FIELDS[d.dominant]);
  setText('careerField', CAREER_FIELDS[d.sunSign] +
    (d.sunSign !== d.risingSign ? '\n\nYour Rising in ' + d.risingSign + ' also draws you toward:\n' + CAREER_FIELDS[d.risingSign] : ''));

  show('resultsSection');
}

function buildReading(d) {
  const elCountDisplay = { Fire:0, Earth:0, Air:0, Water:0 };
  [d.sunEl, d.moonEl, d.risingEl].forEach(e => elCountDisplay[e]++);

  const para1 = `Your <strong>Sun in ${d.sunSign}</strong> illuminates your core identity — you are ${SIGN_TRAITS[d.sunSign]}.`;
  const para2 = `Your <strong>Moon in ${d.moonSign}</strong> governs your inner emotional world: ${SIGN_TRAITS[d.moonSign]}.`;
  const para3 = `Your <strong>Rising in ${d.risingSign}</strong> shapes the face you present to the world — ${SIGN_TRAITS[d.risingSign]}.`;
  const para4 = `${MODALITY_NOTES[d.modality]}`;
  const para5 = `With <strong>${elCountDisplay[d.dominant]} of 3 key placements in ${d.dominant}</strong>, this element defines your dominant mode of being. ${elementDesc(d.dominant)}`;

  document.getElementById('readingContent').innerHTML =
    [para1, para2, para3, para4, para5].map(p => `<p>${p}</p>`).join('');
}

function elementDesc(el) {
  const desc = {
    Fire:  "You are energized by passion, action, and inspiration — the world is a canvas for your boldness.",
    Earth: "You are grounded in practicality and patience — you build things that last.",
    Air:   "You are animated by ideas and connection — the intellectual realm is your natural home.",
    Water: "You move by intuition and feeling — depth, empathy, and perception are your gifts."
  };
  return desc[el];
}

// ─── WHEEL CANVAS ─────────────────────────────────
function drawWheel(sunLon, moonLon, asc) {
  const canvas = document.getElementById('chartWheel');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const R = W * 0.46;

  ctx.clearRect(0, 0, W, H);

  // Background circle
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(13,13,30,0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(201,168,76,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Inner ring
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.72, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(201,168,76,0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 12 Sign sectors
  for (let i = 0; i < 12; i++) {
    const startAngle = toRad(i * 30 - 90);
    const endAngle   = toRad((i + 1) * 30 - 90);

    // Sector dividers
    ctx.beginPath();
    ctx.moveTo(cx + R * 0.72 * Math.cos(startAngle), cy + R * 0.72 * Math.sin(startAngle));
    ctx.lineTo(cx + R * Math.cos(startAngle), cy + R * Math.sin(startAngle));
    ctx.strokeStyle = 'rgba(201,168,76,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Sign symbol
    const midAngle = toRad(i * 30 + 15 - 90);
    const symR = R * 0.86;
    const el = ELEMENTS[ZODIAC_SIGNS[i]];
    ctx.fillStyle = ELEMENT_COLORS[el] + 'cc';
    ctx.font = `${W * 0.042}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ZODIAC_SYMBOLS[i], cx + symR * Math.cos(midAngle), cy + symR * Math.sin(midAngle));
  }

  // Planet markers
  drawPlanet(ctx, cx, cy, R * 0.58, sunLon, '☀', '#f0c040', W);
  drawPlanet(ctx, cx, cy, R * 0.45, moonLon, '☽', '#a0b4d8', W);
  drawPlanet(ctx, cx, cy, R * 0.58, asc, '↑', '#80c890', W);

  // Center point
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(201,168,76,0.5)';
  ctx.fill();
}

function drawPlanet(ctx, cx, cy, r, lon, symbol, color, W) {
  // 0° Aries = top (−90°), going clockwise
  const angle = toRad(lon - 90);
  const x = cx + r * Math.cos(angle);
  const y = cy + r * Math.sin(angle);

  ctx.beginPath();
  ctx.arc(x, y, W * 0.036, 0, Math.PI * 2);
  ctx.fillStyle = color + '22';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = `${W * 0.048}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(symbol, x, y);
}

// ─── MATH TOGGLE ──────────────────────────────────
function toggleMath() {
  const box = document.getElementById('mathBox');
  const arrow = document.getElementById('mathArrow');
  if (box.classList.contains('hidden')) {
    box.classList.remove('hidden');
    arrow.textContent = '▴';
  } else {
    box.classList.add('hidden');
    arrow.textContent = '▾';
  }
}

// ─── RESET ────────────────────────────────────────
function reset() {
  hide('resultsSection');
  show('formSection');
  document.getElementById('calculateBtn').disabled = false;
  document.getElementById('mathBox').classList.add('hidden');
  document.getElementById('mathArrow').textContent = '▾';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── HELPERS ──────────────────────────────────────
function toRad(deg) { return deg * Math.PI / 180; }
function toDeg(rad) { return rad * 180 / Math.PI; }

function getSign(lon) {
  const idx = Math.floor(((lon % 360) + 360) % 360 / 30);
  return ZODIAC_SIGNS[idx];
}

function setText(id, val) {
  document.getElementById(id).textContent = val;
}

function setElementBadge(id, el) {
  const el_div = document.getElementById(id);
  el_div.textContent = el;
  el_div.className = `placement-element element-${el}`;
}

function show(id) { document.getElementById(id).classList.remove('hidden'); }
function hide(id) { document.getElementById(id).classList.add('hidden'); }

function formatDate(dateStr) {
  const [y,m,d] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
}
