// stats.js
// Statistical queries on the Hebrew calendar.

(function (global) {
  const HebrewCore = () => global.HebrewCore;

  function summarizeEarliestPesach() {
    const core = HebrewCore();
    if (!core) return "HebrewCore not loaded.";

    const endYear = 5786;
    const startYear = endYear - 1999;
    const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const holidays = core.HEBREW_HOLIDAYS || [];
    if (!holidays.length) return "No holidays defined.";

    const earliestByHoliday = new Map();

    for (let hy = startYear; hy <= endYear; hy++) {
      for (const h of holidays) {
        const g = core.gregorianFromHebrew(hy, h.month, h.startDay);
        const key = h.name;

        const current = earliestByHoliday.get(key);
        const m = g.monthIndex;
        const d = g.day;

        if (
          !current ||
          m < current.g.monthIndex ||
          (m === current.g.monthIndex && d < current.g.day)
        ) {
          earliestByHoliday.set(key, {
            hebrewYear: hy,
            hebrewMonthName: h.month,
            hebrewDay: h.startDay,
            g,
          });
        }
      }
    }

    // Prepare a nicely aligned text table (shown inside a <pre>).
    const rows = [];
    for (const h of holidays) {
      const rec = earliestByHoliday.get(h.name);
      if (!rec) continue;
      const d = rec.g.date;
      const iso = d.toISOString().slice(0, 10);
      const md = `${String(rec.g.monthIndex + 1).padStart(2, "0")}-${String(
        rec.g.day
      ).padStart(2, "0")}`;
      const weekday = weekdayNames[rec.g.weekday];
      const hebrewStr = `${rec.hebrewDay} ${rec.hebrewMonthName} ${rec.hebrewYear}`;
      rows.push({
        name: h.name,
        md,
        weekday,
        iso,
        hebrewStr,
      });
    }

    if (!rows.length) return "No data.";

    const nameWidth = Math.max(
      "Holiday".length,
      ...rows.map((r) => r.name.length)
    );
    const mdWidth = "MM-DD".length;
    const weekdayWidth = Math.max(
      "Weekday".length,
      ...rows.map((r) => r.weekday.length)
    );
    const isoWidth = "First occurrence".length; // all ISO strings are same length

    const pad = (str, len) => str.padEnd(len, " ");

    const lines = [];
    lines.push(
      "Earliest Gregorian calendar dates for holidays (by day & month, last 2000 Hebrew years):"
    );
    lines.push("");

    const header =
      pad("Holiday", nameWidth) +
      " | " +
      pad("MM-DD", mdWidth) +
      " | " +
      pad("Weekday", weekdayWidth) +
      " | " +
      pad("First occurrence", isoWidth) +
      " | Hebrew date";
    lines.push(header);
    lines.push("-".repeat(header.length));

    rows.forEach((r) => {
      lines.push(
        pad(r.name, nameWidth) +
          " | " +
          pad(r.md, mdWidth) +
          " | " +
          pad(r.weekday, weekdayWidth) +
          " | " +
          pad(r.iso, isoWidth) +
          " | " +
          r.hebrewStr
      );
    });

    return lines.join("\n");
  }

  function listTishrei1Years() {
    // Kept for backwards compatibility; default to 2000 years of Tishrei 1.
    return listHebrewDateYears("Tishrey", 1, 2000, "1 Tishrey");
  }

  function tishrei1WeekdayHistogram() {
    const core = HebrewCore();
    if (!core) return "HebrewCore not loaded.";

    const endYear = 5786;
    const startYear = endYear - 1999;
    const counts = [0, 0, 0, 0, 0, 0, 0];

    for (let hy = startYear; hy <= endYear; hy++) {
      const d = core.tishrei1Date(hy);
      counts[d.getUTCDay()] += 1;
    }

    const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const lines = ["Tishrei 1 weekday histogram (last 2000 Hebrew years):"];
    for (let i = 0; i < 7; i++) {
      lines.push(`${weekdayNames[i]}: ${counts[i]}`);
    }
    return lines.join("\n");
  }

  /**
   * Day-of-week histogram for any Hebrew date over the last 2000 years.
   * @param {string} [monthName] - Hebrew month name (default "Tishrey")
   * @param {number} [day]       - Day of month (default 1)
   * @param {string} [label]     - Display label for the chart
   */
  function weekdayHistogramData(monthName, day, label) {
    const core = HebrewCore();
    if (!core) return null;

    monthName = monthName || "Tishrey";
    day = Number(day) || 1;

    const endYear = 5786;
    const startYear = endYear - 1999;
    const counts = [0, 0, 0, 0, 0, 0, 0];

    for (let hy = startYear; hy <= endYear; hy++) {
      try {
        const g = core.gregorianFromHebrew(hy, monthName, day);
        counts[g.weekday] += 1;
      } catch (e) {
        // Date may not exist in this year (e.g. Adar2 in non-leap years)
      }
    }

    const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return {
      label: label || (day + " " + monthName),
      labels: weekdayNames,
      data: counts,
    };
  }

  // Keep old name as alias for backward compat
  function tishrei1HistogramData() {
    return weekdayHistogramData("Tishrey", 1, "1 Tishrey");
  }

  function listHebrewDateYears(monthName, day, countYears, label) {
    const core = HebrewCore();
    if (!core) return "HebrewCore not loaded.";

    const endYear = 5786;
    let years = Number(countYears) || 1;
    years = Math.max(1, Math.min(2000, years));
    const startYear = Math.max(1, endYear - (years - 1));
    const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const effectiveLabel = label || `${day} ${monthName}`;
    const lines = [];
    lines.push(
      `Years for ${effectiveLabel} over last ${years} Hebrew years (ending at ${endYear}):`
    );

    for (let hy = startYear; hy <= endYear; hy++) {
      let g;
      try {
        g = core.gregorianFromHebrew(hy, monthName, day);
      } catch (e) {
        // This Hebrew date may not exist in this year (e.g. Adar2 in non-leap years).
        continue;
      }
      const iso = g.date.toISOString().slice(0, 10);
      const weekday = weekdayNames[g.weekday];
      lines.push(`Year ${hy}: ${iso} (${weekday})`);
    }

    if (lines.length === 1) {
      return `No valid dates for ${effectiveLabel} in that range.`;
    }

    return lines.join("\n");
  }

  function summarizeLatestHolidays() {
    const core = HebrewCore();
    if (!core) return "HebrewCore not loaded.";

    const endYear = 5786;
    const startYear = endYear - 1999;
    const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const holidays = core.HEBREW_HOLIDAYS || [];
    if (!holidays.length) return "No holidays defined.";

    const latestByHoliday = new Map();

    for (let hy = startYear; hy <= endYear; hy++) {
      for (const h of holidays) {
        const g = core.gregorianFromHebrew(hy, h.month, h.endDay);
        const key = h.name;

        const current = latestByHoliday.get(key);
        const m = g.monthIndex;
        const d = g.day;

        if (
          !current ||
          m > current.g.monthIndex ||
          (m === current.g.monthIndex && d > current.g.day)
        ) {
          latestByHoliday.set(key, {
            hebrewYear: hy,
            hebrewMonthName: h.month,
            hebrewDay: h.endDay,
            g,
          });
        }
      }
    }

    const rows = [];
    for (const h of holidays) {
      const rec = latestByHoliday.get(h.name);
      if (!rec) continue;
      const d = rec.g.date;
      const iso = d.toISOString().slice(0, 10);
      const md = `${String(rec.g.monthIndex + 1).padStart(2, "0")}-${String(
        rec.g.day
      ).padStart(2, "0")}`;
      const weekday = weekdayNames[rec.g.weekday];
      const hebrewStr = `${rec.hebrewDay} ${rec.hebrewMonthName} ${rec.hebrewYear}`;
      rows.push({
        name: h.name,
        md,
        weekday,
        iso,
        hebrewStr,
      });
    }

    if (!rows.length) return "No data.";

    const nameWidth = Math.max(
      "Holiday".length,
      ...rows.map((r) => r.name.length)
    );
    const mdWidth = "MM-DD".length;
    const weekdayWidth = Math.max(
      "Weekday".length,
      ...rows.map((r) => r.weekday.length)
    );
    const isoWidth = "First occurrence".length;

    const pad = (str, len) => str.padEnd(len, " ");

    const lines = [];
    lines.push(
      "Latest Gregorian calendar dates for holidays (by day & month, last 2000 Hebrew years):"
    );
    lines.push("");

    const header =
      pad("Holiday", nameWidth) +
      " | " +
      pad("MM-DD", mdWidth) +
      " | " +
      pad("Weekday", weekdayWidth) +
      " | " +
      pad("Last occurrence", isoWidth) +
      " | Hebrew date";
    lines.push(header);
    lines.push("-".repeat(header.length));

    rows.forEach((r) => {
      lines.push(
        pad(r.name, nameWidth) +
          " | " +
          pad(r.md, mdWidth) +
          " | " +
          pad(r.weekday, weekdayWidth) +
          " | " +
          pad(r.iso, isoWidth) +
          " | " +
          r.hebrewStr
      );
    });

    return lines.join("\n");
  }

  function holidayDateGraph(holidayName) {
    const core = HebrewCore();
    if (!core) return "HebrewCore not loaded.";

    const endYear = 5786;
    const startYear = endYear - 1999;

    const holidays = core.HEBREW_HOLIDAYS || [];
    const holiday = holidays.find((h) => h.name === holidayName);
    if (!holiday) return `Unknown holiday: ${holidayName}`;

    const totalYears = endYear - startYear + 1;
    const width = Math.min(80, totalYears);
    const height = 20;

    const yearsPerCol = totalYears / width;

    const points = [];
    let minDoy = Infinity;
    let maxDoy = -Infinity;

    for (let col = 0; col < width; col++) {
      const hy = Math.round(startYear + (col + 0.5) * yearsPerCol);
      const g = core.gregorianFromHebrew(hy, holiday.month, holiday.startDay);
      const doy =
        core.absoluteFromGregorian(g.year, g.monthIndex, g.day) -
        core.absoluteFromGregorian(g.year, 0, 1);

      points.push({ col, hy, doy });
      if (doy < minDoy) minDoy = doy;
      if (doy > maxDoy) maxDoy = doy;
    }

    if (!isFinite(minDoy) || !isFinite(maxDoy)) return "No data.";

    const grid = [];
    for (let r = 0; r < height; r++) {
      grid[r] = new Array(width).fill(" ");
    }

    const span = Math.max(1, maxDoy - minDoy);

    points.forEach((p) => {
      const norm = (p.doy - minDoy) / span;
      const row = height - 1 - Math.round(norm * (height - 1));
      grid[row][p.col] = "*";
    });

    const lines = [];
    lines.push(
      `Holiday date graph for ${holiday.name} (years on X, Gregorian day-of-year on Y)`
    );
    lines.push(
      `Range: Hebrew years ${startYear}–${endYear} (compressed to ${width} columns)`
    );
    lines.push("");

    for (let r = 0; r < height; r++) {
      lines.push(grid[r].join(""));
    }

    const startLabel = `${startYear}`;
    const endLabel = `${endYear}`;
    const labelLine =
      startLabel +
      " ".repeat(Math.max(0, width - startLabel.length - endLabel.length)) +
      endLabel;

    lines.push(labelLine);

    return lines.join("\n");
  }

  function holidayDateSeries(holidayName, countYears) {
    const core = HebrewCore();
    if (!core) return null;

    const endYear = 5786;
    let numYears = Number(countYears) || 2000;
    if (numYears < 1) numYears = 30;
    if (numYears > 2000) numYears = 2000;
    const startYear = Math.max(1, endYear - (numYears - 1));

    const holidays = core.HEBREW_HOLIDAYS || [];
    const holiday = holidays.find((h) => h.name === holidayName);
    if (!holiday) return null;

    const years = [];
    const dayOfYear = [];
    const gregDates = [];   // "YYYY-MM-DD"
    const weekdays = [];    // "Mon", "Tue", …
    const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let hy = startYear; hy <= endYear; hy++) {
      const g = core.gregorianFromHebrew(hy, holiday.month, holiday.startDay);
      const doy =
        core.absoluteFromGregorian(g.year, g.monthIndex, g.day) -
        core.absoluteFromGregorian(g.year, 0, 1);
      years.push(hy);
      dayOfYear.push(doy + 1); // 1-based day-of-year
      gregDates.push(g.date.toISOString().slice(0, 10));
      weekdays.push(weekdayNames[g.weekday]);
    }

    return {
      holidayName: holiday.name,
      years,
      dayOfYear,
      gregDates,
      weekdays,
    };
  }

  /**
   * Dehiyyot (postponement rules) stats for the Stats tab.
   * @param {number} [numYears=1000] - How many years ago to analyze (ending at endYear).
   * @returns {{ rules: Object, timeline: Array, endYear: number }|null}
   */
  function dehiyyotStatsData(numYears) {
    const core = HebrewCore();
    if (!core || !core.tishrei1Dehiyyot) return null;

    const endYear = 5786;
    const n = Math.max(1, Math.min(4000, Number(numYears) || 1000));
    const startYear = Math.max(1, endYear - n + 1);
    const totalYears = endYear - startYear + 1;

    const ruleKeys = ["A", "B", "C", "D"];
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    const lastUsed = { A: null, B: null, C: null, D: null };
    const timeline = [];

    for (let hy = startYear; hy <= endYear; hy++) {
      const info = core.tishrei1Dehiyyot(hy);
      timeline.push({
        year: hy,
        weekday: info.weekday,
        rules: info.rules,
        dateStr: info.date.toISOString().slice(0, 10),
      });
      ruleKeys.forEach((k) => {
        if (info.rules[k]) {
          counts[k]++;
          lastUsed[k] = hy;
        }
      });
    }

    // Next time each rule will be used (first year after endYear)
    const nextUsed = { A: null, B: null, C: null, D: null };
    const lookAhead = 500;
    for (let hy = endYear + 1; hy <= endYear + lookAhead; hy++) {
      const info = core.tishrei1Dehiyyot(hy);
      ruleKeys.forEach((k) => {
        if (nextUsed[k] == null && info.rules[k]) nextUsed[k] = hy;
      });
      if (ruleKeys.every((k) => nextUsed[k] != null)) break;
    }

    const rules = {};
    ruleKeys.forEach((k) => {
      const count = counts[k];
      rules[k] = {
        count,
        percent: totalYears ? ((100 * count) / totalYears).toFixed(1) : "0",
        lastUsed: lastUsed[k],
        nextUsed: nextUsed[k],
      };
    });

    return {
      rules,
      timeline,
      startYear,
      endYear,
      totalYears,
    };
  }

  const Stats = {
    summarizeEarliestPesach,
    listTishrei1Years,
    tishrei1WeekdayHistogram,
    summarizeLatestHolidays,
    tishrei1HistogramData,
    weekdayHistogramData,
    holidayDateGraph,
    holidayDateSeries,
    listHebrewDateYears,
    dehiyyotStatsData,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Stats;
  }

  global.Stats = Stats;
})(typeof window !== "undefined" ? window : globalThis);

