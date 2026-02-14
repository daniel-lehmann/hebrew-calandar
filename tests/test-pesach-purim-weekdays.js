// Test: Pesach (15 Nisan) cannot fall on Mon, Wed, Fri (lo ADU for Nisan).
// Purim (14 Adar/Adar2) is 30 days before 15 Nisan, so cannot fall on Mon, Wed, Sat.
// Run: node tests/test-pesach-purim-weekdays.js

const HebrewCore = require("../js/hebrew-core.js");
global.HebrewCore = HebrewCore;
const Stats = require("../js/stats.js");

const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error("FAIL: " + msg);
  }
}

// Pesach = 15 Nisan cannot be Mon(1), Wed(3), Fri(5)
function testPesachWeekdays() {
  console.log("=== Test 1: Pesach (15 Nisan) cannot fall on Mon, Wed, Fri ===");
  const hist = Stats.weekdayHistogramData("Nisan", 15, "Pesach", undefined);
  if (!hist) {
    assert(false, "weekdayHistogramData returned null");
    return;
  }
  const forbidden = [1, 3, 5]; // Mon, Wed, Fri
  forbidden.forEach((wd) => {
    assert(hist.data[wd] === 0, "Pesach on " + weekdayNames[wd] + " (count=" + hist.data[wd] + ")");
  });
  const nonZero = hist.data.filter((c) => c > 0).length;
  assert(nonZero === 4, "Pesach should fall on exactly 4 weekdays, got " + nonZero);
}

// Purim = 14 Adar (non-leap) or 14 Adar2 (leap) cannot fall on Mon(1), Wed(3), Sat(6)
// because Purim is 30 days before 15 Nisan, and 15 Nisan can't be Mon/Wed/Fri
function testPurimWeekdays() {
  console.log("=== Test 2: Purim (14 Adar/Adar2) cannot fall on Mon, Wed, Sat ===");
  const purim = HebrewCore.HEBREW_HOLIDAYS.find((h) => h.name === "Purim");
  assert(!!purim, "Purim not found");
  assert(!!purim.leapMonth, "Purim must have leapMonth for Adar2 in leap years");
  const hist = Stats.weekdayHistogramData(
    purim.month,
    purim.startDay,
    purim.name,
    purim
  );
  if (!hist) {
    assert(false, "weekdayHistogramData returned null");
    return;
  }
  const forbidden = [1, 3, 6]; // Mon, Wed, Sat
  forbidden.forEach((wd) => {
    assert(hist.data[wd] === 0, "Purim on " + weekdayNames[wd] + " (count=" + hist.data[wd] + ")");
  });
  const nonZero = hist.data.filter((c) => c > 0).length;
  assert(nonZero === 4, "Purim should fall on exactly 4 weekdays, got " + nonZero);
}

// Purim (14 Adar/Adar2) is always 30 days before 15 Nisan (Adar II has 29 days)
function testPurim30DaysBeforePesach() {
  console.log("=== Test 3: 14 Adar/Adar2 is 30 days before 15 Nisan ===");
  const core = HebrewCore;
  const purim = core.HEBREW_HOLIDAYS.find((h) => h.name === "Purim");
  const DAY_MS = 24 * 60 * 60 * 1000;
  for (let hy = 3787; hy <= 5786; hy++) {
    const month = core.getHolidayMonthForYear(purim, hy);
    const purimGreg = core.gregorianFromHebrew(hy, month, 14);
    const pesachGreg = core.gregorianFromHebrew(hy, "Nisan", 15);
    const purimAbs = Math.floor(purimGreg.date.getTime() / DAY_MS);
    const pesachAbs = Math.floor(pesachGreg.date.getTime() / DAY_MS);
    const diff = pesachAbs - purimAbs;
    assert(diff === 30, "Year " + hy + ": 15 Nisan - 14 " + month + " = " + diff + " days (expect 30)");
  }
}

// In leap years, Purim must use Adar2 (14 Adar2), not Adar (14 Adar I)
function testPurimUsesAdar2InLeapYears() {
  console.log("=== Test 4: Purim uses Adar2 in leap years, not Adar ===");
  const core = HebrewCore;
  const purim = core.HEBREW_HOLIDAYS.find((h) => h.name === "Purim");
  // 5784 is a leap year (year 8 of cycle)
  const hy = 5784;
  assert(core.isLeapYearHebrew(hy), "5784 should be leap year");
  const month = core.getHolidayMonthForYear(purim, hy);
  assert(month === "Adar2", "Purim in leap year 5784 should use Adar2, got " + month);
  // 14 Adar in 5784 would be wrong - it's Purim Katan, not Purim
  const adar14 = core.gregorianFromHebrew(hy, "Adar", 14);
  const adar2_14 = core.gregorianFromHebrew(hy, "Adar2", 14);
  assert(
    adar14.date.getTime() !== adar2_14.date.getTime(),
    "14 Adar and 14 Adar2 must be different dates in leap year"
  );
}

testPesachWeekdays();
testPurimWeekdays();
testPurim30DaysBeforePesach();
testPurimUsesAdar2InLeapYears();

console.log("\n=== Results: " + passed + " passed, " + failed + " failed ===");
process.exit(failed > 0 ? 1 : 0);
