// Test: Purim (14 Adar / 14 Adar2 in leap years) can only fall on 4 weekdays.
// Run: node tests/test-purim-histogram.js

const HebrewCore = require("../js/hebrew-core.js");
global.HebrewCore = HebrewCore;
const Stats = require("../js/stats.js");

const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function runTest() {
  const purim = HebrewCore.HEBREW_HOLIDAYS.find((h) => h.name === "Purim");
  if (!purim) {
    console.error("FAIL: Purim not found in HEBREW_HOLIDAYS");
    process.exit(1);
  }

  const hist = Stats.weekdayHistogramData(
    purim.month,
    purim.startDay,
    purim.name,
    purim
  );

  if (!hist) {
    console.error("FAIL: weekdayHistogramData returned null");
    process.exit(1);
  }

  const counts = hist.data;
  const nonZeroDays = counts
    .map((c, i) => (c > 0 ? weekdayNames[i] : null))
    .filter(Boolean);
  const zeroDays = counts
    .map((c, i) => (c === 0 ? weekdayNames[i] : null))
    .filter(Boolean);

  console.log("Purim weekday histogram (last 2000 Hebrew years):");
  weekdayNames.forEach((name, i) => {
    console.log("  " + name + ": " + counts[i]);
  });
  console.log("Non-zero: " + nonZeroDays.join(", "));
  console.log("Zero: " + zeroDays.join(", "));

  // Purim cannot fall on Mon(1), Wed(3), or Sat(6) — weekdays 2,4,7 in 1–7 numbering
  const forbidden = [1, 3, 6]; // Mon, Wed, Sat
  const hasForbidden = forbidden.some((wd) => counts[wd] > 0);
  const numNonZero = nonZeroDays.length;

  if (hasForbidden) {
    const bad = forbidden.filter((wd) => counts[wd] > 0);
    console.error(
      "FAIL: Purim must not fall on Mon, Wed, or Sat; got non-zero for: " +
        bad.map((wd) => weekdayNames[wd]).join(", ")
    );
    process.exit(1);
  }

  if (numNonZero !== 4) {
    console.error(
      "FAIL: Purim should fall on exactly 4 weekdays, got " +
        numNonZero +
        " (" +
        nonZeroDays.join(", ") +
        ")"
    );
    process.exit(1);
  }

  console.log("\nPASS: Purim falls on exactly 4 weekdays (Sun, Tue, Thu, Fri).");
}

runTest();
