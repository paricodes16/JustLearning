// ----- Grab the elements we need from the page -----
const display = document.getElementById("display");
const ring = document.getElementById("ring");
const app = document.querySelector(".app");
const minutesInput = document.getElementById("minutes");
const secondsInput = document.getElementById("seconds");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const presetButtons = document.querySelectorAll(".chip");

const RING_LENGTH = 339.292; // must match stroke-dasharray in style.css

// ----- State: the things that change while the app runs -----
let totalMs = 0;      // full length of the timer
let remainingMs = 0;  // time left
let endTime = 0;      // the clock time when the timer should hit zero
let intervalId = null;
let running = false;

// ----- Helpers -----
function readInputs() {
  const m = Math.max(0, parseInt(minutesInput.value, 10) || 0);
  const s = Math.min(59, Math.max(0, parseInt(secondsInput.value, 10) || 0));
  return (m * 60 + s) * 1000;
}

function format(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function render() {
  display.textContent = format(remainingMs);
  document.title = running ? format(remainingMs) + " - Timer" : "Timer";
  // Ring empties as time runs out
  const progress = totalMs > 0 ? remainingMs / totalMs : 0;
  ring.style.strokeDashoffset = RING_LENGTH * (1 - progress);
}

function setInputsDisabled(disabled) {
  minutesInput.disabled = disabled;
  secondsInput.disabled = disabled;
  presetButtons.forEach((b) => (b.disabled = disabled));
}

// A short beep made with the browser's Web Audio API (no sound file needed)
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.35;
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t);
      osc.stop(t + 0.25);
    }
  } catch (err) {
    // If audio is blocked, the timer still works silently
  }
}

// ----- Timer actions -----
function tick() {
  // Compare to the real clock so the timer stays accurate even if the tab is slow
  remainingMs = Math.max(0, endTime - Date.now());
  render();
  if (remainingMs === 0) finish();
}

function start() {
  if (remainingMs === 0) {
    // Fresh start: read the inputs
    totalMs = remainingMs = readInputs();
    if (totalMs === 0) return; // nothing to count down
  }
  app.classList.remove("finished");
  endTime = Date.now() + remainingMs;
  running = true;
  startBtn.textContent = "Pause";
  setInputsDisabled(true);
  intervalId = setInterval(tick, 200);
  render();
}

function pause() {
  clearInterval(intervalId);
  running = false;
  startBtn.textContent = "Resume";
  render();
}

function finish() {
  clearInterval(intervalId);
  running = false;
  startBtn.textContent = "Start";
  setInputsDisabled(false);
  app.classList.add("finished");
  beep();
}

function reset() {
  clearInterval(intervalId);
  running = false;
  app.classList.remove("finished");
  startBtn.textContent = "Start";
  setInputsDisabled(false);
  totalMs = remainingMs = readInputs();
  render();
}

// ----- Wire up the buttons -----
startBtn.addEventListener("click", () => (running ? pause() : start()));
resetBtn.addEventListener("click", reset);

presetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    minutesInput.value = btn.dataset.minutes;
    secondsInput.value = 0;
    reset();
  });
});

[minutesInput, secondsInput].forEach((input) => input.addEventListener("input", reset));

// Space bar toggles start/pause (unless you're typing in a field)
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && e.target.tagName !== "INPUT") {
    e.preventDefault();
    startBtn.click();
  }
});

// Show the starting time when the page loads
reset();
