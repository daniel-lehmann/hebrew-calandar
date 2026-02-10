// rambam-mean-sun.js
// Explanatory stat for Rambam's description of the mean motion of the sun (Hilchot Kiddush HaChodesh 12:1).

(function (global) {
  const RambamMeanSun = (function () {
    let initialized = false;

    // Verse data – easy to extend later if you add more verses.
    const VERSES = [
      {
        id: "12:1",
        label: "12:1 – מהלך השמש האמצעי",
        hebrewText:
          "מהלך השמש האמצעי ביום אחד שהוא כ\"ד שעות נ\"ט חלקים ושמנה שניות. " +
          "נמצא מהלכה בעשרה ימים תשע מעלות ונ\"א חלקים וכ\"ג שניות. " +
          "ונמצא מהלכה במאה יום צ\"ח מעלות ושלשה ושלשים חלקים ונ\"ג שניות. " +
          "ונמצא שארית מהלכה באלף יום אחר שתשליך כל ש\"ס מעלות כמו שביארנו: " +
          "רס\"ה מעלות ול\"ח חלקים ונ׳ שניות. " +
          "ונמצא שארית מהלכה בעשרת אלפים יום: קל\"ו מעלות וכ\"ח חלקים וכ׳ שניות. " +
          "וכן אם תרצה להיות לך סימנין ידועים מוכנין למהלכה לכ\"ט יום ולשנ\"ד יום שהן ימי שנת הלבנה בזמן שחדשיה כסדרן. " +
          "ומהלך השמש האמצעי לכ\"ט יום כ\"ח מעלות ול\"ה חלקים ושניה אחת. " +
          "ומהלכה לשנה סדורה שמ\"ח מעלות ונ\"ה חלקים וט\"ו שניות.",
        englishSummary:
          "Rambam gives benchmark mean motions of the sun for specific day-counts " +
          "(1, 10, 100, 1000, 10000 days; 29 days; and a regular lunar year), " +
          "expressed in degrees, minutes and seconds. From these we can back out an implied daily mean motion.",
      },
    ];

    /**
     * Rows for the explanation table.
     *
     * movementDeg and impliedDailyDeg are decimal degrees, pre‑computed from the Rambam values.
     * pctOfCircle is (remainder / 360) * 100, i.e. how much of a full circle the listed motion represents.
     *
     * For 1000 and 10000 days, Rambam gives the remainder after throwing away whole 360° turns.
     * To get the implied daily motion we add back 2 × 360° and 27 × 360° respectively before dividing by days.
     */
    const TABLE_ROWS = [
      {
        days: 1,
        movementDms: "0° 59′ 8″",
        movementDeg: 0.9855555555555555,
        pctOfCircle: 0.2737654320987654,
        impliedDailyDeg: 0.9855555555555555,
      },
      {
        days: 10,
        movementDms: "9° 51′ 23″",
        movementDeg: 9.856388888888889,
        pctOfCircle: 2.737885802469136,
        impliedDailyDeg: 0.9856388888888888,
      },
      {
        days: 100,
        movementDms: "98° 33′ 53″",
        movementDeg: 98.56472222222222,
        pctOfCircle: 27.37908950617284,
        impliedDailyDeg: 0.9856472222222222,
      },
      {
        days: 1000,
        movementDms: "265° 38′ 50″  (remainder, after discarding whole circles)",
        movementDeg: 985.6472222222222, // 2 × 360° + 265° 38′ 50″
        pctOfCircle: 73.79089506172839, // based on remainder only
        impliedDailyDeg: 0.9856472222222222,
      },
      {
        days: 10000,
        movementDms: "136° 28′ 20″  (remainder, after discarding whole circles)",
        movementDeg: 9856.472222222223, // 27 × 360° + 136° 28′ 20″
        pctOfCircle: 37.90895061728395, // based on remainder only
        impliedDailyDeg: 0.9856472222222222,
      },
      {
        days: 29,
        movementDms: "28° 35′ 1″",
        movementDeg: 28.58361111111111,
        pctOfCircle: 7.939891975308642,
        impliedDailyDeg: 0.9856417624521073,
      },
      {
        days: 354, // regular lunar year (12 lunar months)
        movementDms: "348° 55′ 15″",
        movementDeg: 348.92083333333335,
        pctOfCircle: 96.92245370370371,
        impliedDailyDeg: 0.9856520715630885,
      },
    ];

    function formatPercent(v) {
      return v.toFixed(6) + " %";
    }

    function formatDailyDeg(v) {
      return v.toFixed(9) + " °/day";
    }

    function populateVerseSelect(selectEl) {
      if (!selectEl) return;
      selectEl.innerHTML = "";
      VERSES.forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v.id;
        opt.textContent = v.label;
        selectEl.appendChild(opt);
      });
      // Default to the first verse (12:1).
      if (VERSES.length) {
        selectEl.value = VERSES[0].id;
      }
    }

    function renderVerse(id) {
      const verse = VERSES.find((v) => v.id === id) || VERSES[0];
      const hebEl = document.getElementById("rambam-verse-text");
      const enEl = document.getElementById("rambam-verse-explanation");
      if (hebEl) {
        hebEl.textContent = verse.hebrewText;
      }
      if (enEl) {
        enEl.textContent = verse.englishSummary;
      }
    }

    function renderTable() {
      const tableEl = document.getElementById("rambam-mean-sun-table");
      if (!tableEl) return;

      tableEl.innerHTML = "";

      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");
      [
        "Number of days",
        "Mean motion (degrees, minutes, seconds)",
        "Motion as % of 360° (using Rambam's remainder)",
        "Implied daily motion (degrees per day)",
      ].forEach((label) => {
        const th = document.createElement("th");
        th.textContent = label;
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      tableEl.appendChild(thead);

      const tbody = document.createElement("tbody");
      TABLE_ROWS.forEach((row) => {
        const tr = document.createElement("tr");

        const tdDays = document.createElement("td");
        tdDays.textContent = String(row.days);
        tr.appendChild(tdDays);

        const tdDms = document.createElement("td");
        tdDms.textContent = row.movementDms;
        tr.appendChild(tdDms);

        const tdPct = document.createElement("td");
        tdPct.textContent = formatPercent(row.pctOfCircle);
        tr.appendChild(tdPct);

        const tdDaily = document.createElement("td");
        tdDaily.textContent = formatDailyDeg(row.impliedDailyDeg);
        tr.appendChild(tdDaily);

        tbody.appendChild(tr);
      });

      tableEl.appendChild(tbody);
    }

    function initRambamPanel() {
      if (initialized) return;
      initialized = true;

      const verseSelect = document.getElementById("rambam-verse-select");
      populateVerseSelect(verseSelect);

      if (verseSelect) {
        verseSelect.addEventListener("change", function () {
          renderVerse(verseSelect.value);
        });
      }

      // Initial verse and table.
      renderVerse(VERSES[0].id);
      renderTable();
    }

    return {
      initRambamPanel,
    };
  })();

  global.RambamMeanSun = RambamMeanSun;
})(typeof window !== "undefined" ? window : globalThis);

