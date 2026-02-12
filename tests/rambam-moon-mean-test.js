// Rambam moon mean (14:1–14:2): assert implied daily motion is 13° 10′ 35″ for every table row.
const path = require("path");
const fs = require("fs");

const global = globalThis;
global.window = undefined;

const helpersPath = path.join(__dirname, "..", "js", "rambam-helpers.js");
eval(fs.readFileSync(helpersPath, "utf8"));

const moonMeanPath = path.join(__dirname, "..", "js", "rambam-moon-mean.js");
eval(fs.readFileSync(moonMeanPath, "utf8"));

const RambamMoonMean = global.RambamMoonMean;
const H = global.RambamHelpers;
if (!RambamMoonMean || !H) throw new Error("RambamMoonMean or RambamHelpers not loaded");

const MOON_DAILY_DEG = RambamMoonMean.MOON_DAILY_DEG;
const EXPECTED_DAILY_DEG = 13 + 10 / 60 + 35 / 3600; // 13° 10′ 35″
const TOLERANCE_DEG = 1 / 3600; // 1 arcsecond

const rows = RambamMoonMean.getTableRows();

console.log("Expected daily motion: 13° 10′ 35″ =", EXPECTED_DAILY_DEG);
console.log("MOON_DAILY_DEG =", MOON_DAILY_DEG);
console.log("");

let failed = 0;
rows.forEach((row) => {
  const fullDeg = row.remainderDeg + row.revolutions * 360;
  const impliedDailyDeg = fullDeg / row.days;
  const diff = Math.abs(impliedDailyDeg - EXPECTED_DAILY_DEG);
  const ok = diff <= TOLERANCE_DEG;

  const impliedStr = H.formatDms(impliedDailyDeg);
  const status = ok ? "ok" : "FAIL";
  console.log(
    row.days + " days: implied daily = " + impliedStr + " (" + impliedDailyDeg.toFixed(6) + "°) — " + status
  );

  if (!ok) {
    console.log("  expected 13° 10′ 35″ (" + EXPECTED_DAILY_DEG + "°), diff = " + diff + "°");
    failed++;
  }
});

if (failed > 0) {
  console.error("\nFAIL: " + failed + " row(s) have implied daily ≠ 13° 10′ 35″");
  process.exit(1);
}

console.log("\nAll " + rows.length + " rows: implied daily motion is 13° 10′ 35″ (within 1″).");
