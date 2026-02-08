// moon.js
// Real moon computations: new moon, full moon times (mean conjunction/opposition).
// Formula from Jean Meeus / Chapront et al. via Peters: mean new moon to ~14h accuracy;
// periodic perturbations add up to ±14h. For minute-level accuracy, use external data or full Meeus corrections.

(function (global) {
  "use strict";

  // JD of 2000-01-01 00:00 UT (noon 2000-01-01 = 2451545.0, so midnight = 2451544.5)
  const JD_2000_UT = 2451544.5;

  // Mean new moon: days since 2000-01-01 00:00 TT (Terrestrial Time)
  // d = 5.597661 + 29.5305888610*N + 102.026e-12*N^2  (Peters / Chapront et al. 2002)
  // UT correction: -0.000739 - 235e-12*N^2 days
  const NEW_MOON_D0_TT = 5.597661;
  const LUNATION_DAYS = 29.5305888610;
  const NEW_MOON_Q_TT = 102.026e-12;
  const UT_OFFSET = 0.000739;
  const UT_Q = 235e-12;

  // Hebrew month length: 29d 12h 793 parts = 765433/1080 hours = 765433/25920 days
  const HEBREW_MONTH_DAYS = 765433 / 25920;

  /**
   * Mean new moon time for lunation N (UT).
   * N=0 is the first new moon in the year 2000 (Jan 6, 2000 ~18:14 UT).
   * @param {number} N - lunation number (integer)
   * @returns {number} Julian Date (UT)
   */
  function newMoonJD(N) {
    N = Number(N) || 0;
    var dTT = NEW_MOON_D0_TT + LUNATION_DAYS * N + NEW_MOON_Q_TT * N * N;
    var dUT = -UT_OFFSET - UT_Q * N * N;
    return JD_2000_UT + dTT + dUT;
  }

  /**
   * Mean full moon time for lunation N (UT). Same formula, offset by half lunation.
   * @param {number} N - lunation number (integer)
   * @returns {number} Julian Date (UT)
   */
  function fullMoonJD(N) {
    return newMoonJD(N) + LUNATION_DAYS / 2;
  }

  /**
   * Julian Date to Date (UTC).
   * @param {number} jd - Julian Date
   * @returns {Date}
   */
  function jdToDate(jd) {
    var ms = (jd - 2440587.5) * 86400 * 1000;
    return new Date(Math.round(ms));
  }

  /**
   * Date to Julian Date (UTC).
   * @param {Date} d
   * @returns {number}
   */
  function dateToJD(d) {
    d = d instanceof Date ? d : new Date(d);
    return d.getTime() / 86400000 + 2440587.5;
  }

  /**
   * Lunation number for a given date (approximate): which lunation N is this date in?
   * N=0 is first new moon of 2000. Returns integer so that newMoonJD(N) <= date < newMoonJD(N+1).
   * @param {Date} d
   * @returns {number}
   */
  function lunationNumber(d) {
    d = d instanceof Date ? d : new Date(d);
    var jd = dateToJD(d);
    var n = (jd - JD_2000_UT - NEW_MOON_D0_TT + UT_OFFSET) / LUNATION_DAYS;
    return Math.floor(n);
  }

  /**
   * Moon phase at a given date: "new", "waxing", "full", "waning" (rough).
   * @param {Date} d
   * @returns {{ phase: string, ageDays: number, nextNew: Date, nextFull: Date }}
   */
  function phaseAt(d) {
    d = d instanceof Date ? d : new Date(d);
    var jd = dateToJD(d);
    var N = Math.floor((jd - JD_2000_UT - NEW_MOON_D0_TT + UT_OFFSET) / LUNATION_DAYS);
    var jdNew = newMoonJD(N);
    if (jd < jdNew) {
      N -= 1;
      jdNew = newMoonJD(N);
    }
    var ageDays = jd - jdNew;
    var nextNew = jdToDate(newMoonJD(N + 1));
    var nextFull = jdToDate(fullMoonJD(ageDays > LUNATION_DAYS / 2 ? N + 1 : N));
    var phase =
      ageDays < 1 ? "new" :
      ageDays < LUNATION_DAYS / 2 ? "waxing" :
      ageDays < LUNATION_DAYS / 2 + 1 ? "full" : "waning";
    return { phase, ageDays, nextNew, nextFull };
  }

  /**
   * Definition month length (29d 12h 793 parts) in days.
   * @returns {number}
   */
  function hebrewMonthDays() {
    return HEBREW_MONTH_DAYS;
  }

  /**
   * For graph: actual new moon JD minus definition (29d 12h 793h from same epoch at N=0).
   * Y = (actual_JD(N) - definition_JD(N)) * 24  in hours.
   * definition_JD(N) = newMoonJD(0) + N * HEBREW_MONTH_DAYS.
   * @param {number} N - lunation number
   * @returns {{ jd: number, definitionJD: number, hoursLater: number }}
   */
  function newMoonVsDefinition(N) {
    var jd = newMoonJD(N);
    var definitionEpoch = newMoonJD(0);
    var definitionJD = definitionEpoch + N * HEBREW_MONTH_DAYS;
    var hoursLater = (jd - definitionJD) * 24;
    return { jd, definitionJD, hoursLater };
  }

  /**
   * Series for last M months: lunation indices and hours-later values for the graph.
   * @param {number} countMonths - e.g. 50
   * @param {number} [endLunation] - last lunation (default: current)
   * @returns {{ lunations: number[], hoursLater: number[], labels: string[] }}
   */
  function newMoonVsDefinitionSeries(countMonths, endLunation) {
    var now = lunationNumber(new Date());
    var end = endLunation != null ? endLunation : now;
    var start = end - countMonths + 1;
    return newMoonVsDefinitionRange(start, end);
  }

  /**
   * Series for lunation range [startN, endN] (inclusive).
   * @param {number} startN - first lunation
   * @param {number} endN - last lunation
   * @returns {{ lunations: number[], hoursLater: number[], labels: string[] }}
   */
  function newMoonVsDefinitionRange(startN, endN) {
    var lunations = [];
    var hoursLater = [];
    var labels = [];
    for (var N = startN; N <= endN; N++) {
      var v = newMoonVsDefinition(N);
      lunations.push(N);
      hoursLater.push(v.hoursLater);
      labels.push(String(N));
    }
    return { lunations, hoursLater, labels };
  }

  const Moon = {
    newMoonJD,
    fullMoonJD,
    jdToDate,
    dateToJD,
    lunationNumber,
    phaseAt,
    hebrewMonthDays,
    newMoonVsDefinition,
    newMoonVsDefinitionSeries,
    newMoonVsDefinitionRange,
    JD_2000_UT,
    LUNATION_DAYS,
    HEBREW_MONTH_DAYS,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Moon;
  }
  global.Moon = Moon;
})(typeof window !== "undefined" ? window : globalThis);
