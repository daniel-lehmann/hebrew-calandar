// rambam-15-6.js
// Rambam Hilchot Kiddush HaChodesh 15:6 – moon anomaly correction (מנת המסלול for moon).
// direction_prompts/rambam7.txt
// Depends on: RambamHelpers (formatDms)

(function (global) {
  const H = global.RambamHelpers;
  const formatDms = H ? H.formatDms : function (d) { return String(d) + "°"; };
  const MOON_E = 0.0905;

  /** Moon anomaly (get_anomaly) – epicycle / ellipse model with e=0.0905 */
  function getAnomalyMoon(deg) {
    const rad = (deg * Math.PI) / 180;
    const resultRad = Math.atan2(
      MOON_E * Math.sin(rad),
      1 + MOON_E * Math.cos(rad)
    );
    return (resultRad * 180) / Math.PI;
  }

  /** Rambam's moon correction table: mean motion (0–180) → fix in degrees (parts / 60) */
  const TABLE_ROWS_15_6 = [
    { meanDeg: 0, rambamDeg: 0 },
    { meanDeg: 10, rambamDeg: 50 / 60 },
    { meanDeg: 20, rambamDeg: 1 + 38 / 60 },
    { meanDeg: 30, rambamDeg: 2 + 24 / 60 },
    { meanDeg: 40, rambamDeg: 3 + 6 / 60 },
    { meanDeg: 50, rambamDeg: 3 + 44 / 60 },
    { meanDeg: 60, rambamDeg: 4 + 16 / 60 },
    { meanDeg: 70, rambamDeg: 4 + 41 / 60 },
    { meanDeg: 80, rambamDeg: 5 },
    { meanDeg: 90, rambamDeg: 5 + 5 / 60 },
    { meanDeg: 100, rambamDeg: 5 + 8 / 60 },
    { meanDeg: 110, rambamDeg: 4 + 59 / 60 },
    { meanDeg: 120, rambamDeg: 4 + 40 / 60 },
    { meanDeg: 130, rambamDeg: 4 + 11 / 60 },
    { meanDeg: 140, rambamDeg: 3 + 33 / 60 },
    { meanDeg: 150, rambamDeg: 2 + 48 / 60 },
    { meanDeg: 160, rambamDeg: 1 + 56 / 60 },
    { meanDeg: 170, rambamDeg: 59 / 60 },
    { meanDeg: 180, rambamDeg: 0 },
  ];

  /** Linear interpolation for mean > 180: use 360 - angle */
  function rambamInterp(meanDeg) {
    const base = meanDeg <= 180 ? meanDeg : 360 - meanDeg;
    const rows = TABLE_ROWS_15_6;
    if (base <= 0) return 0;
    if (base >= 180) return rows[rows.length - 1].rambamDeg;
    for (let i = 0; i < rows.length - 1; i++) {
      const a = rows[i];
      const b = rows[i + 1];
      if (base >= a.meanDeg && base <= b.meanDeg) {
        const t = (base - a.meanDeg) / (b.meanDeg - a.meanDeg);
        return a.rambamDeg + t * (b.rambamDeg - a.rambamDeg);
      }
    }
    return 0;
  }

  /** Verse data for the Rambam Kiddush HaChodesh dropdown */
  function getVerseData() {
    const hebrewText =
      "וכמה היא מנת המסלול, אם יהיה המסלול הנכון עשר מעלות, תהיה מנתו חמישים חלקים: " +
      "ואם יהיה המסלול הנכון עשרים מעלות, תהיה מנתו מעלה אחת ושמונה ושלשים חלקים: " +
      "ואם יהיה שלשים, תהיה מנתו שתי מעלות וארבעה ועשרים חלקים: " +
      "ואם יהיה ארבעים, תהיה מנתו שלש מעלות ושישה חלקים: " +
      "ואם יהיה חמישים, תהיה מנתו שלש מעלות וארבעה וארבעים חלקים: " +
      "ואם יהיה שישים, תהיה מנתו ארבע מעלות ושישה עשר חלקים: " +
      "ואם יהיה שבעים, תהיה מנתו ארבע מעלות ואחד וארבעים חלקים: " +
      "ואם יהיה שמונים, תהיה מנתו חמש מעלות: " +
      "ואם יהיה תשעים, תהיה מנתו חמש מעלות וחמישה חלקים: " +
      "ואם יהיה מאה, תהיה מנתו חמש מעלות ושמונה חלקים: " +
      "ואם יהיה מאה ועשר, תהיה מנתו ארבע מעלות ותשעה וחמישים חלקים: " +
      "ואם יהיה מאה ועשרים, תהיה מנתו ארבע מעלות וארבעים חלקים: " +
      "ואם יהיה מאה ושלשים, תהיה מנתו ארבע מעלות ואחד עשר חלקים: " +
      "ואם יהיה מאה וארבעים, תהיה מנתו שלש מעלות ושלשה ושלשים חלקים: " +
      "ואם יהיה מאה וחמישים, תהיה מנתו שתי מעלות ושמונה וארבעים חלקים: " +
      "ואם יהיה מאה ושישים, תהיה מנתו מעלה אחת ושישה וחמישים חלקים: " +
      "ואם יהיה מאה ושבעים, תהיה מנתו תשעה וחמישים חלקים: " +
      "ואם יהיה מאה ושמונים בשוה, אין לו מנה, כמו שאמרנו, אלא מקום הירח האמצעי הוא המקום האמיתי:";
    const englishSummary =
      "Here the Rambam gives how much you need to fix the moon position due to the irregularity. " +
      "Our understanding is that this is due to the ellipse orbit and Kepler's law. " +
      "The Rambam's understanding is that this is due to the moon moving on an epicycle.";
    return { hebrewText, englishSummary };
  }

  /** Motion rates: big circle 13°10'35"/day, small circle 13°3'54"/day */
  const BIG_DEG_PER_DAY = 13 + 10 / 60 + 35 / 3600;
  const SMALL_DEG_PER_DAY = 13 + 3 / 60 + 54 / 3600;
  const RATIO = SMALL_DEG_PER_DAY / BIG_DEG_PER_DAY;

  function initSvg(container) {
    const svgWrap = container.querySelector(".rambam-15-6-svg-wrap");
    if (!svgWrap) return;

    const svg = svgWrap.querySelector("svg");
    const angleLabel = container.querySelector(".rambam-15-6-svg-angle");
    const anomalyLabel = container.querySelector(".rambam-15-6-svg-anomaly");

    const SVG_NS = "http://www.w3.org/2000/svg";
    const R = 120;
    const r = R * MOON_E;
    const cx = 150;
    const cy = 150;
    const viewBox = "0 0 300 300";

    svg.setAttribute("viewBox", viewBox);
    svg.innerHTML = "";

    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("transform", "translate(" + cx + "," + cy + ") scale(1,-1)");

    const bigCircle = document.createElementNS(SVG_NS, "circle");
    bigCircle.setAttribute("cx", 0);
    bigCircle.setAttribute("cy", 0);
    bigCircle.setAttribute("r", R);
    bigCircle.setAttribute("class", "rambam-15-6-orbit");
    g.appendChild(bigCircle);

    const smallCircle = document.createElementNS(SVG_NS, "circle");
    smallCircle.setAttribute("class", "rambam-15-6-epicycle");
    g.appendChild(smallCircle);

    const centrePoint = document.createElementNS(SVG_NS, "circle");
    centrePoint.setAttribute("cx", 0);
    centrePoint.setAttribute("cy", 0);
    centrePoint.setAttribute("r", 4);
    centrePoint.setAttribute("class", "rambam-15-6-centre");
    g.appendChild(centrePoint);

    const meanLine = document.createElementNS(SVG_NS, "line");
    meanLine.setAttribute("class", "rambam-15-6-mean-line");
    g.appendChild(meanLine);

    const epicycleLine = document.createElementNS(SVG_NS, "line");
    epicycleLine.setAttribute("class", "rambam-15-6-epicycle-line");
    g.appendChild(epicycleLine);

    const meanDot = document.createElementNS(SVG_NS, "circle");
    meanDot.setAttribute("r", 6);
    meanDot.setAttribute("class", "rambam-15-6-mean-dot");
    g.appendChild(meanDot);

    const moonDot = document.createElementNS(SVG_NS, "circle");
    moonDot.setAttribute("r", 6);
    moonDot.setAttribute("class", "rambam-15-6-moon-dot");
    g.appendChild(moonDot);

    const angleArc = document.createElementNS(SVG_NS, "path");
    angleArc.setAttribute("class", "rambam-15-6-angle-arc");
    g.appendChild(angleArc);

    svg.appendChild(g);

    const TICKS_PER_REV = 36;
    const MS_PER_TICK = 60000 / TICKS_PER_REV;
    let startTime = null;
    let lastTick = -1;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const tick = Math.floor(elapsed / MS_PER_TICK);
      const meanDeg = tick * 10;
      const smallDeg = meanDeg * RATIO;

      if (tick !== lastTick) {
        lastTick = tick;
        if (angleLabel) angleLabel.textContent = "Angle of motion: " + (meanDeg % 360) + "°";
        const anomaly = getAnomalyMoon(meanDeg % 360);
        if (anomalyLabel) anomalyLabel.textContent = "Anomaly (formula): " + formatDms(anomaly);
      }

      const meanRad = (meanDeg * Math.PI) / 180;
      const smallRad = (smallDeg * Math.PI) / 180;

      const mx = R * Math.cos(meanRad);
      const my = R * Math.sin(meanRad);

      const lx = mx + r * Math.cos(smallRad);
      const ly = my + r * Math.sin(smallRad);

      smallCircle.setAttribute("cx", mx);
      smallCircle.setAttribute("cy", my);
      smallCircle.setAttribute("r", r);

      meanLine.setAttribute("x1", 0);
      meanLine.setAttribute("y1", 0);
      meanLine.setAttribute("x2", mx);
      meanLine.setAttribute("y2", my);

      epicycleLine.setAttribute("x1", mx);
      epicycleLine.setAttribute("y1", my);
      epicycleLine.setAttribute("x2", lx);
      epicycleLine.setAttribute("y2", ly);

      meanDot.setAttribute("cx", mx);
      meanDot.setAttribute("cy", my);
      moonDot.setAttribute("cx", lx);
      moonDot.setAttribute("cy", ly);

      const moonAngle = Math.atan2(ly, lx);
      const arcR = R * 0.25;
      const span = (moonAngle - meanRad + 2 * Math.PI) % (2 * Math.PI);
      const largeArc = span > Math.PI ? 1 : 0;
      const sweep = 1;
      const ax = arcR * Math.cos(moonAngle);
      const ay = arcR * Math.sin(moonAngle);
      const sx = arcR * Math.cos(meanRad);
      const sy = arcR * Math.sin(meanRad);
      angleArc.setAttribute(
        "d",
        "M " + sx + " " + sy + " A " + arcR + " " + arcR + " 0 " + largeArc + " " + sweep + " " + ax + " " + ay
      );

      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  function render(container) {
    const { hebrewText, englishSummary } = getVerseData();

    let extraDeg = 90;

    container.innerHTML =
      '<div class="rambam-15-6-verse-block quote-block">' +
      '<p class="rambam-15-6-hebrew quote-text" dir="rtl" lang="he">' + hebrewText + "</p>" +
      '<p class="rambam-15-6-explanation rambam-verse-explanation">' + englishSummary + "</p>" +
      "</div>" +
      '<div class="rambam-15-6-table-wrapper">' +
      '<table class="rambam-15-6-table rambam-table">' +
      "<thead><tr>" +
      "<th>Average motion (°)</th>" +
      "<th>Rambam fix (d° m′ s″)</th>" +
      "<th>Fix (get_anomaly, e=0.0905)</th>" +
      "</tr></thead>" +
      "<tbody id=\"rambam-15-6-tbody\"></tbody>" +
      '<tr class="rambam-15-6-dynamic-row"><td id="rambam-15-6-input-cell"></td><td id="rambam-15-6-rambam-cell"></td><td id="rambam-15-6-formula-cell"></td></tr>' +
      "</table>" +
      "</div>" +
      '<div class="rambam-15-6-svg-wrap">' +
      '<div class="rambam-15-6-svg-labels">' +
      '<span class="rambam-15-6-svg-angle"></span>' +
      '<span class="rambam-15-6-svg-anomaly"></span>' +
      "</div>" +
      '<svg class="rambam-15-6-svg" aria-label="Moon epicycle model"></svg>' +
      "</div>";

    const tbody = container.querySelector("#rambam-15-6-tbody");
    TABLE_ROWS_15_6.forEach(function (row) {
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + row.meanDeg + "°</td>" +
        "<td>" + formatDms(row.rambamDeg) + "</td>" +
        "<td>" + formatDms(getAnomalyMoon(row.meanDeg)) + "</td>";
      tbody.appendChild(tr);
    });

    const inputCell = container.querySelector("#rambam-15-6-input-cell");
    const rambamCell = container.querySelector("#rambam-15-6-rambam-cell");
    const formulaCell = container.querySelector("#rambam-15-6-formula-cell");

    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.max = "360";
    input.step = "1";
    input.value = String(extraDeg);
    input.className = "rambam-15-6-angle-input";

    function updateDynamic() {
      const raw = input.value.trim();
      const val = Number(raw);
      if (!Number.isFinite(val)) {
        rambamCell.textContent = "—";
        formulaCell.textContent = "—";
        return;
      }
      const base = val <= 180 ? val : 360 - val;
      rambamCell.textContent = formatDms(rambamInterp(val));
      formulaCell.textContent = formatDms(getAnomalyMoon(val));
    }

    input.addEventListener("input", updateDynamic);
    inputCell.appendChild(input);
    updateDynamic();

    initSvg(container);
  }

  global.RambamVerse15_6 = {
    render: render,
    getVerseData: getVerseData,
    getAnomalyMoon: getAnomalyMoon,
    rambamInterp: rambamInterp,
  };
})(typeof window !== "undefined" ? window : globalThis);
