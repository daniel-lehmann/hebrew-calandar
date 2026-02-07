// Basic Node test runner for hebrew-core.js

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
};

const HebrewCore = require("../js/hebrew-core.js");

function testLeapYears() {
  const cases = [
    { year: 5784, expected: true },
    { year: 5785, expected: false },
    { year: 5786, expected: false },
  ];
  for (const c of cases) {
    const actual = HebrewCore.isLeapYearHebrew(c.year);
    assert(
      actual === c.expected,
      `isLeapYearHebrew(${c.year}) expected ${c.expected} got ${actual}`
    );
  }
}

function testYearLengths() {
  const y1 = HebrewCore.hebrewYearLength(5785);
  const y2 = HebrewCore.hebrewYearLength(5786);
  assert(
    [353, 354, 355].includes(y1),
    `Year length 5785 should be standard, got ${y1}`
  );
  assert(
    [353, 354, 355].includes(y2),
    `Year length 5786 should be standard, got ${y2}`
  );
}

function testMonthSums() {
  for (let year = 5700; year <= 5800; year++) {
    const months = HebrewCore.yearMonths(year);
    const sum = months.reduce((acc, m) => acc + m.length, 0);
    const len = HebrewCore.hebrewYearLength(year);
    assert(
      sum === len,
      `Month lengths for ${year} do not match year length: ${sum} vs ${len}`
    );
  }
}

function testRoundTripGregorianHebrew() {
  const dates = [
    { y: 2025, m: 8, d: 22 },
    { y: 2026, m: 2, d: 1 },
    { y: 2030, m: 0, d: 1 },
  ];

  for (const g of dates) {
    const h = HebrewCore.gregorianToHebrew(g.y, g.m, g.d);
    const g2 = HebrewCore.gregorianFromHebrew(
      h.hebrewYear,
      h.hebrewMonthName,
      h.hebrewDay
    );
    assert(
      g.y === g2.year && g.m === g2.monthIndex && g.d === g2.day,
      `Round-trip failed for ${g.y}-${g.m + 1}-${g.d}`
    );
  }
}

function runAll() {
  testLeapYears();
  testYearLengths();
  testMonthSums();
  testRoundTripGregorianHebrew();
}

try {
  runAll();
  console.log("All hebrew-core tests passed.");
} catch (err) {
  console.error("Test failure:", err.message);
  process.exit(1);
}

