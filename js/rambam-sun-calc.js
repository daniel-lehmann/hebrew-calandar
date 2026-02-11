// rambam-sun-calc.js
// Sun position from epoch (Thursday Nisan 3 4938 0h) — mean place, aphelion, anomaly, true place.
// direction_prompts/rambam4.txt
// Depends on: RambamHelpers, HebrewCore

(function (global) {
  const H = global.RambamHelpers;
  if (!H) throw new Error("RambamSunCalc requires RambamHelpers");

  const RambamSunCalc = (function () {
    let initialized = false;

    const EPOCH_YEAR = 4938;
    const EPOCH_MONTH = "Nisan";
    const EPOCH_DAY = 3;

    const SUN_AVERAGE_AT_EPOCH_DEG = 7 + 3 / 60 + 32 / 3600;
    const APHELION_AT_EPOCH_DEG = 86 + 45 / 60 + 8 / 3600;
    const DAILY_MEAN_DEG = 0.9856472222222222;
    const DAILY_APHELION_DEG = 1.5 / 3600 / 10;

    function mod360(deg) {
      return H.mod360(deg);
    }

    function formatDms(deg, omitSeconds) {
      return H.formatDms(deg, omitSeconds);
    }

    function daysFromEpoch(hebrewYear, hebrewMonth, hebrewDay, hebrewHour) {
      const core = global.HebrewCore;
      if (!core) return null;
      let epochAbs, targetAbs;
      try {
        epochAbs = core.absoluteFromHebrew(EPOCH_YEAR, EPOCH_MONTH, EPOCH_DAY);
        targetAbs = core.absoluteFromHebrew(hebrewYear, hebrewMonth, hebrewDay);
      } catch (err) {
        return null;
      }
      const h = Number.isFinite(hebrewHour) ? hebrewHour : 0;
      return (targetAbs - epochAbs) + h / 24;
    }

    function compute(days, useRambamTable) {
      if (useRambamTable === undefined) useRambamTable = true;
      const meanMotion = days * DAILY_MEAN_DEG;
      const aphelionMotion = days * DAILY_APHELION_DEG;

      const sunAveragePlace = mod360(SUN_AVERAGE_AT_EPOCH_DEG + meanMotion);
      const aphelionPlace = mod360(APHELION_AT_EPOCH_DEG + aphelionMotion);
      let distanceFromAphelion = mod360(sunAveragePlace - aphelionPlace);

      if (useRambamTable) {
        distanceFromAphelion = Math.round(distanceFromAphelion);
        if (distanceFromAphelion >= 360) distanceFromAphelion = 0;
      }

      const correction = H.rambamSunCorrection(distanceFromAphelion, useRambamTable);
      const realPlace = mod360(
        distanceFromAphelion < 180
          ? sunAveragePlace - correction
          : sunAveragePlace + correction
      );

      return {
        sunAveragePlace,
        aphelionPlace,
        distanceFromAphelion,
        realPlace,
        correction,
      };
    }

    function buildMonthOptions(year) {
      const core = global.HebrewCore;
      if (!core || !core.yearMonths) return [];
      const y = Number(year);
      if (!Number.isFinite(y) || y < 1 || y > 9999) return [];
      try {
        const months = core.yearMonths(y);
        return months.map(function (m) {
          return { value: m.name, label: m.name };
        });
      } catch (err) {
        return [];
      }
    }

    function initPanel() {
      if (initialized) return;
      initialized = true;

      const core = global.HebrewCore;
      if (!core) return;

      const yearInput = document.getElementById("rambam-calc-year");
      const monthSelect = document.getElementById("rambam-calc-month");
      const dayInput = document.getElementById("rambam-calc-day");
      const hourSelect = document.getElementById("rambam-calc-hour");
      const useRambamCb = document.getElementById("rambam-calc-use-rambam");
      const outputBlock = document.getElementById("rambam-calc-output");

      if (!yearInput || !monthSelect || !dayInput || !hourSelect || !outputBlock) return;

      function getSelectedDate() {
        var y = Number(yearInput.value);
        var m = monthSelect.value;
        var d = Number(dayInput.value);
        var h = hourSelect.value === "" ? 0 : Number(hourSelect.value);
        if (!Number.isFinite(y)) y = EPOCH_YEAR;
        if (!m) m = "Tammuz";
        if (!Number.isFinite(d)) d = 14;
        return { year: y, month: m, day: d, hour: h };
      }

      function updateMonthOptions() {
        var y = Number(yearInput.value);
        if (!Number.isFinite(y) || y < 1 || y > 9999) {
          y = EPOCH_YEAR;
          yearInput.value = String(y);
        }
        var opts = buildMonthOptions(y);
        var cur = monthSelect.value;
        monthSelect.innerHTML = "";
        for (var i = 0; i < opts.length; i++) {
          var o = opts[i];
          var opt = document.createElement("option");
          opt.value = o.value;
          opt.textContent = o.label;
          if (o.value === cur) opt.selected = true;
          monthSelect.appendChild(opt);
        }
        if (!monthSelect.value && opts.length) {
          monthSelect.value = opts[0].value;
        }
        if (y === 4938 && opts.length) {
          var hasTammuz = opts.some(function (o) { return o.value === "Tammuz"; });
          if (hasTammuz) monthSelect.value = "Tammuz";
        }
      }

      function run() {
        var sel = getSelectedDate();
        var days = daysFromEpoch(sel.year, sel.month, sel.day, sel.hour);
        if (days == null) {
          outputBlock.innerHTML = "<p class=\"rambam-calc-error\">Invalid Hebrew date.</p>";
          return;
        }
        var useRambamTable = useRambamCb ? useRambamCb.checked : true;
        var result = compute(days, useRambamTable);
        var timeStr = days >= 0
          ? days.toFixed(4) + " days after epoch"
          : Math.abs(days).toFixed(4) + " days before epoch";
        outputBlock.innerHTML =
          "<p><strong>Time from epoch:</strong> " + timeStr + "</p>" +
          "<table class=\"rambam-calc-table\">" +
          "<tr><th>Quantity</th><th>Value (d° m′ s″)</th></tr>" +
          "<tr><td>Sun average place</td><td>" + formatDms(result.sunAveragePlace) + "</td></tr>" +
          "<tr><td>Aphelion place</td><td>" + formatDms(result.aphelionPlace) + "</td></tr>" +
          "<tr><td>Distance of average from aphelion</td><td>" + formatDms(result.distanceFromAphelion) + "</td></tr>" +
          "<tr><td>Real place of sun</td><td>" + formatDms(result.realPlace) + "</td></tr>" +
          "</table>";
      }

      yearInput.addEventListener("change", updateMonthOptions);
      yearInput.addEventListener("input", updateMonthOptions);
      monthSelect.addEventListener("change", run);
      dayInput.addEventListener("change", run);
      hourSelect.addEventListener("change", run);
      if (useRambamCb) useRambamCb.addEventListener("change", run);

      updateMonthOptions();
      run();
    }

    return {
      daysFromEpoch: daysFromEpoch,
      compute: compute,
      formatDms: formatDms,
      buildMonthOptions: buildMonthOptions,
      initPanel: initPanel,
      EPOCH_YEAR: EPOCH_YEAR,
      EPOCH_MONTH: EPOCH_MONTH,
      EPOCH_DAY: EPOCH_DAY,
    };
  })();

  global.RambamSunCalc = RambamSunCalc;
})(typeof window !== "undefined" ? window : globalThis);
