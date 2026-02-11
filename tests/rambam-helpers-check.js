// Verify RambamHelpers: at 86° correction = 1° 58′ 23.52″, and real < average when dist < 180
const path = require("path");
const fs = require("fs");

const global = globalThis;
global.window = undefined;

const helpersPath = path.join(__dirname, "..", "js", "rambam-helpers.js");
const code = fs.readFileSync(helpersPath, "utf8");
eval(code);

const H = global.RambamHelpers;
if (!H) throw new Error("RambamHelpers not attached");

const TARGET_86 = 1 + 58 / 60 + 23.52 / 3600; // 1° 58′ 23.52″ in decimal degrees

const c86 = H.rambamSunCorrection(86);
const formatted = H.formatDms(c86);
const ok = Math.abs(c86 - TARGET_86) < 0.00001;

console.log("Correction at 86°:", formatted, "(", c86.toFixed(6), "deg )");
console.log("Expected:         1° 58′ 23.52″ (", TARGET_86.toFixed(6), "deg )");
console.log("Match 1° 58′ 23.52″?", ok ? "yes" : "NO");

// When distance from aphelion < 180°, real = average - correction → real < average
const avg = 100;
const dist = 86;
const corr = H.rambamSunCorrection(dist);
const real = H.mod360(avg - corr);
console.log("When average=100°, dist=86°, real=" + real.toFixed(2) + "° (should be < 100):", real < 100 ? "yes" : "NO");

if (!ok) process.exit(1);
