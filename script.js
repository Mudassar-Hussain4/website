/* =========================================================
   0) STATE
   ========================================================= */
const history = [];                 // Array
let calcState = {                   // Object
  current: "",
  lastResult: 0,
  theme: "light"
};

/* =========================================================
   1) DOM CACHE
   ========================================================= */
const display       = document.getElementById("display");
const historyList   = document.getElementById("historyList");
const validationMsg = document.getElementById("validationMsg");
const coordsEl      = document.getElementById("coords");
const keyCodeEl     = document.getElementById("keyCode");
const eventTypeEl   = document.getElementById("eventType");
const binaryEl      = document.getElementById("binary");
const minmaxEl      = document.getElementById("minmax");
const clockEl       = document.getElementById("clock");
const browserEl     = document.getElementById("browser");
const themeLabel    = document.getElementById("themeLabel");
const greetingEl    = document.getElementById("greeting");
const cookieMsg     = document.getElementById("cookieMsg");
const geoMsg        = document.getElementById("geoMsg");

/* =========================================================
   2) MAP: operator → function  (Arrow functions)
   ========================================================= */
const operations = new Map([
  ["+", (a, b) => a + b],
  ["-", (a, b) => a - b],
  ["*", (a, b) => a * b],
  ["/", (a, b) => (b === 0 ? "Error: /0" : a / b)]
]);

/* =========================================================
   3) REGEX VALIDATION
   ========================================================= */
const exprPattern = /^[0-9+\-*/. ]+$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateExpression(str) {
  if (!str) {
    validationMsg.innerHTML = "Expression is empty.";
    return false;
  }
  if (!exprPattern.test(str)) {
    validationMsg.innerHTML = "Invalid characters detected.";
    return false;
  }
  validationMsg.innerHTML = "";
  return true;
}

/* =========================================================
   4) OUTPUT HELPERS
   ========================================================= */
function updateDisplay(value) {
  calcState.current = String(value);
  display.value = String(value);
  console.log("Display:", value);
}

function addHistory(entry) {
  history.push(entry);
  historyList.innerHTML = "";
  for (let i = 0; i < history.length; i++) {
    const li = document.createElement("li");
    li.textContent = history[i];
    historyList.appendChild(li);
  }
  updateMinMax();
}

/* =========================================================
   5) PARSER using String methods + regex
   ========================================================= */
function evaluateExpression(expr) {
  // Clean whitespace using replace() + regex
  const clean = expr.replace(/\s+/g, "");

  // Find the LAST operator with search()
  const opIndex = clean.search(/[+\-*/](?!.*[+\-*/])/);
  if (opIndex <= 0) return "Error";

  const left  = parseFloat(clean.slice(0, opIndex));
  const op    = clean[opIndex];
  const right = parseFloat(clean.slice(opIndex + 1));

  if (isNaN(left) || isNaN(right)) return "Error";

  const fn = operations.get(op);
  return fn ? fn(left, right) : "Error";
}

/* =========================================================
   6) PROMISE + ASYNC/AWAIT + setTimeout (callback)
   ========================================================= */
function fakeCompute(expr) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const result = evaluateExpression(expr);
      if (result === "Error" || result === "Error: /0") {
        reject("Computation failed: " + result);
      } else {
        resolve(result);
      }
    }, 600);
  });
}

async function handleEquals() {
  if (!validateExpression(calcState.current)) return;

  display.value = "…computing";
  try {
    const result = await fakeCompute(calcState.current);
    calcState.lastResult = result;
    updateDisplay(result);
    addHistory(calcState.current + " = " + result);
    updateBinary(result);
  } catch (err) {
    alert(err);
    updateDisplay("Error");
  }
}

/* =========================================================
   7) BITWISE + MATH OBJECT
   ========================================================= */
function updateBinary(num) {
  // Convert to 32-bit signed int, then binary string
  const int32 = Number(num) | 0;            // Bitwise OR converts to 32-bit
  binaryEl.innerHTML = (int32 >>> 0).toString(2); // Zero-fill right shift
}

function updateMinMax() {
  const nums = history
    .map((h) => parseFloat(h.split("=").pop()))
    .filter((n) => !isNaN(n))
    .slice(-5);
  if (nums.length === 0) {
    minmaxEl.innerHTML = "—";
    return;
  }
  const min = Math.min.apply(null, nums);
  const max = Math.max.apply(null, nums);
  minmaxEl.innerHTML = `min=${min}, max=${max}`;
}

/* =========================================================
   8) EVENT HANDLERS
   ========================================================= */
// Grid buttons
document.querySelectorAll(".keys button[data-key]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    updateDisplay(calcState.current + e.target.dataset.key);
    eventTypeEl.innerHTML = e.type;
  });
});

// Equals
document.getElementById("equals").addEventListener("click", handleEquals);

// Clear
document.getElementById("clear").addEventListener("click", () => {
  if (confirm("Clear the display?")) {
    updateDisplay("");
    validationMsg.innerHTML = "";
  }
});

// Square root
document.getElementById("sqrt").addEventListener("click", () => {
  const n = parseFloat(calcState.current);
  if (isNaN(n) || n < 0) {
    alert("Cannot take sqrt.");
    return;
  }
  const r = Math.sqrt(n);
  updateDisplay(r);
  addHistory("√" + n + " = " + r);
  updateBinary(r);
});

// Random
document.getElementById("random").addEventListener("click", () => {
  const r = Math.round(Math.random() * 100);
  updateDisplay(r);
  addHistory("rand = " + r);
  updateBinary(r);
});

