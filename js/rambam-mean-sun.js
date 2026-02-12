// rambam-mean-sun.js
// Explanatory stat for Rambam's description of the mean motion of the sun (Hilchot Kiddush HaChodesh 12:1).

(function (global) {
  const RambamMeanSun = (function () {
    let initialized = false;
    // Default eccentricity: use the value from the Rambam anomaly prompt (0.03462).
    let rambamEccentricity = 0.03462;
    const ECCENTRICITY_MIN = 0;
    const ECCENTRICITY_MAX = 0.8;
    // Extra-row mean angle (0–180°) stored outside the DOM so it survives table re-renders.
    // Default to 65° as requested.
    let rambamMeanExtra = "65";
    let visStarted = false;
    let visSmooth = false;
    let visStartTime = null;

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
          "In the days of the Rambam this was described instead as a circle whose centre is displaced from the Earth. " +
          "Rambam's rate is about 1° in 70 years, whereas modern measurements of Earth's apsidal precession give about 1° in roughly 300–310 years (about 112,000 years for a full 360° cycle).",
      },
      {
        id: "13:4",
        label: "13:4 – מנת המסלול (תיקון השמש)",
        hebrewText:
          "וכמה היא מנת המסלול. אם יהיה המסלול עשר מעלות תהיה מנתו כ׳ חלקים. " +
          "ואם יהיה כ׳ מעלות תהיה מנתו מ׳ חלקים. ואם יהיה ל׳ מעלות תהיה מנתו נ״ח חלקים. " +
          "ואם יהיה מ׳ מעלות תהיה מנתו מעלה אחת וט״ו חלקים. ואם יהיה נ׳ מעלות תהיה מנתו מעלה אחת וכ״ט חלקים. " +
          "ואם יהיה ס׳ מעלות תהיה מנתו מעלה אחת ומ״א חלקים. ואם יהיה ע׳ מעלות תהיה מנתו מעלה אחת ונ״א חלקים. " +
          "ואם יהיה פ׳ מעלות תהיה מנתו מעלה אחת ונ״ז חלקים. ואם יהיה צ׳ מעלות תהיה מנתו מעלה אחת ונ״ט חלקים. " +
          "ואם יהיה ק׳ מעלות תהיה מנתו מעלה אחת ונ״ח חלקים. ואם יהיה ק״י תהיה מנתו מעלה אחת ונ״ג חלקים. " +
          "ואם יהיה ק״כ תהיה מנתו מעלה אחת ומ״ה חלקים. ואם יהיה ק״ל תהיה מנתו מעלה אחת ול״ג חלקים. " +
          "ואם יהיה ק״מ תהיה מנתו מעלה אחת וי״ט חלקים. ואם יהיה ק״נ תהיה מנתו מעלה אחת וחלק אחד. " +
          "ואם יהיה ק״ס תהיה מנתו מ״ב חלקים. ואם יהיה ק״ע תהיה מנתו כ״א חלקים. ואם יהיה ק״פ בשוה אין לו מנה כמו שביארנו " +
          "אלא מקום השמש האמצעי הוא מקומה האמתית.",
        englishSummary:
          "In 13:4 Rambam gives a correction table (מנת המסלול) for the sun. For each offset of the mean sun from its apogee – " +
          "10°, 20°, 30°, …, 170°, 180° – he lists how many parts of a degree we must add to or subtract from the mean sun to get the true sun. " +
          "Geometrically, Rambam explains this using a circular orbit whose centre is displaced from the Earth. Today we understand the same effect " +
          "using Kepler's laws and an almost-elliptical orbit for the Earth around the sun. The table below compares Rambam's sexagesimal corrections " +
          "with the corrections from a simple eccentricity model that you can adjust slightly.",
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
        spanLabel: "10 days",
        // 1.5 arcseconds = 1.5 / 3600 degrees.
        remainderDeg: 1.5 / 3600,
      },
      {
        spanLabel: "100 days",
        // 15 arcseconds = 15 / 3600 degrees.
        remainderDeg: 15 / 3600,
      },
      {
        spanLabel: "1000 days",
        // 2 parts and 30 seconds: 2/60 degrees + 30/3600 degrees.
        remainderDeg: 2 / 60 + 30 / 3600,
      },
      {
        spanLabel: "10,000 days",
        // 25 parts = 25/60 degrees.
        remainderDeg: 25 / 60,
      },
      {
        spanLabel: "≈ 70 years (≈ 25,600 days) – 1°",
        // Rambam: about 1 degree in 70 years.
        remainderDeg: 1,
      },
    ];

    /**
     * Rows for the explanation table for verse 13:4 – Rambam's correction of the sun (מנת המסלול).
     *
     * meanDeg:    mean anomaly (average motion from the apogee) in degrees – 10°, 20°, …, 180°.
     * rambamDeg:  Rambam's correction in decimal degrees, converted from parts (60 parts = 1°).
     */
    const TABLE_ROWS_13_4 = [
      { meanDeg: 10, rambamDeg: 20 / 60 }, // 20′
      { meanDeg: 20, rambamDeg: 40 / 60 }, // 40′
      { meanDeg: 30, rambamDeg: 58 / 60 }, // 58′
      { meanDeg: 40, rambamDeg: 1 + 15 / 60 }, // 1° 15′
      { meanDeg: 50, rambamDeg: 1 + 29 / 60 }, // 1° 29′
      { meanDeg: 60, rambamDeg: 1 + 41 / 60 }, // 1° 41′
      { meanDeg: 70, rambamDeg: 1 + 51 / 60 }, // 1° 51′
      { meanDeg: 80, rambamDeg: 1 + 57 / 60 }, // 1° 57′
      { meanDeg: 90, rambamDeg: 1 + 59 / 60 }, // 1° 59′
      { meanDeg: 100, rambamDeg: 1 + 58 / 60 }, // 1° 58′
      { meanDeg: 110, rambamDeg: 1 + 53 / 60 }, // 1° 53′
      { meanDeg: 120, rambamDeg: 1 + 45 / 60 }, // 1° 45′
      { meanDeg: 130, rambamDeg: 1 + 33 / 60 }, // 1° 33′
      { meanDeg: 140, rambamDeg: 1 + 19 / 60 }, // 1° 19′
      { meanDeg: 150, rambamDeg: 1 + 1 / 60 }, // 1° 1′
      { meanDeg: 160, rambamDeg: 42 / 60 }, // 42′
      { meanDeg: 170, rambamDeg: 21 / 60 }, // 21′
      { meanDeg: 180, rambamDeg: 0 }, // 0′ – no correction
    ];

    // Daily mean motion used for free-form computations: 0° 59′ 8.33″
    const DAILY_DEG_059_08_33 = 0.9856472222222222;

    function clampEccentricity(e) {
      if (!Number.isFinite(e)) return rambamEccentricity;
      if (e < ECCENTRICITY_MIN) return ECCENTRICITY_MIN;
      if (e > ECCENTRICITY_MAX) return ECCENTRICITY_MAX;
      return e;
    }

    /**
     * Compute the correction (the "anomaly") for a given mean anomaly and eccentricity, in degrees.
     * This mirrors the helper used in the notebook:
     *
     *   def get_anomaly(deg):
     *       deg = math.radians(deg)
     *       rad = deg - math.atan2(math.sin(deg), math.cos(deg) + e)
     *       return math.degrees(rad)
     */
    function anomalyForEccentricity(meanDeg, eccentricity) {
      const rad = (meanDeg * Math.PI) / 180;
      const trueFromCentre = Math.atan2(
        Math.sin(rad),
        Math.cos(rad) + eccentricity
      );
      const anomalyRad = rad - trueFromCentre;
      return (anomalyRad * 180) / Math.PI;
    }

    function formatAngleDegrees(deg) {
      let a = deg % 360;
      if (a < 0) a += 360;
      return a.toFixed(1) + "°";
    }

    function initVisualization() {
      if (visStarted) return;

      const svg = document.getElementById("rambam-orbit-svg");
      const meanSpan = document.getElementById("rambam-angle-mean");
      const trueSpan = document.getElementById("rambam-angle-true");
      const diffSpan = document.getElementById("rambam-angle-diff");
      const smoothCb = document.getElementById("rambam-vis-smooth");
      if (!svg || !meanSpan || !trueSpan || !diffSpan) {
        return;
      }

      visStarted = true;

      const SVG_NS = "http://www.w3.org/2000/svg";
      const ORBIT_R = 1.2;
      svg.innerHTML = "";

      const orbit = document.createElementNS(SVG_NS, "circle");
      orbit.setAttribute("cx", "0");
      orbit.setAttribute("cy", "0");
      // Orbit radius defines the edge; rays will reach (or slightly undershoot) this circle.
      orbit.setAttribute("r", String(ORBIT_R));
      orbit.setAttribute("class", "rambam-orbit-path");
      svg.appendChild(orbit);

      const sun = document.createElementNS(SVG_NS, "circle");
      sun.setAttribute("cx", "0");
      sun.setAttribute("cy", "0");
      // Small point at the centre (orbit centre).
      sun.setAttribute("r", "0.028");
      sun.setAttribute("class", "rambam-sun");
      svg.appendChild(sun);

      // Eccentric point representing the Earth; cy updated each frame from rambamEccentricity.
      const earthCentre = document.createElementNS(SVG_NS, "circle");
      earthCentre.setAttribute("cx", "0");
      earthCentre.setAttribute("cy", String(rambamEccentricity * ORBIT_R));
      earthCentre.setAttribute("r", "0.028");
      earthCentre.setAttribute("class", "rambam-earth-centre");
      svg.appendChild(earthCentre);

      const meanLine = document.createElementNS(SVG_NS, "line");
      meanLine.setAttribute("x1", "0");
      meanLine.setAttribute("y1", "0");
      meanLine.setAttribute("class", "rambam-mean-line");
      svg.appendChild(meanLine);

      const trueLine = document.createElementNS(SVG_NS, "line");
      // True ray starts at Earth (eccentric blue dot); y1 updated each frame.
      trueLine.setAttribute("x1", "0");
      trueLine.setAttribute("y1", String(rambamEccentricity * ORBIT_R));
      trueLine.setAttribute("class", "rambam-true-line");
      svg.appendChild(trueLine);

      const sunOrbit = document.createElementNS(SVG_NS, "circle");
      // Yellow dot on the orbit: the sun.
      sunOrbit.setAttribute("r", "0.05");
      sunOrbit.setAttribute("class", "rambam-sun-orbit");
      svg.appendChild(sunOrbit);

      // Arc from 0° (top) to α – drawn closer to center.
      const arcAlpha = document.createElementNS(SVG_NS, "path");
      arcAlpha.setAttribute("class", "rambam-arc-alpha");
      svg.appendChild(arcAlpha);

      // Arc from 0° (top) to β – drawn further out so both arcs are visible.
      const arcBeta = document.createElementNS(SVG_NS, "path");
      arcBeta.setAttribute("class", "rambam-arc-beta");
      svg.appendChild(arcBeta);

      const alphaLabel = document.createElementNS(SVG_NS, "text");
      alphaLabel.setAttribute("class", "rambam-angle-label");
      alphaLabel.textContent = "α";
      svg.appendChild(alphaLabel);

      const betaLabel = document.createElementNS(SVG_NS, "text");
      betaLabel.setAttribute("class", "rambam-angle-label");
      betaLabel.textContent = "β";
      svg.appendChild(betaLabel);

      if (smoothCb) {
        smoothCb.addEventListener("change", function () {
          visSmooth = !!smoothCb.checked;
          visStartTime = performance.now();
        });
      }

      const TICK_SECONDS = 60 / 36;
      visStartTime = performance.now();

      function animate(timestamp) {
        if (!visStartTime) visStartTime = timestamp;
        const elapsedSec = (timestamp - visStartTime) / 1000;

        // Use the currently selected eccentricity from the input so α, β and β−α stay in sync.
        const eccInputEl = document.getElementById("rambam-eccentricity-input");
        let e = rambamEccentricity;
        if (eccInputEl && eccInputEl.value.trim() !== "") {
          const parsed = Number(eccInputEl.value.replace(",", "."));
          if (Number.isFinite(parsed)) {
            e = clampEccentricity(parsed);
          }
        }

        let meanDeg;
        if (visSmooth) {
          // Smooth motion: slower orbit so the change is easier to see.
          // 2° per second → full circle in 180 seconds.
          meanDeg = (elapsedSec * 2) % 360;
        } else {
          const steps = Math.floor(elapsedSec / TICK_SECONDS);
          meanDeg = (steps * 10) % 360;
        }

        // Put 0° at the top of the circle (12 o'clock) by subtracting 90°,
        // so increasing meanDeg moves counter-clockwise.
        const meanRad = ((meanDeg - 90) * Math.PI) / 180;

        // Use the same anomaly computation as in the 13:4 table (get_anomaly):
        // correction = mean − true, in degrees.
        const correctionDeg = anomalyForEccentricity(meanDeg, e);
        // True longitude β in the same (0° at top) convention.
        let trueDeg = (meanDeg - correctionDeg + 360) % 360;

        const trueRad = ((trueDeg - 90) * Math.PI) / 180;

        // Difference β − α in degrees.
        const diffNorm = trueDeg - meanDeg;

        const trueX = Math.cos(trueRad);
        const trueY = Math.sin(trueRad);

        const eccY = e * ORBIT_R;
        // Both lines point at the same spot on the orbit: the sun.
        meanLine.setAttribute("x2", String(trueX * ORBIT_R));
        meanLine.setAttribute("y2", String(trueY * ORBIT_R));
        // True line: Earth → sun.
        trueLine.setAttribute("x1", "0");
        trueLine.setAttribute("y1", String(eccY));
        earthCentre.setAttribute("cy", String(eccY));
        trueLine.setAttribute("x2", String(trueX * ORBIT_R));
        trueLine.setAttribute("y2", String(trueY * ORBIT_R));

        sunOrbit.setAttribute("cx", String(trueX * ORBIT_R));
        sunOrbit.setAttribute("cy", String(trueY * ORBIT_R));

        // Both arcs: circular, centered at orbit centre (0,0), start at 0° (top),
        // and end where they meet their respective lines (direction from centre to sun, β).
        const R_ARC_ALPHA = ORBIT_R * 0.32;
        const TOP = -Math.PI / 2;

        function arcPathFromTop(cx, cy, r, endRad) {
          const endX = cx + r * Math.cos(endRad);
          const endY = cy + r * Math.sin(endRad);
          const startX = cx + r * Math.cos(TOP);
          const startY = cy + r * Math.sin(TOP);
          const span = ((endRad - TOP) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
          const largeArc = span > Math.PI ? 1 : 0;
          const sweep = 1; // clockwise
          return (
            "M " + startX + " " + startY +
            " A " + r + " " + r + " 0 " + largeArc + " " + sweep + " " + endX + " " + endY
          );
        }

        // Orange arc α: meets the orange line (centre → sun).
        arcAlpha.setAttribute("d", arcPathFromTop(0, 0, R_ARC_ALPHA, trueRad));

        // Blue arc β: center at orbit centre (not Earth); radius ORBIT_R so it meets the blue line (Earth → sun) at the sun.
        arcBeta.setAttribute("d", arcPathFromTop(0, 0, ORBIT_R, trueRad));

        // Labels at arc midpoints, just outside each arc (both centered at 0,0).
        const midAngle = (TOP + trueRad) / 2;
        const labelAlphaR = R_ARC_ALPHA * 1.05;
        const labelBetaR = ORBIT_R * 1.05;
        alphaLabel.setAttribute("x", String(labelAlphaR * Math.cos(midAngle)));
        alphaLabel.setAttribute("y", String(labelAlphaR * Math.sin(midAngle)));
        betaLabel.setAttribute("x", String(labelBetaR * Math.cos(midAngle)));
        betaLabel.setAttribute("y", String(labelBetaR * Math.sin(midAngle)));
        alphaLabel.style.display = "";
        betaLabel.style.display = "";

        // Show the three angles in degrees, arcminutes and arcseconds.
        const noSeconds = visSmooth;
        meanSpan.textContent = "α (mean): " + formatDms(meanDeg, noSeconds);
        trueSpan.textContent = "β (true): " + formatDms(trueDeg, noSeconds);
        diffSpan.textContent =
          "β − α (difference): " + formatDms(diffNorm, noSeconds);

        requestAnimationFrame(animate);
      }

      requestAnimationFrame(animate);
    }

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

    function formatDms(deg, omitSeconds) {
      const { d, m, s } = degToDms(deg);
      const signStr = d < 0 ? "-" : "";
      const absD = Math.abs(d);
      if (omitSeconds) {
        return signStr + absD + "° " + String(m) + "′";
      }
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

    function updateComputationText(id) {
      const compText = document.getElementById("rambam-computation-text");
      if (!compText) return;

      if (id === "13:4") {
        // Explain the actual anomaly computation as outlined in direction_prompts/rambam3.txt.
        const eText = rambamEccentricity.toFixed(5);
        compText.innerHTML =
          "<p>The correction is calculated using the following formula:</p>" +
          
          "<code>m = M · π/180</code>, then " +
          "<code>θ = atan2(sin(m), cos(m) + e)</code>, and the correction is " +
          "<code>M − θ·180/π</code> (all angles in radians inside atan2, then converted back to degrees). " +
          "Here we are currently using <code>e ≈ " +
          eText +
          "</code> as the eccentricity, matching the value in the input box below.";
      } else {
        compText.textContent = "";
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

      const sunTableWrapper = document.getElementById("rambam-sun-table-wrapper");
      const moonBlock = document.getElementById("rambam-moon-mean-block");
      const moonPathBlock = document.getElementById("rambam-moon-mean-path-block");
      const daysControls = document.querySelector(".rambam-days-controls");
      const daysOutput = document.getElementById("rambam-days-output");
      const visBlock = document.querySelector(".rambam-visualization");
      const eccControls = document.querySelector(".rambam-ecc-controls");

      if (id === "14:1") {
        if (sunTableWrapper) sunTableWrapper.style.display = "none";
        if (moonBlock) moonBlock.style.display = "";
        if (moonPathBlock) moonPathBlock.style.display = "none";
        if (daysControls) daysControls.style.display = "none";
        if (daysOutput) daysOutput.style.display = "none";
        if (visBlock) visBlock.style.display = "none";
        if (eccControls) eccControls.style.display = "none";
        const RambamMoonMean = global.RambamMoonMean;
        if (RambamMoonMean && RambamMoonMean.renderMoonContent) {
          RambamMoonMean.renderMoonContent();
        }
        return;
      }

      if (id === "14:3") {
        if (sunTableWrapper) sunTableWrapper.style.display = "none";
        if (moonBlock) moonBlock.style.display = "none";
        if (moonPathBlock) moonPathBlock.style.display = "";
        if (daysControls) daysControls.style.display = "none";
        if (daysOutput) daysOutput.style.display = "none";
        if (visBlock) visBlock.style.display = "none";
        if (eccControls) eccControls.style.display = "none";
        const RambamMoonMeanPath = global.RambamMoonMeanPath;
        if (RambamMoonMeanPath && RambamMoonMeanPath.renderMoonPathContent) {
          RambamMoonMeanPath.renderMoonPathContent();
        }
        return;
      }

      if (sunTableWrapper) sunTableWrapper.style.display = "";
      if (moonBlock) moonBlock.style.display = "none";
      if (moonPathBlock) moonPathBlock.style.display = "none";

      renderTable(id);

      if (daysControls) {
        daysControls.style.display = id === "12:1" ? "" : "none";
      }
      if (daysOutput) {
        daysOutput.style.display = id === "12:1" ? "" : "none";
      }

      if (visBlock) {
        visBlock.style.display = id === "13:4" ? "" : "none";
      }

      if (eccControls) {
        eccControls.style.display = id === "13:4" ? "" : "none";
      }

      updateComputationText(id);
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

      let rows;
      if (effectiveId === "12:2") {
        rows = TABLE_ROWS_12_2;
      } else if (effectiveId === "13:4") {
        rows = TABLE_ROWS_13_4;
      } else {
        rows = TABLE_ROWS_12_1;
      }

      tableEl.innerHTML = "";

      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");

      if (effectiveId === "12:2") {
        ["Time span", "Rambam apogee motion (d° m′ s″)"].forEach((label) => {
          const th = document.createElement("th");
          th.textContent = label;
          headRow.appendChild(th);
        });
      } else if (effectiveId === "13:4") {
        [
          "Average motion (mean anomaly, degrees)",
          "Rambam correction (d° m′ s″)",
          "Our correction (get_anomaly, d° m′ s″)",
        ].forEach((label) => {
          const th = document.createElement("th");
          th.textContent = label;
          headRow.appendChild(th);
        });
      } else {
        [
          "Number of days",
          "Rambam mean motion (d° m′ s″, with wrapping)",
          "Full motion (no 360° modulo)",
          "Implied daily motion (d° m′ s″ per day)",
        ].forEach((label) => {
          const th = document.createElement("th");
          th.textContent = label;
          headRow.appendChild(th);
        });
      }

      thead.appendChild(headRow);
      tableEl.appendChild(thead);

      const tbody = document.createElement("tbody");
      rows.forEach((row) => {
        const tr = document.createElement("tr");

        if (effectiveId === "12:2") {
          const tdSpan = document.createElement("td");
          tdSpan.textContent = row.spanLabel;
          tr.appendChild(tdSpan);

          const tdDms = document.createElement("td");
          tdDms.textContent = formatDms(row.remainderDeg);
          tr.appendChild(tdDms);
        } else if (effectiveId === "13:4") {
          const tdMean = document.createElement("td");
          tdMean.textContent = String(row.meanDeg) + "°";
          tr.appendChild(tdMean);

          const tdRambam = document.createElement("td");
          tdRambam.textContent = formatDms(row.rambamDeg);
          tr.appendChild(tdRambam);

          const tdOur = document.createElement("td");
          const ourDeg = anomalyForEccentricity(
            row.meanDeg,
            rambamEccentricity
          );
          tdOur.textContent = formatDms(ourDeg);
          tr.appendChild(tdOur);
        } else {
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
        }

        tbody.appendChild(tr);
      });

      // Extra interpolated row for verse 13:4 using user-selected mean angle,
      // with the input box embedded directly in the first column.
      if (effectiveId === "13:4") {
        const customTr = document.createElement("tr");

        const tdMean = document.createElement("td");
        const meanInput = document.createElement("input");
        meanInput.type = "number";
        meanInput.id = "rambam-mean-input";
        meanInput.min = "0";
        meanInput.max = "180";
        meanInput.step = "1";
        meanInput.placeholder = "0–180";
        if (typeof rambamMeanExtra === "string") {
          meanInput.value = rambamMeanExtra;
        }
        meanInput.addEventListener("input", function () {
          rambamMeanExtra = meanInput.value;
          // Re-render table for the same verse so the interpolated values update.
          renderTable("13:4");
        });
        tdMean.appendChild(meanInput);
        customTr.appendChild(tdMean);

        const tdRambam = document.createElement("td");
        const tdOur = document.createElement("td");

        const valStr = rambamMeanExtra != null ? rambamMeanExtra.trim() : "";
        const meanVal = Number(valStr);
        if (Number.isFinite(meanVal) && meanVal >= 0 && meanVal <= 180) {
          // Linear interpolation of Rambam's correction between the nearest tabulated meanDeg values.
          // For 0° we explicitly fix the correction to 0, and for 0–firstRow.meanDeg
          // we interpolate between (0°, 0) and the first Rambam point.
          let rambamInterpDeg = null;
          let interpExplain = "";
          const baseRows = TABLE_ROWS_13_4;
          if (meanVal <= 0) {
            rambamInterpDeg = 0;
            interpExplain = "0° (no correction at 0°)";
          } else if (meanVal <= baseRows[0].meanDeg) {
            const first = baseRows[0];
            const t = meanVal / first.meanDeg;
            rambamInterpDeg = t * first.rambamDeg;
            const { d: d1, m: m1 } = degToDms(first.rambamDeg);
            interpExplain = `${d1}° ${m1}′ · ${meanVal}/${first.meanDeg}`;
          } else if (meanVal >= baseRows[baseRows.length - 1].meanDeg) {
            const last = baseRows[baseRows.length - 1];
            rambamInterpDeg = last.rambamDeg;
            interpExplain = `use value at ${last.meanDeg}°`;
          } else {
            for (let i = 0; i < baseRows.length - 1; i++) {
              const a = baseRows[i];
              const b = baseRows[i + 1];
              if (meanVal >= a.meanDeg && meanVal <= b.meanDeg) {
                const t = (meanVal - a.meanDeg) / (b.meanDeg - a.meanDeg);
                rambamInterpDeg = a.rambamDeg + t * (b.rambamDeg - a.rambamDeg);

                const { d: da, m: ma } = degToDms(a.rambamDeg);
                const { d: db, m: mb } = degToDms(b.rambamDeg);
                const num = meanVal - a.meanDeg;
                const den = b.meanDeg - a.meanDeg;
                interpExplain = `${da}° ${ma}′ + (${db}° ${mb}′ − ${da}° ${ma}′) · ${num}/${den}`;
                break;
              }
            }
          }

          if (rambamInterpDeg == null) {
            tdRambam.textContent = "—";
          } else {
            const mainText = formatDms(rambamInterpDeg, true);
            if (interpExplain) {
              tdRambam.innerHTML =
                `<div>${mainText}</div>` +
                `<div class="rambam-interp-note">${interpExplain}</div>`;
            } else {
              tdRambam.textContent = mainText;
            }
          }

          const ourDeg = anomalyForEccentricity(meanVal, rambamEccentricity);
          tdOur.textContent = formatDms(ourDeg);
        } else {
          tdRambam.textContent = "—";
          tdOur.textContent = "—";
        }

        customTr.appendChild(tdRambam);
        customTr.appendChild(tdOur);

        tbody.appendChild(customTr);
      }

      tableEl.appendChild(tbody);
    }

    function initRambamPanel() {
      if (initialized) return;
      initialized = true;

      if (global.RambamMoonMean && global.RambamMoonMean.getVerseData) {
        const d = global.RambamMoonMean.getVerseData();
        VERSES.push({
          id: "14:1",
          label: "14:1–14:2 – מהלך אמצע הירח",
          hebrewText: d.hebrewText,
          englishSummary: d.englishSummary,
        });
      }
      if (global.RambamMoonMeanPath && global.RambamMoonMeanPath.getVerseData) {
        const d = global.RambamMoonMeanPath.getVerseData();
        VERSES.push({
          id: "14:3",
          label: "14:3–14:4 – מהלך אמצע המסלול",
          hebrewText: d.hebrewText,
          englishSummary: d.englishSummary,
        });
      }

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

      const eccInput = document.getElementById("rambam-eccentricity-input");
      if (eccInput) {
        eccInput.value = String(rambamEccentricity);
        const handleEccChange = function (normalizeDisplay) {
          const raw = eccInput.value.trim();
          if (!raw) return;
          const parsed = Number(raw.replace(",", "."));
          if (!Number.isFinite(parsed)) {
            if (normalizeDisplay) eccInput.value = rambamEccentricity.toFixed(5);
            return;
          }
          const clamped = clampEccentricity(parsed);
          rambamEccentricity = clamped;
          if (normalizeDisplay) eccInput.value = rambamEccentricity.toFixed(5);

          const verseSelectEl = document.getElementById("rambam-verse-select");
          const currentId =
            verseSelectEl && verseSelectEl.value
              ? verseSelectEl.value
              : VERSES[0].id;
          if (currentId === "13:4") {
            renderTable(currentId);
            updateComputationText(currentId);
          }
        };
        eccInput.addEventListener("input", function () {
          handleEccChange(false);
        });
        eccInput.addEventListener("change", function () {
          handleEccChange(true);
        });
        eccInput.addEventListener("blur", function () {
          handleEccChange(true);
        });
      }

      initVisualization();

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

