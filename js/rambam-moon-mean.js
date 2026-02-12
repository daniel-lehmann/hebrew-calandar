// rambam-moon-mean.js
// Rambam Hilchot Kiddush HaChodesh 14:1–14:2: mean motion of the moon (two mean movements, daily 13° 10′ 35″).

(function (global) {
  const RambamHelpers = () => global.RambamHelpers;

  /**
   * Moon mean motion per day from Rambam 14:1: 13° 10′ 35″ (י"ג יל"ה).
   */
  const MOON_DAILY_DEG = 13 + 10 / 60 + 35 / 3600;

  /**
   * More exact daily motion implied by the Rambam’s numbers: 13° 10′ 35.03″.
   * Used for the calculation (dynamic) row at the bottom of the moon table.
   */
  const MOON_DAILY_DEG_EXACT = 13 + 10 / 60 + 35.03 / 3600;

  /** Days for one full cycle (360°) at Rambam's daily rate. */
  const CYCLE_DAYS = 360 / MOON_DAILY_DEG;

  /** Standard month lengths (days) for comparison. */
  const SYNODIC_MONTH_DAYS = 29.530588853;
  const SIDEREAL_MONTH_DAYS = 27.321661;
  const ANOMALISTIC_MONTH_DAYS = 27.55455;

  /**
   * Table rows for 14:2: days, Rambam's stated motion (remainder after full 360° turns), revolutions, implied daily.
   */
  const TABLE_ROWS_14_2 = [
    { days: 1, remainderDeg: MOON_DAILY_DEG, revolutions: 0, impliedDailyDeg: MOON_DAILY_DEG },
    { days: 10, remainderDeg: 131 + 45 / 60 + 50 / 3600, revolutions: 0, impliedDailyDeg: (131 + 45 / 60 + 50 / 3600) / 10 },
    { days: 100, remainderDeg: 237 + 38 / 60 + 23 / 3600, revolutions: 3, impliedDailyDeg: ((237 + 38 / 60 + 23 / 3600) + 3 * 360) / 100 },
    { days: 1000, remainderDeg: 216 + 23 / 60 + 50 / 3600, revolutions: 36, impliedDailyDeg: ((216 + 23 / 60 + 50 / 3600) + 36 * 360) / 1000 },
    { days: 10000, remainderDeg: 3 + 58 / 60 + 20 / 3600, revolutions: 366, impliedDailyDeg: ((3 + 58 / 60 + 20 / 3600) + 366 * 360) / 10000 },
    { days: 29, remainderDeg: 22 + 6 / 60 + 56 / 3600, revolutions: 1, impliedDailyDeg: ((22 + 6 / 60 + 56 / 3600) + 1 * 360) / 29 },
    { days: 354, remainderDeg: 344 + 26 / 60 + 43 / 3600, revolutions: 12, impliedDailyDeg: ((344 + 26 / 60 + 43 / 3600) + 12 * 360) / 354 },
  ];

  const RambamMoonMean = (function () {
    let initialized = false;

    function formatDms(deg, omitSeconds) {
      const helpers = RambamHelpers();
      return helpers ? helpers.formatDms(deg, omitSeconds) : String(deg) + "°";
    }

    function mod360(deg) {
      const helpers = RambamHelpers();
      return helpers ? helpers.mod360(deg) : ((deg % 360) + 360) % 360;
    }

    const VERSE_14_1 =
      "הירח שני מהלכים אמצעיים יש לו. הירח עצמו מסבב בגלגל קטן שאינו מקיף את העולם כולו. ומהלכו האמצעי באותו הגלגל הקטן נקרא אמצעי המסלול. והגלגל הקטן עצמו מסבב בגלגל גדול המקיף את העולם. ובמהלך אמצעי זה של גלגל הקטן באותו הגלגל הגדול המקיף את העולם הוא הנקרא אמצע הירח. מהלך אמצע הירח ביום אחד י\"ג מעלות וי' חלקים ול\"ה שניות. סימנם י\"ג יל\"ה.";
    const VERSE_14_2 =
      "נמצא מהלכו בעשרה ימים קל\"א מעלות ומ\"ה חלקים וחמשים שניות. סימנם קל\"א מה\"נ. ונמצא שארית מהלכו בק' יום רל\"ז מעלות ול\"ח חלקים וכ\"ג שניות. סימנם רל\"ז ל\"ח כ\"ג. ונמצאת שארית מהלכו באלף יום רי\"ו מעלות וכ\"ג חלקים ונ' שניות. סימנם רי\"ו כג\"ן. ונמצא שארית מהלכו בי' אלפים יום ג' מעלות ונ\"ח חלקים וכ' שניות. סימנם ג' נ\"ח כ'. ונמצא שארית מהלכו בכ\"ט יום כ\"ב מעלות וששה חלקים ונ\"ו שניות. סימנם כ\"ב ונ\"ו. ונמצא שארית מהלכו בשנה סדורה שמ\"ד מעלות וכ\"ו חלקים ומ\"ג שניות. סימן להם שד\"ם כ\"ו מ\"ג. ועל דרך זו תכפול לכל מנין ימים או שנים שתרצה.";

    function renderVerseAndExplanation() {
      const verseEl = document.getElementById("rambam-moon-verse-text");
      if (verseEl) {
        verseEl.innerHTML =
          "<p><strong>14:1</strong><br>" + VERSE_14_1 + "</p><p><strong>14:2</strong><br>" + VERSE_14_2 + "</p>";
      }
      const el = document.getElementById("rambam-moon-mean-explanation");
      if (!el) return;
      el.innerHTML =
        "<p><strong>14:1</strong> — The Rambam describes the moon as having two mean motions. The moon itself travels on a small cycle (epicycle) that does not encircle the whole world. Its mean motion on that small cycle is called “mean of the orbit” (אמצעי המסלול). That small cycle in turn travels on a great cycle that encircles the world; the mean motion of the small cycle on that great cycle is called “mean of the moon” (אמצע הירח). The mean motion of the moon in one day is 13° 10′ 35″ (symbol י\"ג יל\"ה).</p>" +
        "<p><strong>14:2</strong> — He then gives the total mean motion for 10 days, 100 days, 1000 days, 10,000 days, 29 days, and one “regular” lunar year (354 days), so we can verify the daily rate and compute how long one full 360° cycle takes.</p>";
    }

    function renderCycleAndComparison() {
      const el = document.getElementById("rambam-moon-mean-cycle");
      if (!el) return;
      const cycleDaysExact = 360 / MOON_DAILY_DEG_EXACT;
      el.innerHTML =
        "<h3>Time for one full cycle (360°)</h3>" +
        "<p>360° ÷ (13° 10′ 35.03″ per day) ≈ <strong>" + cycleDaysExact.toFixed(5) + " days</strong> (" + formatDms(MOON_DAILY_DEG_EXACT, false) + " per day).</p>" +
        "<h3>Comparison with modern month lengths</h3>" +
        "<ul>" +
        "<li><strong>Synodic month</strong> (new moon to new moon): ~" + SYNODIC_MONTH_DAYS.toFixed(5) + " days. This is the lunar phase cycle (e.g. for Hebrew months); it is longer than the sidereal month because the Earth is also moving around the sun.</li>" +
        "<li><strong>Sidereal month</strong> (moon relative to fixed stars): ~" + SIDEREAL_MONTH_DAYS.toFixed(5) + " days. The time for the moon to return to the same position against the stars — very close to the Rambam’s 360° cycle.</li>" +
        "<li><strong>Anomalistic month</strong> (perigee to perigee): ~" + ANOMALISTIC_MONTH_DAYS.toFixed(5) + " days. The time between successive closest approaches of the moon to the Earth; the orbit’s orientation shifts slowly.</li>" +
        "</ul>";
    }

    /**
     * @param {boolean} useExactDaily – if true, use 13° 10′ 35.03″ for the dynamic row (calculation row).
     */
    function renderTable(useExactDaily) {
      const tableEl = document.getElementById("rambam-moon-mean-table");
      if (!tableEl) return;
      const dailyForDynamic = useExactDaily ? MOON_DAILY_DEG_EXACT : MOON_DAILY_DEG;

      tableEl.innerHTML = "";
      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");
      [
        "Number of days",
        "Moon mean movement (d° m′ s″) — daily × days (full motion)",
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
      TABLE_ROWS_14_2.forEach(function (row) {
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

      // Dynamic row: user selects days; columns 2–3 computed from daily × days
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
      tdDynDaily.textContent = formatDms(dailyForDynamic);
      dynTr.appendChild(tdDynDaily);

      function updateDynamicRow() {
        const n = Number(daysInput.value);
        if (!Number.isFinite(n) || n <= 0) {
          tdDynFull.textContent = "—";
          tdDynMod.textContent = "—";
          return;
        }
        const fullDeg = dailyForDynamic * n;
        tdDynFull.textContent = formatDms(fullDeg);
        tdDynMod.textContent = formatDms(mod360(fullDeg));
      }

      daysInput.addEventListener("input", updateDynamicRow);
      daysInput.addEventListener("change", updateDynamicRow);
      updateDynamicRow();

      tbody.appendChild(dynTr);
      tableEl.appendChild(tbody);
    }

    function initPanel() {
      if (initialized) return;
      initialized = true;

      renderVerseAndExplanation();
      renderCycleAndComparison();
      renderTable(false);
    }

    /** Verse data for 14:1–14:2 for use in the Rambam Kiddush HaChodesh dropdown. */
    function getVerseData() {
      const englishSummary =
        "The Rambam describes the moon as having two mean motions (14:1): on a small cycle (epicycle) and on the great cycle. " +
        "The mean motion of the moon on the great cyclein one day is 13° 10′ 35″ (י\"ג יל\"ה). In 14:2 he gives the total motion for 10, 100, 1000, 10000, 29, and 354 days. " +
        "The calculation row below uses the more exact value 13° 10′ 35.03″ implied by his numbers.";
      return {
        hebrewText: VERSE_14_1 + " " + VERSE_14_2,
        englishSummary: englishSummary,
      };
    }

    /** Fill the moon block (cycle + table) in the shared Rambam panel. Uses 13° 10′ 35.03″ for the dynamic row. */
    function renderMoonContent() {
      renderCycleAndComparison();
      renderTable(true);
    }

    return {
      initPanel: initPanel,
      MOON_DAILY_DEG: MOON_DAILY_DEG,
      MOON_DAILY_DEG_EXACT: MOON_DAILY_DEG_EXACT,
      CYCLE_DAYS: CYCLE_DAYS,
      getTableRows: function () {
        return TABLE_ROWS_14_2;
      },
      getVerseData: getVerseData,
      renderMoonContent: renderMoonContent,
    };
  })();

  global.RambamMoonMean = RambamMoonMean;
})(typeof window !== "undefined" ? window : globalThis);
