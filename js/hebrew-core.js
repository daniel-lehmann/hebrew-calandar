// hebrew-core.js
// Core Hebrew calendar calculations, implemented as a small, testable module.
// Exposed as both a global `HebrewCore` (browser) and `module.exports` (Node).

(function (global) {
  const DAY_MS = 24 * 60 * 60 * 1000;

  const HEBREW_MONTHS = [
    "Tishrey",
    "Heshvan",
    "Kislev",
    "Tevet",
    "Shevat",
    "Adar",
    "Nisan",
    "Iyar",
    "Sivan",
    "Tammuz",
    "Av",
    "Elul",
  ];

  const HEBREW_HOLIDAYS = [
    { name: "Pesach", month: "Nisan", startDay: 15, endDay: 21 },
    { name: "Shavuot", month: "Sivan", startDay: 6, endDay: 6 },
    { name: "Rosh Hashanah", month: "Tishrey", startDay: 1, endDay: 2 },
    { name: "Yom Kippur", month: "Tishrey", startDay: 10, endDay: 10 },
    { name: "Sukkot", month: "Tishrey", startDay: 15, endDay: 21 },
    { name: "Shemini Atzeret/Simchat Torah", month: "Tishrey", startDay: 22, endDay: 22 },
    // { name: "Simchat Torah", month: "Tishrey", startDay: 23, endDay: 23 },
    // Chanukah spans Kislev 25 for 8 days (ends Tevet 2 or 3 depending on length of Kislev).
    { name: "Chanukah", month: "Kislev", startDay: 25, length: 8 },
    { name: "Tu Bishvat", month: "Shevat", startDay: 15, endDay: 15 },
    // Purim: Adar 14 (non-leap) or Adar2 14 (leap years). 30 days before 15 Nisan.
    { name: "Purim", month: "Adar", leapMonth: "Adar2", startDay: 14, endDay: 14 },
    { name: "Shushan Purim", month: "Adar", leapMonth: "Adar2", startDay: 15, endDay: 15 },
    { name: "Pesach Sheni", month: "Iyar", startDay: 14, endDay: 14 },
    { name: "Lag BaOmer", month: "Iyar", startDay: 18, endDay: 18 },
    { name: "Tisha B’Av", month: "Av", startDay: 9, endDay: 9 },
    { name: "Tu B’Av", month: "Av", startDay: 15, endDay: 15 },
  ];

  function isLeapYearHebrew(year) {
    const cycleYear = ((year - 1) % 19) + 1;
    return [3, 6, 8, 11, 14, 17, 19].includes(cycleYear);
  }

  /** For holidays with leapMonth (e.g. Purim), return the correct month for the given Hebrew year. */
  function getHolidayMonthForYear(holiday, hebrewYear) {
    if (holiday.leapMonth && isLeapYearHebrew(hebrewYear)) {
      return holiday.leapMonth;
    }
    return holiday.month;
  }

  /**
   * Return an array of { monthName, day } for every day of the holiday in the given Hebrew year.
   * Handles multi-day holidays that span months (e.g. Chanukah: Kislev 25 for 8 days → into Tevet).
   */
  function getHolidayDaysInYear(hebrewYear, holiday) {
    const month = getHolidayMonthForYear(holiday, hebrewYear);
    if (holiday.length != null && holiday.length > 0) {
      const startAbs = absoluteFromHebrew(hebrewYear, month, holiday.startDay);
      const result = [];
      for (let i = 0; i < holiday.length; i++) {
        const abs = startAbs + i;
        const d = new Date(abs * DAY_MS);
        const h = gregorianToHebrew(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
        result.push({ monthName: h.hebrewMonthName, day: h.hebrewDay });
      }
      return result;
    }
    const result = [];
    const endDay = holiday.endDay != null ? holiday.endDay : holiday.startDay;
    for (let day = holiday.startDay; day <= endDay; day++) {
      result.push({ monthName: month, day: day });
    }
    return result;
  }

  /** Return true if (monthName, day) in the given Hebrew year falls on this holiday. */
  function isDayInHoliday(hebrewYear, monthName, day, holiday) {
    const days = getHolidayDaysInYear(hebrewYear, holiday);
    return days.some(function (d) {
      return d.monthName === monthName && d.day === day;
    });
  }

  // --------------- Molad calculation using exact integer chalakim ---------------
  // One chelek = 1/1080 of an hour (the traditional Hebrew time unit).
  // All molad arithmetic is done in chalakim to avoid floating-point errors.

  const HOUR_CHALAKIM = 1080;
  const DAY_CHALAKIM = 24 * HOUR_CHALAKIM;                        // 25920
  const LUNATION_CHALAKIM = 29 * DAY_CHALAKIM +
                            12 * HOUR_CHALAKIM + 793;              // 765433

  // Epoch: Molad of Tishrei 5786.
  // Design says: 22/9/2025, 18 hours + 187/1080 of an hour.
  // In traditional Hebrew time: Monday (Day 2), Hour 18, 187 chalakim.
  //   (Hebrew hours count from 6 PM of the previous evening;
  //    Hour 18 = noon of the civil day.)
  // Civil date of that Hebrew day = Monday September 22, 2025.

  const EPOCH_YEAR = 5786;
  const EPOCH_WEEKDAY = 1;                       // Monday  (JS: 0=Sun..6=Sat)
  const EPOCH_TIME_CHALAKIM = 18 * HOUR_CHALAKIM + 187;  // 19627
  const EPOCH_DAY_MS = Date.UTC(2025, 8, 22);   // midnight UTC, Mon Sep 22 2025

  // Postponement thresholds (in chalakim from start of the Hebrew day)
  const MOLAD_ZAKEN    = 18 * HOUR_CHALAKIM;              // 19440  (noon)
  const BETUTEKPAT     = 15 * HOUR_CHALAKIM + 589;        // 16789
  const GATRAD         =  9 * HOUR_CHALAKIM + 204;        //  9924

  function monthsBetweenYears(fromYear, toYear) {
    if (fromYear === toYear) return 0;
    var months = 0;
    if (toYear > fromYear) {
      for (var y = fromYear; y < toYear; y++) {
        months += isLeapYearHebrew(y) ? 13 : 12;
      }
    } else {
      for (var y = toYear; y < fromYear; y++) {
        months -= isLeapYearHebrew(y) ? 13 : 12;
      }
    }
    return months;
  }

  /** Return the molad of Tishrei as ms-since-Unix-epoch (kept for compat). */
  function moladTishreyMs(year) {
    var months = monthsBetweenYears(EPOCH_YEAR, year);
    var total  = EPOCH_TIME_CHALAKIM + months * LUNATION_CHALAKIM;
    var dayOff = Math.floor(total / DAY_CHALAKIM);
    var timeCh = total - dayOff * DAY_CHALAKIM;        // 0..DAY_CHALAKIM-1
    var hebrewHour = timeCh / HOUR_CHALAKIM;           // fractional hour
    // Convert Hebrew hour to civil UTC offset from epoch day midnight.
    // Hebrew Hour 0 = 6 PM previous evening = civil hour -6 of the labeled day.
    // Hebrew Hour 6 = midnight = civil hour 0.
    // Hebrew Hour 18 = noon = civil hour 12.
    var civilHourOffset = hebrewHour - 6;              // can be negative
    return EPOCH_DAY_MS + dayOff * DAY_MS + civilHourOffset * 60 * 60 * 1000;
  }

  /**
   * Return molad of Tishrei for the given Hebrew year: civil date, weekday, hour, chalakim.
   * Used to show molad time on the calendar (day of molad and on Tishrei 1 when different).
   * @param {number} year - Hebrew year
   * @returns {{ date: Date, weekday: number, hour: number, chalakim: number }}
   */
  function getMoladTishrei(year) {
    var months = monthsBetweenYears(EPOCH_YEAR, year);
    var total  = EPOCH_TIME_CHALAKIM + months * LUNATION_CHALAKIM;
    var dayOff = Math.floor(total / DAY_CHALAKIM);
    var timeCh = total - dayOff * DAY_CHALAKIM;       // 0..DAY_CHALAKIM-1
    var weekday = ((EPOCH_WEEKDAY + dayOff) % 7 + 7) % 7;
    var hour = Math.floor(timeCh / HOUR_CHALAKIM);     // 0..23 Hebrew hour
    var chalakim = timeCh % HOUR_CHALAKIM;             // 0..1079
    var date = new Date(moladTishreyMs(year));
    return { date, weekday, hour, chalakim };
  }

  function tishrei1Date(year) {
    var months = monthsBetweenYears(EPOCH_YEAR, year);

    // Total chalakim from start of epoch's Hebrew day to the target molad
    var total  = EPOCH_TIME_CHALAKIM + months * LUNATION_CHALAKIM;
    var dayOff = Math.floor(total / DAY_CHALAKIM);
    var timeCh = total - dayOff * DAY_CHALAKIM;        // 0 .. DAY_CHALAKIM-1

    // Hebrew weekday (0=Sun..6=Sat, same as JS getUTCDay)
    var moladWeekday = ((EPOCH_WEEKDAY + dayOff) % 7 + 7) % 7;

    var postpone = 0;

    // Rules B, C, D are MUTUALLY EXCLUSIVE — at most one fires.
    // Rule B  – Molad Zaken: molad at or after noon (Hebrew hour 18)
    if (timeCh >= MOLAD_ZAKEN) {
      postpone = 1;
    }
    // Rule C  – BeTU'TeKPaT: Monday >= 15 h 589 p  AND  previous year was leap
    //   (only if Molad Zaken did NOT already fire)
    else if (moladWeekday === 1 &&
             isLeapYearHebrew(year - 1) &&
             timeCh >= BETUTEKPAT) {
      postpone = 1;
    }
    // Rule D  – GaTRaD: Tuesday >= 9 h 204 p  AND  current year is NOT leap
    //   (only if Molad Zaken did NOT already fire)
    else if (moladWeekday === 2 &&
             !isLeapYearHebrew(year) &&
             timeCh >= GATRAD) {
      postpone = 1;
    }

    // Weekday after numeric postponements so far
    var wd = ((moladWeekday + postpone) % 7 + 7) % 7;

    // Rule A  – lo ADU: Tishrei 1 ≠ Sunday(0), Wednesday(3), Friday(5)
    while (wd === 0 || wd === 3 || wd === 5) {
      postpone += 1;
      wd = ((moladWeekday + postpone) % 7 + 7) % 7;
    }

    // Convert to a Gregorian Date.
    // EPOCH_DAY_MS = midnight UTC of the epoch's civil day (Mon Sep 22 2025).
    // Each Hebrew-day offset = one civil-day offset (both are 24 h).
    var tishreiMs = EPOCH_DAY_MS + (dayOff + postpone) * DAY_MS;
    return new Date(tishreiMs);
  }

  /**
   * Return Tishrei 1 date and which postponement rules (dehiyyot) were applied.
   * @param {number} year - Hebrew year
   * @returns {{ date: Date, weekday: number, rules: { A: boolean, B: boolean, C: boolean, D: boolean } }}
   */
  function tishrei1Dehiyyot(year) {
    var months = monthsBetweenYears(EPOCH_YEAR, year);
    var total  = EPOCH_TIME_CHALAKIM + months * LUNATION_CHALAKIM;
    var dayOff = Math.floor(total / DAY_CHALAKIM);
    var timeCh = total - dayOff * DAY_CHALAKIM;

    var moladWeekday = ((EPOCH_WEEKDAY + dayOff) % 7 + 7) % 7;
    var postpone = 0;
    var ruleB = false, ruleC = false, ruleD = false;

    if (timeCh >= MOLAD_ZAKEN) {
      postpone = 1;
      ruleB = true;
    } else if (moladWeekday === 1 &&
               isLeapYearHebrew(year - 1) &&
               timeCh >= BETUTEKPAT) {
      postpone = 1;
      ruleC = true;
    } else if (moladWeekday === 2 &&
               !isLeapYearHebrew(year) &&
               timeCh >= GATRAD) {
      postpone = 1;
      ruleD = true;
    }

    var wd = ((moladWeekday + postpone) % 7 + 7) % 7;
    var ruleADays = 0;
    while (wd === 0 || wd === 3 || wd === 5) {
      postpone += 1;
      ruleADays += 1;
      wd = ((moladWeekday + postpone) % 7 + 7) % 7;
    }

    var tishreiMs = EPOCH_DAY_MS + (dayOff + postpone) * DAY_MS;
    var date = new Date(tishreiMs);
    return {
      date,
      weekday: date.getUTCDay(),
      rules: {
        A: ruleADays > 0,
        B: ruleB,
        C: ruleC,
        D: ruleD,
      },
    };
  }

  function absoluteFromDate(date) {
    return Math.floor(date.getTime() / DAY_MS);
  }

  function absoluteFromGregorian(year, monthIndex, day) {
    return Math.floor(Date.UTC(year, monthIndex, day) / DAY_MS);
  }

  function tishrei1Absolute(year) {
    return absoluteFromDate(tishrei1Date(year));
  }

  function hebrewYearLength(year) {
    return tishrei1Absolute(year + 1) - tishrei1Absolute(year);
  }

  function yearMonths(year) {
    const leap = isLeapYearHebrew(year);
    const length = hebrewYearLength(year);

    let heshvan = 29;
    let kislev = 30;

    if (length === (leap ? 383 : 353)) {
      heshvan = 29;
      kislev = 29;
    } else if (length === (leap ? 384 : 354)) {
      heshvan = 29;
      kislev = 30;
    } else if (length === (leap ? 385 : 355)) {
      heshvan = 30;
      kislev = 30;
    }

    const months = [
      { name: "Tishrey", length: 30 },
      { name: "Heshvan", length: heshvan },
      { name: "Kislev", length: kislev },
      { name: "Tevet", length: 29 },
      { name: "Shevat", length: 30 },
      { name: "Adar", length: leap ? 30 : 29 }, // Adar I (30) in leap, Adar (29) in non-leap
      { name: "Nisan", length: 30 },
      { name: "Iyar", length: 29 },
      { name: "Sivan", length: 30 },
      { name: "Tammuz", length: 29 },
      { name: "Av", length: 30 },
      { name: "Elul", length: 29 },
    ];

    if (leap) {
      // Insert Adar II (29 days) after Adar I. Purim is 14 Adar II, 30 days before 15 Nisan.
      months.splice(6, 0, { name: "Adar2", length: 29 });
    }

    return months;
  }

  function absoluteFromHebrew(year, monthName, day) {
    const months = yearMonths(year);
    const tishreiAbs = tishrei1Absolute(year);

    let offset = 0;
    for (let i = 0; i < months.length; i++) {
      const m = months[i];
      if (m.name === monthName) {
        return tishreiAbs + offset + (day - 1);
      }
      offset += m.length;
    }
    throw new Error("Invalid Hebrew month name: " + monthName);
  }

  function guessHebrewYearForGregorian(gYear) {
    return gYear + 3760;
  }

  function gregorianToHebrew(year, monthIndex, day) {
    const abs = absoluteFromGregorian(year, monthIndex, day);
    let hYear = guessHebrewYearForGregorian(year);

    while (abs >= tishrei1Absolute(hYear + 1)) {
      hYear += 1;
    }
    while (abs < tishrei1Absolute(hYear)) {
      hYear -= 1;
    }

    const tishreiAbs = tishrei1Absolute(hYear);
    let dayOfYear = abs - tishreiAbs;

    const months = yearMonths(hYear);
    for (let i = 0; i < months.length; i++) {
      const m = months[i];
      if (dayOfYear < m.length) {
        return {
          hebrewYear: hYear,
          hebrewMonthIndex: i,
          hebrewMonthName: m.name,
          hebrewDay: dayOfYear + 1,
        };
      }
      dayOfYear -= m.length;
    }

    throw new Error("Gregorian date out of Hebrew year range.");
  }

  function gregorianFromHebrew(year, monthName, day) {
    const abs = absoluteFromHebrew(year, monthName, day);
    const date = new Date(abs * DAY_MS);
    return {
      year: date.getUTCFullYear(),
      monthIndex: date.getUTCMonth(),
      day: date.getUTCDate(),
      weekday: date.getUTCDay(),
      date,
    };
  }

  const HebrewCore = {
    HEBREW_MONTHS,
    HEBREW_HOLIDAYS,
    isLeapYearHebrew,
    getHolidayMonthForYear,
    getHolidayDaysInYear,
    isDayInHoliday,
    moladTishreyMs,
    getMoladTishrei,
    tishrei1Date,
    tishrei1Dehiyyot,
    hebrewYearLength,
    yearMonths,
    absoluteFromGregorian,
    absoluteFromHebrew,
    gregorianToHebrew,
    gregorianFromHebrew,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = HebrewCore;
  }

  global.HebrewCore = HebrewCore;
})(typeof window !== "undefined" ? window : globalThis);


