// rambam-helpers.js
// Shared helpers for Rambam sun/moon calculations: angle formatting, mod 360, Rambam correction table (13:4).

(function (global) {
  /**
   * Normalise angle to [0, 360).
   */
  function mod360(deg) {
    let a = deg % 360;
    if (a < 0) a += 360;
    return a;
  }

  /**
   * Split decimal degrees into { d, m, s } (degrees, minutes, seconds).
   */
  function degToDms(deg) {
    const sign = deg < 0 ? -1 : 1;
    let x = Math.abs(deg);
    let d = Math.floor(x);
    let mFloat = (x - d) * 60;
    let m = Math.floor(mFloat);
    let s = (mFloat - m) * 60;
    s = Number(s.toFixed(2));
    if (s >= 60) {
      s -= 60;
      m += 1;
    }
    if (m >= 60) {
      m -= 60;
      d += 1;
    }
    return { d: sign * d, m, s };
  }

  /**
   * Format decimal degrees as "d° m′ s″" or "d° m′" when omitSeconds is true.
   */
  function formatDms(deg, omitSeconds) {
    const { d, m, s } = degToDms(deg);
    const signStr = d < 0 ? "-" : "";
    const absD = Math.abs(d);
    if (omitSeconds) {
      return signStr + absD + "° " + String(m) + "′";
    }
    return signStr + absD + "° " + String(m) + "′ " + s.toFixed(2) + "″";
  }

  /**
   * Rambam's correction table (מנת המסלול) 13:4 — mean anomaly (0–180°) → correction in degrees.
   * When distance from aphelion < 180°, true lags mean: real = average − this correction.
   */
  const TABLE_ROWS_13_4 = [
    { meanDeg: 10, rambamDeg: 20 / 60 },
    { meanDeg: 20, rambamDeg: 40 / 60 },
    { meanDeg: 30, rambamDeg: 58 / 60 },
    { meanDeg: 40, rambamDeg: 1 + 15 / 60 },
    { meanDeg: 50, rambamDeg: 1 + 29 / 60 },
    { meanDeg: 60, rambamDeg: 1 + 41 / 60 },
    { meanDeg: 70, rambamDeg: 1 + 51 / 60 },
    { meanDeg: 80, rambamDeg: 1 + 57 / 60 },
    { meanDeg: 90, rambamDeg: 1 + 59 / 60 },
    { meanDeg: 100, rambamDeg: 1 + 58 / 60 },
    { meanDeg: 110, rambamDeg: 1 + 53 / 60 },
    { meanDeg: 120, rambamDeg: 1 + 45 / 60 },
    { meanDeg: 130, rambamDeg: 1 + 33 / 60 },
    { meanDeg: 140, rambamDeg: 1 + 19 / 60 },
    { meanDeg: 150, rambamDeg: 1 + 1 / 60 },
    { meanDeg: 160, rambamDeg: 42 / 60 },
    { meanDeg: 170, rambamDeg: 21 / 60 },
    { meanDeg: 180, rambamDeg: 0 },
  ];

  /**
   * Rambam correction (מנת המסלול) by linear interpolation from the table (13:4).
   * Returns the correction in degrees. When distance from aphelion < 180°: real = average − this value.
   */
  function rambamCorrectionFromTable(meanAnomalyDeg) {
    const base = meanAnomalyDeg <= 180 ? meanAnomalyDeg : 360 - meanAnomalyDeg;
    const rows = TABLE_ROWS_13_4;
    if (base <= 0) return 0;
    if (base <= rows[0].meanDeg) {
      const t = base / rows[0].meanDeg;
      return t * rows[0].rambamDeg;
    }
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

  /**
   * Correction from eccentricity model: mean − true (equation of center).
   * Same formula as rambam-mean-sun anomalyForEccentricity.
   * When distance from aphelion < 180°: real = average − this value.
   */
  function rambamCorrectionFromEccentricity(meanAnomalyDeg, eccentricity) {
    const e = Number(eccentricity);
    if (!Number.isFinite(e) || e <= 0) return 0;
    const rad = (meanAnomalyDeg * Math.PI) / 180;
    const trueFromCentre = Math.atan2(
      Math.sin(rad),
      Math.cos(rad) + e
    );
    const correctionRad = rad - trueFromCentre;
    return (correctionRad * 180) / Math.PI;
  }

  // Target at 86°: 1° 58′ 23.52″ (used to scale the table and for exact eccentricity)
  const CORRECTION_86_TARGET_DEG = 1 + 58 / 60 + 23.52 / 3600;
  const TABLE_86 = rambamCorrectionFromTable(86);
  const SUN_CORRECTION_SCALE = 1;

  // Eccentricity for exact (non-Rambam) correction so that at 86° we get 1° 58′ 23.52″
  const ECCENTRICITY_SUN = (function () {
    const target = CORRECTION_86_TARGET_DEG;
    let lo = 0.01;
    let hi = 0.05;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      const c = rambamCorrectionFromEccentricity(86, mid);
      if (c < target) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  })();

  /**
   * Rambam sun correction (used in sun-calc).
   * @param {number} meanAnomalyDeg - distance of average from aphelion (0–360)
   * @param {boolean} [useRambamTable=true] - if true, use Rambam table (13:4) with distance rounded to nearest degree; if false, use exact eccentricity model
   * Returns positive magnitude. When distance from aphelion < 180°: real = average − this value; when ≥ 180°: real = average + this value.
   */
  function rambamSunCorrection(meanAnomalyDeg, useRambamTable) {
    if (useRambamTable === undefined) useRambamTable = true;
    const base = meanAnomalyDeg <= 180 ? meanAnomalyDeg : 360 - meanAnomalyDeg;
    if (useRambamTable) {
      const roundedDeg = Math.round(base);
      return rambamCorrectionFromTable(roundedDeg) * SUN_CORRECTION_SCALE;
    }
    return rambamCorrectionFromEccentricity(base, ECCENTRICITY_SUN);
  }

  // Self-test: at 86° the correction should be 1° 58′ 23.52″ (Rambam and exact)
  (function assert86() {
    const c86Rambam = rambamSunCorrection(86, true);
    const c86Exact = rambamSunCorrection(86, false);
    const expected = CORRECTION_86_TARGET_DEG;
    const tol = 0.0001;
    if (Math.abs(c86Rambam - expected) > tol) {
      console.warn(
        "RambamHelpers: Rambam correction at 86° should be 1° 58′ 23.52″; got",
        formatDms(c86Rambam),
        "(",
        c86Rambam.toFixed(6),
        "deg)"
      );
    }
    if (Math.abs(c86Exact - expected) > tol) {
      console.warn(
        "RambamHelpers: exact correction at 86° should be 1° 58′ 23.52″; got",
        formatDms(c86Exact),
        "(",
        c86Exact.toFixed(6),
        "deg)"
      );
    }
  })();

  const RambamHelpers = {
    mod360,
    degToDms,
    formatDms,
    TABLE_ROWS_13_4,
    rambamCorrectionFromTable,
    rambamCorrectionFromEccentricity,
    rambamSunCorrection,
  };

  global.RambamHelpers = RambamHelpers;
})(typeof window !== "undefined" ? window : globalThis);
