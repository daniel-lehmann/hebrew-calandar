// Epoch example: Tamuz 14 4938 0h — real place of sun should be < 105°
const path = require("path");
const fs = require("fs");

const global = globalThis;
global.window = undefined;

// Load HebrewCore (Node)
const HebrewCore = require("../js/hebrew-core.js");
global.HebrewCore = HebrewCore;

// Load RambamHelpers
const helpersPath = path.join(__dirname, "..", "js", "rambam-helpers.js");
eval(fs.readFileSync(helpersPath, "utf8"));

// Load RambamSunCalc
const sunCalcPath = path.join(__dirname, "..", "js", "rambam-sun-calc.js");
eval(fs.readFileSync(sunCalcPath, "utf8"));

const RambamSunCalc = global.RambamSunCalc;
const H = global.RambamHelpers;
if (!RambamSunCalc || !H) throw new Error("RambamSunCalc or RambamHelpers not loaded");

// Default date from rambam4: Saturday Tamuz 14 4938, 0 hours
const days = RambamSunCalc.daysFromEpoch(4938, "Tammuz", 14, 0);
if (days == null) throw new Error("daysFromEpoch returned null");

const result = RambamSunCalc.compute(days);

console.log("Tamuz 14 4938 0h — days from epoch:", days.toFixed(4));
console.log("Sun average place:", H.formatDms(result.sunAveragePlace), "(", result.sunAveragePlace.toFixed(4), ")");
console.log("Aphelion place:  ", H.formatDms(result.aphelionPlace));
console.log("Distance (avg from aphelion):", H.formatDms(result.distanceFromAphelion));
console.log("Correction:      ", H.formatDms(result.correction));
console.log("Real place of sun:", H.formatDms(result.realPlace), "(", result.realPlace.toFixed(4), ")");

const realLessThan105 = result.realPlace < 105;
console.log("Real place < 105°?", realLessThan105 ? "yes" : "NO");

if (!realLessThan105) {
  console.error("FAIL: Real place should be < 105° for Tamuz 14 4938 0h");
  process.exit(1);
}