// History controls
document.getElementById("clearHistory").addEventListener("click", () => {
  history.length = 0;
  historyList.innerHTML = "";
  minmaxEl.innerHTML = "—";
});

document.getElementById("sortHistory").addEventListener("click", () => {
  history.sort();
  historyList.innerHTML = "";
  for (let i = 0; i < history.length; i++) {
    const li = document.createElement("li");
    li.textContent = history[i];
    historyList.appendChild(li);
  }
});

// Event object: mouse coords + event type
document.addEventListener("mousedown", (e) => {
  coordsEl.innerHTML = `X:${e.clientX}, Y:${e.clientY}`;
  eventTypeEl.innerHTML = e.type;
});

document.addEventListener("keyup", (e) => {
  keyCodeEl.innerHTML = e.keyCode;
  eventTypeEl.innerHTML = e.type;
});

// Count DOM elements — getElementsByTagName + getElementsByName
document.getElementById("countBtn").addEventListener("click", () => {
  const buttons = document.getElementsByTagName("button");
  const named   = document.getElementsByName("demoInput");
  document.getElementById("btnCount").innerHTML = buttons.length;
  document.getElementById("nameCount").innerHTML = named.length;
});

/* =========================================================
   9) FORM VALIDATION with onsubmit + regex
   ========================================================= */
document.getElementById("demoForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const msg   = document.getElementById("emailMsg");
  if (emailPattern.test(email)) {
    msg.style.color = "var(--accent-2)";
    msg.innerHTML = "✓ Valid email.";
  } else {
    msg.style.color = "var(--danger)";
    msg.innerHTML = "✗ Invalid email format.";
  }
});

// onblur → uppercase
document.getElementById("email").addEventListener("blur", function () {
  this.value = this.value.toUpperCase();
});

/* =========================================================
   10) THEME TOGGLE + COOKIES + CSS change
   ========================================================= */
function setTheme(theme) {
  calcState.theme = theme;
  if (theme === "dark") {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
  themeLabel.innerHTML = theme;
  // Save via cookie
  document.cookie = "theme=" + theme + "; path=/; max-age=86400";
}

document.getElementById("themeToggle").addEventListener("click", () => {
  setTheme(calcState.theme === "light" ? "dark" : "light");
});

function checkCookies() {
  if (navigator.cookieEnabled === true) {
    cookieMsg.style.color = "var(--accent-2)";
    cookieMsg.innerHTML = "Cookies are enabled.";
  } else {
    cookieMsg.style.color = "var(--danger)";
    cookieMsg.innerHTML = "Cookies are not enabled.";
  }
}

function getCookie(name) {
  const parts = document.cookie.split("; ");
  for (let i = 0; i < parts.length; i++) {
    const [k, v] = parts[i].split("=");
    if (k === name) return v;
  }
  return null;
}

/* =========================================================
   11) TIMERS — live clock & welcome (callback)
   ========================================================= */
function startClock() {
  setInterval(() => {
    clockEl.innerHTML = new Date().toLocaleString();
  }, 1000);
}

setTimeout(() => {
  const name = prompt("Welcome! What is your name?");
  if (name) {
    greetingEl.innerHTML = "Hello, " + name + "! 👋";
    alert("Welcome, " + name + "!");
  }
}, 500);

/* =========================================================
   12) BROWSER DETECTION
   ========================================================= */
function detectBrowser() {
  const ua = navigator.userAgent;
  let b = "Unknown";
  if (ua.indexOf("Opera") !== -1 || ua.indexOf("OPR") !== -1) b = "Opera";
  else if (ua.indexOf("Edg") !== -1) b = "Edge";
  else if (ua.indexOf("Chrome") !== -1) b = "Chrome";
  else if (ua.indexOf("Safari") !== -1) b = "Safari";
  else if (ua.indexOf("Firefox") !== -1) b = "Firefox";
  else if (ua.indexOf("MSIE") !== -1 || !!document.documentMode) b = "IE";
  browserEl.innerHTML = b;
}

/* =========================================================
   13) QUERY STRING (URLSearchParams)
   ========================================================= */
function readQuery() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get("name");
  if (name) {
    greetingEl.innerHTML = "Hello, " + name + "! (from URL)";
  }
}

/* =========================================================
   14) GEOLOCATION
   ========================================================= */
document.getElementById("geoBtn").addEventListener("click", () => {
  if (!navigator.geolocation) {
    geoMsg.innerHTML = "Geolocation not supported.";
    return;
  }
  geoMsg.innerHTML = "Locating…";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      geoMsg.style.color = "var(--accent-2)";
      geoMsg.innerHTML = `Lat: ${pos.coords.latitude.toFixed(4)}, Lon: ${pos.coords.longitude.toFixed(4)}`;
    },
    (err) => {
      geoMsg.style.color = "var(--danger)";
      geoMsg.innerHTML = "Error: " + err.message;
    }
  );
});

/* =========================================================
   15) HISTORY BACK
   ========================================================= */
document.getElementById("backBtn").addEventListener("click", () => {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    alert("No previous page in history.");
  }
});

/* =========================================================
   16) INIT
   ========================================================= */
function init() {
  startClock();
  detectBrowser();
  readQuery();
  checkCookies();

  const savedTheme = getCookie("theme");
  if (savedTheme) setTheme(savedTheme);

  // First history push so back() works even on initial load
  history.pushState({ page: 1 }, "", "");
  console.log("History entries:", window.history.length);
  console.log("Cookies enabled:", navigator.cookieEnabled);
}

init();