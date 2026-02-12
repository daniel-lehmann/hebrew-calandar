// rambam-moon-mean-path.js
// Rambam Hilchot Kiddush HaChodesh 14:3–14:4: mean motion of the orbit (אמצעי המסלול) — second of the two mean movements of the moon.

(function (global) {
  const RambamHelpers = () => global.RambamHelpers;

  /**
   * Mean path (middle of orbit) motion per day from Rambam 14:3: 13° 3′ 54″ (י"ג גנ"ד).
   */
  const PATH_DAILY_DEG = 13 + 3 / 60 + 54 / 3600;

  /**
   * More exact daily motion implied by the Rambam's numbers: 13° 3′ 53.93″.
   * Used for the calculation (dynamic) row at the bottom of the table.
   */
  const PATH_DAILY_DEG_EXACT = 13 + 3 / 60 + 53.93 / 3600;

  /** Days for one full cycle (360°) at this daily rate. */
  const CYCLE_DAYS = 360 / PATH_DAILY_DEG;

  /** Standard month lengths (days) for comparison. */
  const SYNODIC_MONTH_DAYS = 29.530588853;
  const SIDEREAL_MONTH_DAYS = 27.321661;
  const ANOMALISTIC_MONTH_DAYS = 27.55455;

  /**
   * Table rows for 14:3–14:4: days, Rambam's stated remainder (mod 360°), revolutions, implied daily.
   */
  const TABLE_ROWS_14_3_14_4 = [
    { days: 1, remainderDeg: PATH_DAILY_DEG, revolutions: 0, impliedDailyDeg: PATH_DAILY_DEG },
    { days: 10, remainderDeg: 130 + 39 / 60, revolutions: 0, impliedDailyDeg: (130 + 39 / 60) / 10 },
    { days: 100, remainderDeg: 226 + 29 / 60 + 53 / 3600, revolutions: 3, impliedDailyDeg: ((226 + 29 / 60 + 53 / 3600) + 3 * 360) / 100 },
    { days: 1000, remainderDeg: 104 + 58 / 60 + 50 / 3600, revolutions: 36, impliedDailyDeg: ((104 + 58 / 60 + 50 / 3600) + 36 * 360) / 1000 },
    { days: 10000, remainderDeg: 329 + 48 / 60 + 20 / 3600, revolutions: 362, impliedDailyDeg: ((329 + 48 / 60 + 20 / 3600) + 362 * 360) / 10000 },
    { days: 29, remainderDeg: 18 + 53 / 60 + 4 / 3600, revolutions: 1, impliedDailyDeg: ((18 + 53 / 60 + 4 / 3600) + 1 * 360) / 29 },
    { days: 354, remainderDeg: 305 + 0 / 60 + 13 / 3600, revolutions: 12, impliedDailyDeg: ((305 + 0 / 60 + 13 / 3600) + 12 * 360) / 354 },
  ];

  const RambamMoonMeanPath = (function () {
    function formatDms(deg, omitSeconds) {
      const helpers = RambamHelpers();
      return helpers ? helpers.formatDms(deg, omitSeconds) : String(deg) + "°";
    }

    function mod360(deg) {
      const helpers = RambamHelpers();
      return helpers ? helpers.mod360(deg) : ((deg % 360) + 360) % 360;
    }

    const VERSE_14_3 =
      "ומהלך אמצע המסלול ביום אחד י\"ג מעלות ושלשה חלקים ונ\"ד שניות. סימנם י\"ג גנ\"ד. " +
      "נמצא מהלכו בעשרה ימים ק\"ל מעלות ל\"ט חלקים בלא שניות. סימנם ק\"ל ל\"ט. " +
      "ונמצא שארית מהלכו במאה יום רכ\"ו מעלות וכ\"ט חלקים ונ\"ג שניות. סימנם רכ\"ו כ\"ט נ\"ג. " +
      "ונמצא שארית מהלכו באלף יום ק\"ד מעלות ונ\"ח חלקים וחמשים שניות. סימנם ק\"ד נח\"ן. " +
      "ונמצא שארית מהלכו בעשרת אלפים יום שכ\"ט מעלות ומ\"ח חלקים ועשרים שניות. סימנם שכ\"ט מח\"כ. " +
      "ונמצא שארית מהלכו בכ\"ט יום י\"ח מעלות ונ\"ג חלקים וד' שניות. סימנם י\"ח נג\"ד.";
    const VERSE_14_4 =
      "ונמצא שארית מהלכו בשנה סדורה ש\"ה מעלות וי\"ג שניות בלא חלקים. סימנם ש\"ה י\"ג. " +
      "מקום אמצע הירח היה בתחלת ליל חמישי שהוא העיקר לחשבונות אלו במזל שור מעלה אחת וי\"ד חלקים ומ\"ג שניות. סימנם א' י\"ד מ\"ג. " +
      "ואמצע המסלול היה בעיקר זה פ\"ד מעלות וכ\"ח חלקים ומ\"ב שניות. סימנם פ\"ד כ\"ח מ\"ב. " +
      "מאחר שתדע מהלך אמצע הירח והאמצע שהוא העיקר שעליו תוסיף. תדע מקום אמצע הירח בכל יום שתרצה על דרך שעשית באמצע השמש. " +
      "ואחר שתוציא אמצע הירח לתחלת הלילה שתרצה התבונן בשמש ודע באי זה מזל הוא.";

    /**
     * Fill the cycle + comparison section (time for one cycle, comparison with synodic/sidereal/anomalistic).
     */
    function renderCycleAndComparison(containerId) {
      const el = document.getElementById(containerId);
      if (!el) return;
      el.innerHTML =
        "<h3>Time for one full cycle (360°)</h3>" +
        "<p>360° ÷ (" + formatDms(PATH_DAILY_DEG, false) + " per day) ≈ <strong>" + CYCLE_DAYS.toFixed(5) + " days</strong>.</p>" +
        "<h3>Comparison with modern month lengths</h3>" +
        "<ul>" +
        "<li><strong>Synodic month</strong> (new moon to new moon): ~" + SYNODIC_MONTH_DAYS.toFixed(5) + " days. The lunar phase cycle used for Hebrew months; longer than the sidereal month because the Earth is also moving around the sun.</li>" +
        "<li><strong>Sidereal month</strong> (moon relative to fixed stars): ~" + SIDEREAL_MONTH_DAYS.toFixed(5) + " days. Time for the moon to return to the same position against the stars; close to the first mean motion (14:1–14:2), not this one.</li>" +
        "<li><strong>Anomalistic month</strong> (perigee to perigee): ~" + ANOMALISTIC_MONTH_DAYS.toFixed(5) + " days. Time between successive closest approaches of the moon to the Earth; the orbit’s orientation shifts slowly. This is very close to the Rambam’s 360° cycle for the mean path (14:3).</li>" +
        "</ul>";
    }

    /**
     * Render the table and optional dynamic row into the given table element id.
     */
    function renderTable(tableId) {
      const tableEl = document.getElementById(tableId);
      if (!tableEl) return;

      tableEl.innerHTML = "";
      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");
      [
        "Number of days",
        "Moon mean path movement (d° m′ s″) — daily × days (full motion)",
        "Motion mod 360° (Rambam’s stated remainder)",
        "Implied daily motion (d° m′ s″)",
      ].forEach(function (label) {
        const th = document.createElement("th");
        th.textContent = label;
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      tableEl.appendChild(thead);

      const tbody = document.createElement("tbody");
      TABLE_ROWS_14_3_14_4.forEach(function (row) {
        const tr = document.createElement("tr");
        const fullDeg = row.remainderDeg + row.revolutions * 360;

        const tdDays = document.createElement("td");
        tdDays.textContent = String(row.days);
        tr.appendChild(tdDays);

        const tdFull = document.createElement("td");
        tdFull.textContent = formatDms(fullDeg);
        tr.appendChild(tdFull);

        const tdMod = document.createElement("td");
        tdMod.textContent = formatDms(row.remainderDeg);
        tr.appendChild(tdMod);

        const tdDaily = document.createElement("td");
        tdDaily.textContent = formatDms(row.impliedDailyDeg);
        tr.appendChild(tdDaily);

        tbody.appendChild(tr);
      });

      // Dynamic row: user enters days; columns 2–3 computed from daily × days
      const dynTr = document.createElement("tr");
      dynTr.className = "rambam-moon-mean-dynamic-row";

      const tdDaysInput = document.createElement("td");
      const daysInput = document.createElement("input");
      daysInput.type = "number";
      daysInput.min = "1";
      daysInput.placeholder = "days";
      daysInput.value = "30";
      daysInput.className = "rambam-moon-days-input";
      tdDaysInput.appendChild(daysInput);
      dynTr.appendChild(tdDaysInput);

      const tdDynFull = document.createElement("td");
      dynTr.appendChild(tdDynFull);

      const tdDynMod = document.createElement("td");
      dynTr.appendChild(tdDynMod);

      const tdDynDaily = document.createElement("td");
      tdDynDaily.textContent = formatDms(PATH_DAILY_DEG_EXACT);
      dynTr.appendChild(tdDynDaily);

      function updateDynamicRow() {
        const n = Number(daysInput.value);
        if (!Number.isFinite(n) || n <= 0) {
          tdDynFull.textContent = "—";
          tdDynMod.textContent = "—";
          return;
        }
        const fullDeg = PATH_DAILY_DEG_EXACT * n;
        tdDynFull.textContent = formatDms(fullDeg);
        tdDynMod.textContent = formatDms(mod360(fullDeg));
      }

      daysInput.addEventListener("input", updateDynamicRow);
      daysInput.addEventListener("change", updateDynamicRow);
      updateDynamicRow();

      tbody.appendChild(dynTr);
      tableEl.appendChild(tbody);
    }

    /** Verse data for 14:3–14:4 for use in the Rambam Kiddush HaChodesh dropdown. */
    function getVerseData() {
      const englishSummary =
        "The Rambam describes the second mean motion (14:3): the motion of the “mean of the orbit” (אמצעי המסלול) — " +
        "the centre of the moon’s small cycle on the great cycle. In one day it moves 13° 3′ 54″ (י\"ג גנ\"ד). " +
        "He gives the total (or remainder) for 10, 100, 1000, 10000, 29, and a regular year (354 days). " +
        "In 14:4 he gives the remainder for a “sedura” year and the epoch positions of the mean moon and mean path.";
      return {
        hebrewText: VERSE_14_3 + " " + VERSE_14_4,
        englishSummary: englishSummary,
      };
    }

    /**
     * Fill the moon-path block (cycle + table) in the shared Rambam panel. Call when verse 14:3 is selected.
     */
    function renderMoonPathContent() {
      renderCycleAndComparison("rambam-moon-mean-path-cycle");
      renderTable("rambam-moon-mean-path-table");
    }

    return {
      PATH_DAILY_DEG,
      CYCLE_DAYS,
      getTableRows: function () {
        return TABLE_ROWS_14_3_14_4;
      },
      getVerseData: getVerseData,
      renderMoonPathContent: renderMoonPathContent,
    };
  })();

  global.RambamMoonMeanPath = RambamMoonMeanPath;
})(typeof window !== "undefined" ? window : globalThis);
