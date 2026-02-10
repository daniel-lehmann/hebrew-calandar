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
      {
        id: "12:2",
        label: "12:2 – גובה השמש (אפוגיאה)",
        hebrewText:
          "נקודה אחת יש בגלגל השמש וכן בשאר גלגלי השבעה כוכבים. בעת שיהיה הכוכב בה יהיה גבוה מעל הארץ כל מאורו. " +
          "ואותה הנקודה של גלגל השמש ושאר הכוכבים חוץ מן הירח סובבת בשוה. " +
          "ומהלכה בכל שבעים שנה בקירוב מעלה אחת. ונקודה זו היא הנקראת גובה השמש. " +
          "מהלכו בכל עשרה ימים שניה אחת וחצי שניה שהיא ל' שלישיות. " +
          "נמצא מהלכו בק' יום ט\"ו שניות. ומהלכו באלף יום שני חלקים ושלשים שניות. " +
          "ומהלכו בעשרת אלפים יום כ\"ה חלקים.",
        englishSummary:
          "Rambam now describes the very slow motion of the sun's apogee – a special point on the sun's path, " +
          "the place where the sun is highest above the Earth. In his sexagesimal units this point moves 1½ seconds " +
          "in 10 days, 15 seconds in 100 days, 2 parts and 30 seconds in 1000 days, and 25 parts in 10,000 days. " +
          "In modern terms this reflects that the Earth is sometimes closer to the sun and sometimes farther: its angular motion " +
          "is faster when it is close (near perihelion) and slower when it is far (near aphelion). We understand this using Kepler's laws " +
          "and the fact that the Earth's orbit is a slightly eccentric ellipse whose major axis slowly rotates with respect to the distant stars. " +
          "In the days of the Rambam this was described instead as a circle whose centre is displaced from the Earth.",
      },
    ];

    /**
     * Rows for the explanation table for verse 12:1.
     *
     * remainderDeg: Rambam's stated motion, in decimal degrees (after any 360° wrapping).
     * revolutions:  how many full 360° turns were discarded (0 for most rows; 2 and 27 for 1000 and 10000 days).
     * impliedDailyDeg: decimal degrees per day, using the full motion (remainder + revolutions × 360°).
     */
    const TABLE_ROWS_12_1 = [
      {
        days: 1,
        remainderDeg: 0.9855555555555555, // 0° 59′ 8″
        revolutions: 0,
        impliedDailyDeg: 0.9855555555555555,
      },
      {
        days: 10,
        remainderDeg: 9.856388888888889, // 9° 51′ 23″
        revolutions: 0,
        impliedDailyDeg: 0.9856388888888888,
      },
      {
        days: 100,
        remainderDeg: 98.56472222222222, // 98° 33′ 53″
        revolutions: 0,
        impliedDailyDeg: 0.9856472222222222,
      },
      {
        days: 1000,
        remainderDeg: 265.64722222222224, // 265° 38′ 50″ – remainder after discarding 2 × 360°
        revolutions: 2,
        impliedDailyDeg: 0.9856472222222222,
      },
      {
        days: 10000,
        remainderDeg: 136.47222222222223, // 136° 28′ 20″ – remainder after discarding 27 × 360°
        revolutions: 27,
        impliedDailyDeg: 0.9856472222222222,
      },
      {
        days: 29,
        remainderDeg: 28.58361111111111, // 28° 35′ 1″
        revolutions: 0,
        impliedDailyDeg: 0.9856417624521073,
      },
      {
        days: 354, // regular lunar year (12 lunar months)
        remainderDeg: 348.92083333333335, // 348° 55′ 15″
        revolutions: 0,
        impliedDailyDeg: 0.9856520715630885,
      },
    ];

    /**
     * Rows for the explanation table for verse 12:2 – the motion of the sun's apogee (גובה השמש).
     *
     * Here Rambam gives motions only in small fractions of a degree (parts, seconds, thirds), so there is no 360° wrapping.
     */
    const TABLE_ROWS_12_2 = [
      {
        days: 10,
        // 1.5 arcseconds = 1.5 / 3600 degrees.
        remainderDeg: 1.5 / 3600,
        revolutions: 0,
        // Implied daily motion: 1.5 arcseconds in 10 days.
        impliedDailyDeg: (1.5 / 3600) / 10,
      },
      {
        days: 100,
        // 15 arcseconds = 15 / 3600 degrees.
        remainderDeg: 15 / 3600,
        revolutions: 0,
        impliedDailyDeg: (15 / 3600) / 100,
      },
      {
        days: 1000,
        // 2 parts and 30 seconds: 2/60 degrees + 30/3600 degrees.
        remainderDeg: 2 / 60 + 30 / 3600,
        revolutions: 0,
        impliedDailyDeg: (2 / 60 + 30 / 3600) / 1000,
      },
      {
        days: 10000,
        // 25 parts = 25/60 degrees.
        remainderDeg: 25 / 60,
        revolutions: 0,
        impliedDailyDeg: (25 / 60) / 10000,
      },
    ];

    // Daily mean motion used for free-form computations: 0° 59′ 8.33″
    const DAILY_DEG_059_08_33 = 0.9856472222222222;

    function degToDms(deg) {
      const sign = deg < 0 ? -1 : 1;
      let x = Math.abs(deg);
      let d = Math.floor(x);
      let mFloat = (x - d) * 60;
      let m = Math.floor(mFloat);
      let s = (mFloat - m) * 60;
      // Round seconds to 2 decimal places and normalise carry to minutes/degrees.
      s = Number(s.toFixed(2));
      if (s >= 60) {
        s -= 60;
        m += 1;
      }
      if (m >= 60) {
        m -= 60;
        d += 1;
      }
      if (sign < 0) d = -d;
      return { d, m, s };
    }

    function formatDms(deg) {
      const { d, m, s } = degToDms(deg);
      const signStr = d < 0 ? "-" : "";
      const absD = Math.abs(d);
      return (
        signStr +
        absD +
        "° " +
        String(m) +
        "′ " +
        s.toFixed(2) +
        "″"
      );
    }

    function updateDaysComputation() {
      const input = document.getElementById("rambam-days-input");
      const outEl = document.getElementById("rambam-days-output");
      if (!input || !outEl) return;

      const raw = input.value;
      const n = Number(raw);
      if (!raw || !Number.isFinite(n) || n <= 0) {
        outEl.textContent =
          "Enter a positive number of days to see the total mean motion.";
        return;
      }

      const totalDeg = n * DAILY_DEG_059_08_33;
      const totalStr = formatDms(totalDeg);

      let html =
        "Total mean motion for " +
        n +
        " day" +
        (n === 1 ? "" : "s") +
        ": <strong>" +
        totalStr +
        "</strong>";

      if (Math.abs(totalDeg) >= 360) {
        // Normalise modulo 360 to [0, 360).
        let wrapped = totalDeg % 360;
        if (wrapped < 0) wrapped += 360;
        const wrappedStr = formatDms(wrapped);
        html +=
          "<br />Motion modulo 360°: <strong>" + wrappedStr + "</strong>";
      }

      outEl.innerHTML = html;
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

      // Whenever we change verse, update the accompanying table to match.
      renderTable(id);
    }

    function renderTable(verseId) {
      const tableEl = document.getElementById("rambam-mean-sun-table");
      if (!tableEl) return;

      // Determine which verse's table to show. Default to the first verse.
      const effectiveId =
        verseId ||
        (typeof document !== "undefined" &&
          document.getElementById("rambam-verse-select") &&
          document.getElementById("rambam-verse-select").value) ||
        VERSES[0].id;

      const rows =
        effectiveId === "12:2" ? TABLE_ROWS_12_2 : TABLE_ROWS_12_1;

      tableEl.innerHTML = "";

      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");
      const col2Label =
        effectiveId === "12:2"
          ? "Rambam apogee motion (d° m′ s″)"
          : "Rambam mean motion (d° m′ s″, with wrapping)";
      [
        "Number of days",
        col2Label,
        "Full motion (no 360° modulo)",
        "Implied daily motion (d° m′ s″ per day)",
      ].forEach((label) => {
        const th = document.createElement("th");
        th.textContent = label;
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      tableEl.appendChild(thead);

      const tbody = document.createElement("tbody");
      rows.forEach((row) => {
        const tr = document.createElement("tr");

        const tdDays = document.createElement("td");
        tdDays.textContent = String(row.days);
        tr.appendChild(tdDays);

        const fullDeg = row.remainderDeg + row.revolutions * 360;

        const tdDms = document.createElement("td");
        tdDms.textContent = formatDms(row.remainderDeg);
        tr.appendChild(tdDms);

        const tdFull = document.createElement("td");
        tdFull.textContent = formatDms(fullDeg);
        tr.appendChild(tdFull);

        const tdDaily = document.createElement("td");
        tdDaily.textContent = formatDms(row.impliedDailyDeg);
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

      const daysInput = document.getElementById("rambam-days-input");
      if (daysInput) {
        daysInput.addEventListener("input", updateDaysComputation);
      }

      // Initial verse and table.
      renderVerse(VERSES[0].id);
      renderTable(VERSES[0].id);
      updateDaysComputation();
    }

    return {
      initRambamPanel,
    };
  })();

  global.RambamMeanSun = RambamMeanSun;
})(typeof window !== "undefined" ? window : globalThis);

