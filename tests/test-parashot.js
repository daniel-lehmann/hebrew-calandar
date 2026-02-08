// Test script to verify parasha scheduling logic
// Run: node tests/test-parashot.js

const HebrewCore = require("../js/hebrew-core.js");
globalThis.HebrewCore = HebrewCore;
require("../js/parashot.js");
const Parashot = globalThis.Parashot;

const DAY_MS = 24 * 60 * 60 * 1000;

function dayName(weekday) {
  return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][weekday];
}

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error("FAIL: " + msg); }
}

// ====================================================================
// Test 1: Bereshit on first Shabbat after Simchat Torah
// ====================================================================
console.log("=== Test 1: Bereshit falls after Simchat Torah ===");
for (var year = 5780; year <= 5800; year++) {
  var stGreg = HebrewCore.gregorianFromHebrew(year, "Tishrey", 23);
  var stAbs = Math.floor(stGreg.date.getTime() / DAY_MS);
  var stWd = stGreg.weekday;
  var daysToSat = (6 - stWd + 7) % 7;
  if (daysToSat === 0) daysToSat = 7;
  var firstShabbatAbs = stAbs + daysToSat;
  var firstShabbatDate = new Date(firstShabbatAbs * DAY_MS);
  var gYear = firstShabbatDate.getUTCFullYear();
  var gMonth = firstShabbatDate.getUTCMonth();
  var gDay = firstShabbatDate.getUTCDate();

  var parasha = Parashot.getParashaForDate(gYear, gMonth, gDay);
  var name = parasha ? parasha.name : "(none)";
  assert(name === "Bereshit", "Year " + year + ": expected Bereshit, got '" + name + "'");
}

// ====================================================================
// Test 2: No regular parasha during Sukkot/Shemini Atzeret/Simchat Torah
// ====================================================================
console.log("=== Test 2: No regular parasha during Sukkot week ===");
for (var year = 5780; year <= 5800; year++) {
  for (var day = 15; day <= 23; day++) {
    var greg = HebrewCore.gregorianFromHebrew(year, "Tishrey", day);
    if (greg.weekday === 6) {
      var parasha = Parashot.getParashaForDate(greg.year, greg.monthIndex, greg.day);
      var isRegular = parasha && !parasha.holiday && !parasha.simchatTorah;
      assert(!isRegular, "Year " + year + " Tishrey " + day + " (Sat): should NOT have regular parasha, got '" +
             (parasha ? parasha.name : "null") + "'");
    }
  }
}

// ====================================================================
// Test 3: Devarim on Shabbat Chazon (on or before 9 Av)
// ====================================================================
console.log("=== Test 3: Devarim always on Shabbat Chazon ===");
for (var year = 5780; year <= 5800; year++) {
  var tishaBAv = HebrewCore.gregorianFromHebrew(year, "Av", 9);
  var tbAbs = Math.floor(tishaBAv.date.getTime() / DAY_MS);
  var tbWd = tishaBAv.weekday;

  // Shabbat Chazon = last Saturday on or before 9 Av
  var daysBack = (tbWd + 1) % 7;
  var chazonAbs = tbAbs - daysBack;
  var chazonDate = new Date(chazonAbs * DAY_MS);

  var parasha = Parashot.getParashaForDate(
    chazonDate.getUTCFullYear(), chazonDate.getUTCMonth(), chazonDate.getUTCDate()
  );
  var name = parasha ? parasha.name : "(none)";
  assert(name === "Devarim", "Year " + year + ": Shabbat Chazon expected Devarim, got '" + name +
    "' (9Av=" + tishaBAv.date.toISOString().slice(0,10) + " " + dayName(tbWd) +
    ", Chazon=" + chazonDate.toISOString().slice(0,10) + ")");
}

// ====================================================================
// Test 4: Vaetchanan on Shabbat Nachamu (first Shabbat AFTER 9 Av)
// ====================================================================
console.log("=== Test 4: Vaetchanan always on Shabbat Nachamu ===");
for (var year = 5780; year <= 5800; year++) {
  var tishaBAv = HebrewCore.gregorianFromHebrew(year, "Av", 9);
  var tbAbs = Math.floor(tishaBAv.date.getTime() / DAY_MS);
  var tbWd = tishaBAv.weekday;

  // Shabbat Nachamu = first Saturday strictly after 9 Av
  var daysForward = (6 - tbWd + 7) % 7;
  if (daysForward === 0) daysForward = 7; // if 9Av is Shabbat, Nachamu is next week
  var nachamuAbs = tbAbs + daysForward;
  var nachamuDate = new Date(nachamuAbs * DAY_MS);

  var parasha = Parashot.getParashaForDate(
    nachamuDate.getUTCFullYear(), nachamuDate.getUTCMonth(), nachamuDate.getUTCDate()
  );
  var name = parasha ? parasha.name : "(none)";
  assert(name === "Vaetchanan", "Year " + year + ": Shabbat Nachamu expected Vaetchanan, got '" + name +
    "' (9Av=" + tishaBAv.date.toISOString().slice(0,10) + " " + dayName(tbWd) +
    ", Nachamu=" + nachamuDate.toISOString().slice(0,10) + ")");
}

// ====================================================================
// Test 5: Parasha order Bereshit→Haazinu in year 5786
// ====================================================================
console.log("=== Test 5: Parasha order for cycle 5786 ===");
var stGreg5786 = HebrewCore.gregorianFromHebrew(5786, "Tishrey", 23);
var stAbs5786 = Math.floor(stGreg5786.date.getTime() / DAY_MS);
var stWd5786 = stGreg5786.weekday;
var dts = (6 - stWd5786 + 7) % 7;
if (dts === 0) dts = 7;
var satAbs = stAbs5786 + dts;

var nextST = HebrewCore.gregorianFromHebrew(5787, "Tishrey", 23);
var nextSTAbs = Math.floor(nextST.date.getTime() / DAY_MS);

var regularParashot = [];
while (satAbs < nextSTAbs) {
  var d = new Date(satAbs * DAY_MS);
  var p = Parashot.getParashaForDate(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  if (p && !p.holiday) {
    regularParashot.push(p.name);
  }
  satAbs += 7;
}

console.log("  Regular parashot in cycle 5786: " + regularParashot.length);
console.log("  First: " + regularParashot[0]);
console.log("  Last:  " + regularParashot[regularParashot.length - 1]);

assert(regularParashot[0] === "Bereshit", "First parasha should be Bereshit, got " + regularParashot[0]);
assert(regularParashot[regularParashot.length - 1] === "Haazinu",
  "Last parasha should be Haazinu, got " + regularParashot[regularParashot.length - 1]);

console.log("\n  First 5:");
for (var pi = 0; pi < Math.min(5, regularParashot.length); pi++) {
  console.log("    " + (pi+1) + ". " + regularParashot[pi]);
}
console.log("  Around Devarim:");
for (var pi = 0; pi < regularParashot.length; pi++) {
  if (regularParashot[pi].indexOf("Masei") !== -1 ||
      regularParashot[pi] === "Devarim" ||
      regularParashot[pi] === "Vaetchanan") {
    console.log("    " + (pi+1) + ". " + regularParashot[pi]);
  }
}
console.log("  Last 5:");
for (var pi = Math.max(0, regularParashot.length - 5); pi < regularParashot.length; pi++) {
  console.log("    " + (pi+1) + ". " + regularParashot[pi]);
}

console.log("\n=== Results: " + passed + " passed, " + failed + " failed ===");
process.exit(failed > 0 ? 1 : 0);
