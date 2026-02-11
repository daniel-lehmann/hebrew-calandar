// main.js
// Wires together the view layer, core logic, stats and a minimal API.

(function (global) {
  const HebrewCore = () => global.HebrewCore;
  let holidayLineChart = null;
  let tishreiHistChart = null;
  let moonLineChart = null;
  const DEFAULT_GRAPH_YEARS = 50;
  const MAX_VISIBLE_POINTS = 50; // points shown at once; slider if total > this
  const MOON_GRAPH_DEFAULT_YEARS = 30;
  const MOON_GRAPH_FULL_DISPLAY_MAX_YEARS = 30;
  const MOON_GRAPH_LINES_ONLY_DEFAULT_YEARS = 2000;
  const MOON_GRAPH_LINES_ONLY_POINTS = 50;

  function hebrewDateFromGregorian(gYear, gMonthIndex, gDay) {
    const core = HebrewCore();
    if (!core) {
      return { hebrewDay: gDay, hebrewMonthName: "", hebrewYear: 0 };
    }
    const h = core.gregorianToHebrew(gYear, gMonthIndex, gDay);
    return {
      hebrewDay: h.hebrewDay,
      hebrewMonthName: h.hebrewMonthName,
      hebrewYear: h.hebrewYear,
    };
  }

  /* ---------- helpers ---------- */

  /** Hide every .stats-panel, then show the one with the given id (toggle). */
  function togglePanel(id) {
    const panels = document.querySelectorAll(".stats-panel");
    panels.forEach((p) => {
      if (p.id === id) {
        p.style.display = p.style.display === "none" ? "block" : "none";
      } else {
        p.style.display = "none";
      }
    });
  }

  /* ---------- main setup ---------- */

  function setupUI() {
    /* --- Calendar controls --- */
    const monthSelect = document.getElementById("month-select");
    const yearInput = document.getElementById("year-input");
    const goButton = document.getElementById("go-button");
    const combinedContainer = document.getElementById("combined-calendar");

    /* --- Hebrew view controls --- */
    const gregMonthGroup = document.getElementById("greg-month-group");
    const gregYearGroup = document.getElementById("greg-year-group");
    const hebMonthGroup = document.getElementById("heb-month-group");
    const hebYearGroup = document.getElementById("heb-year-group");
    const hebMonthSelect = document.getElementById("heb-month-select");
    const hebYearInput = document.getElementById("heb-year-input");
    const btnViewToggle = document.getElementById("btn-view-toggle");
    const calendarHeading = document.getElementById("calendar-heading");

    /* --- Calendar nav arrows --- */
    const btnPrevYear = document.getElementById("btn-prev-year");
    const btnPrevMonth = document.getElementById("btn-prev-month");
    const btnNextMonth = document.getElementById("btn-next-month");
    const btnNextYear = document.getElementById("btn-next-year");

    let isHebrewView = false;

    /* --- Stat buttons --- */
    const btnTishreiList = document.getElementById("btn-tishrei-list");
    const btnTishreiHist = document.getElementById("btn-tishrei-hist");
    const btnHolidayGraphToggle = document.getElementById("btn-holiday-graph-toggle");
    const btnRambamMeanSun = document.getElementById("btn-rambam-mean-sun");
    const statsOutput = document.getElementById("stats-output");

    /* --- List Hebrew date panel --- */
    const panelTishreiList = document.getElementById("panel-tishrei-list");
    const tishreiYearsInput = document.getElementById("tishrei-years-input");
    const hebrewDateKind = document.getElementById("hebrew-date-kind");
    const hebrewHolidaySelect = document.getElementById("hebrew-holiday-select");
    const hebrewMonthSelect = document.getElementById("hebrew-month-select");
    const hebrewDayInput = document.getElementById("hebrew-day-input");
    const btnTishreiListRun = document.getElementById("btn-tishrei-list-run");

    /* --- Holiday line graph panel --- */
    const panelHolidayGraph = document.getElementById("panel-holiday-graph");
    const holidaySelect = document.getElementById("holiday-select");
    const holidayYearsInput = document.getElementById("holiday-years-input");
    const btnHolidayGraph = document.getElementById("btn-holiday-graph");
    const holidayRangeControls = document.getElementById("holiday-range-controls");
    const yearRangeSlider = document.getElementById("year-range-slider");
    const yearRangeLabel = document.getElementById("year-range-label");
    const holidayLineCanvas = document.getElementById("holiday-line-chart");
    const holidayChartWrapper = document.getElementById("holiday-chart-wrapper");

    /* --- Cycle mode elements --- */
    const btnCycleMode = document.getElementById("btn-cycle-mode");
    const cycleControls = document.getElementById("cycle-controls");
    const cycleCheckboxesDiv = document.getElementById("cycle-checkboxes");
    const btnCycleGraph = document.getElementById("btn-cycle-graph");

    /* --- Moon graph panel --- */
    const btnMoonGraphToggle = document.getElementById("btn-moon-graph-toggle");
    const panelMoonGraph = document.getElementById("panel-moon-graph");
    const moonLinesOnlyCb = document.getElementById("moon-lines-only-cb");
    const moonYearsInput = document.getElementById("moon-years-input");
    const moonYearsSlider = document.getElementById("moon-years-slider");
    const moonChartWrapper = document.getElementById("moon-chart-wrapper");
    const moonChartMonthLengthsEl = document.getElementById("moon-chart-month-lengths");
    const moonLineCanvas = document.getElementById("moon-line-chart");

    /* --- Dehiyyot stats panel --- */
    const btnDehiyyotStats = document.getElementById("btn-dehiyyot-stats");
    const panelDehiyyot = document.getElementById("panel-dehiyyot");
    const dehiyyotYearsInput = document.getElementById("dehiyyot-years-input");
    const btnDehiyyotRun = document.getElementById("btn-dehiyyot-run");
    const dehiyyotResults = document.getElementById("dehiyyot-results");
    const dehiyyotTimeline = document.getElementById("dehiyyot-timeline");

    /* --- Rambam mean sun panel --- */
    const panelRambamMeanSun = document.getElementById("panel-rambam-mean-sun");

    /* --- Rambam sun calc (from epoch) panel --- */
    const btnRambamSunCalc = document.getElementById("btn-rambam-sun-calc");
    const panelRambamSunCalc = document.getElementById("panel-rambam-sun-calc");

    const CYCLE_COLORS = [
      "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
      "#22c55e", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6",
      "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
      "#f43f5e", "#fb7185", "#fda4af", "#94a3b8",
    ];

    // Generate "Select All" + 19 checkboxes for cycle years
    var cycleSelectAllCb = null;

    if (cycleCheckboxesDiv) {
      // Select-all checkbox (tri-state)
      var allLbl = document.createElement("label");
      allLbl.className = "cycle-label cycle-label-all";
      cycleSelectAllCb = document.createElement("input");
      cycleSelectAllCb.type = "checkbox";
      cycleSelectAllCb.className = "cycle-cb-all";
      cycleSelectAllCb.indeterminate = true; // starts with 1 of 19 selected
      allLbl.appendChild(cycleSelectAllCb);
      allLbl.appendChild(document.createTextNode(" All"));
      cycleCheckboxesDiv.appendChild(allLbl);

      // Individual cycle-year checkboxes
      for (var ci = 1; ci <= 19; ci++) {
        var lbl = document.createElement("label");
        lbl.className = "cycle-label";
        var cb = document.createElement("input");
        cb.type = "checkbox";
        cb.className = "cycle-cb";
        cb.value = String(ci);
        if (ci === 1) cb.checked = true;
        lbl.appendChild(cb);
        lbl.appendChild(document.createTextNode(" " + ci));
        cycleCheckboxesDiv.appendChild(lbl);
      }

      // Sync the select-all checkbox whenever an individual checkbox changes
      function syncSelectAll() {
        var cbs = cycleCheckboxesDiv.querySelectorAll(".cycle-cb");
        var total = cbs.length;
        var checked = 0;
        cbs.forEach(function (c) { if (c.checked) checked++; });

        if (checked === 0) {
          cycleSelectAllCb.checked = false;
          cycleSelectAllCb.indeterminate = false;
        } else if (checked === total) {
          cycleSelectAllCb.checked = true;
          cycleSelectAllCb.indeterminate = false;
        } else {
          cycleSelectAllCb.checked = false;
          cycleSelectAllCb.indeterminate = true;
        }
      }

      // Listen on each individual checkbox
      cycleCheckboxesDiv.addEventListener("change", function (e) {
        if (e.target.classList.contains("cycle-cb")) {
          syncSelectAll();
        }
      });

      // Select-all click: if indeterminate or unchecked → check all; if checked → uncheck all
      cycleSelectAllCb.addEventListener("change", function () {
        var setTo = cycleSelectAllCb.checked; // browser already toggled it
        cycleCheckboxesDiv.querySelectorAll(".cycle-cb").forEach(function (c) {
          c.checked = setTo;
        });
        cycleSelectAllCb.indeterminate = false;
      });
    }

    /* --- Day-of-week histogram panel --- */
    const tishreiHistCanvas = document.getElementById("tishrei-hist-chart");
    const tishreiChartWrapper = document.getElementById("tishrei-chart-wrapper");
    const histKind = document.getElementById("hist-kind");
    const histHolidaySelect = document.getElementById("hist-holiday-select");
    const histMonthSelect = document.getElementById("hist-month-select");
    const histDayInput = document.getElementById("hist-day-input");
    const btnHistRun = document.getElementById("btn-hist-run");

    /* ========================== Calendar ========================== */

    global.View.populateMonthSelector(monthSelect);
    const today = new Date();
    monthSelect.value = String(today.getMonth());
    yearInput.value = String(today.getFullYear());

    // Initialise Hebrew view controls with today's Hebrew date
    const todayHeb = hebrewDateFromGregorian(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    if (hebYearInput) hebYearInput.value = String(todayHeb.hebrewYear || 5786);
    if (hebMonthSelect) {
      global.View.populateHebrewMonthSelector(
        hebMonthSelect,
        todayHeb.hebrewYear || 5786
      );
      hebMonthSelect.value = todayHeb.hebrewMonthName || "Tishrey";
    }

    function handleHolidayNav(hebrewYear, monthName, startDay, direction) {
      const core = HebrewCore();
      if (!core) return;
      var targetYear = hebrewYear + direction;

      if (isHebrewView) {
        // Stay in Hebrew view — update Hebrew year and month
        if (hebYearInput) hebYearInput.value = String(targetYear);
        if (hebMonthSelect) {
          global.View.populateHebrewMonthSelector(hebMonthSelect, targetYear);
          hebMonthSelect.value = monthName;
        }
        renderCurrent();
      } else {
        try {
          var g = core.gregorianFromHebrew(targetYear, monthName, startDay);
          monthSelect.value = String(g.monthIndex);
          yearInput.value = String(g.year);
          renderCurrent();
        } catch (e) {
          // Holiday may not exist in target year (e.g. Adar in non-leap)
        }
      }
    }

    function renderCurrent() {
      if (isHebrewView) {
        var hy = Number(hebYearInput ? hebYearInput.value : 0) || 5786;
        var hm = (hebMonthSelect && hebMonthSelect.value) ? hebMonthSelect.value : "Tishrey";
        if (calendarHeading) {
          calendarHeading.textContent =
            hm + " " + hy + " (Hebrew + Gregorian)";
        }
        global.View.renderHebrewMonthCalendar(
          combinedContainer,
          hy,
          hm,
          handleHolidayNav
        );
      } else {
        var year = Number(yearInput.value) || today.getFullYear();
        var monthIndex = Number(monthSelect.value) || 0;
        if (calendarHeading) {
          calendarHeading.textContent = "Month view (Gregorian + Hebrew)";
        }
        global.View.renderCombinedCalendar(
          combinedContainer,
          year,
          monthIndex,
          hebrewDateFromGregorian,
          handleHolidayNav
        );
      }
    }

    goButton.addEventListener("click", renderCurrent);
    monthSelect.addEventListener("change", renderCurrent);
    yearInput.addEventListener("change", renderCurrent);

    /* --- Calendar nav arrows --- */

    function stepGregorianMonth(delta) {
      var m = Number(monthSelect.value) || 0;
      var y = Number(yearInput.value) || today.getFullYear();
      m += delta;
      while (m < 0)  { m += 12; y--; }
      while (m > 11) { m -= 12; y++; }
      monthSelect.value = String(m);
      yearInput.value = String(y);
      renderCurrent();
    }

    function stepGregorianYear(delta) {
      var y = Number(yearInput.value) || today.getFullYear();
      yearInput.value = String(y + delta);
      renderCurrent();
    }

    function stepHebrewMonth(delta) {
      var core = HebrewCore();
      if (!core) return;
      var hy = Number(hebYearInput.value) || 5786;
      var months = core.yearMonths(hy);
      var curName = hebMonthSelect ? hebMonthSelect.value : "Tishrey";
      var idx = 0;
      for (var i = 0; i < months.length; i++) {
        if (months[i].name === curName) { idx = i; break; }
      }
      idx += delta;
      if (idx < 0) {
        // Go to previous Hebrew year, last month
        hy--;
        months = core.yearMonths(hy);
        idx = months.length - 1;
      } else if (idx >= months.length) {
        // Go to next Hebrew year, first month
        hy++;
        months = core.yearMonths(hy);
        idx = 0;
      }
      hebYearInput.value = String(hy);
      global.View.populateHebrewMonthSelector(hebMonthSelect, hy);
      hebMonthSelect.value = months[idx].name;
      renderCurrent();
    }

    function stepHebrewYear(delta) {
      var core = HebrewCore();
      if (!core) return;
      var hy = Number(hebYearInput.value) || 5786;
      hy += delta;
      hebYearInput.value = String(hy);
      global.View.populateHebrewMonthSelector(hebMonthSelect, hy);
      renderCurrent();
    }

    function navMonth(delta) {
      if (isHebrewView) stepHebrewMonth(delta);
      else stepGregorianMonth(delta);
    }

    function navYear(delta) {
      if (isHebrewView) stepHebrewYear(delta);
      else stepGregorianYear(delta);
    }

    if (btnPrevYear)  btnPrevYear.addEventListener("click", function () { navYear(-1); });
    if (btnPrevMonth) btnPrevMonth.addEventListener("click", function () { navMonth(-1); });
    if (btnNextMonth) btnNextMonth.addEventListener("click", function () { navMonth(1); });
    if (btnNextYear)  btnNextYear.addEventListener("click", function () { navYear(1); });

    if (hebMonthSelect) hebMonthSelect.addEventListener("change", renderCurrent);
    if (hebYearInput) {
      hebYearInput.addEventListener("change", function () {
        // Repopulate months for the new year (leap year handling)
        var hy = Number(hebYearInput.value) || 5786;
        global.View.populateHebrewMonthSelector(hebMonthSelect, hy);
        renderCurrent();
      });
    }

    /* --- View toggle --- */
    function showGregControls() {
      if (gregMonthGroup) gregMonthGroup.style.display = "flex";
      if (gregYearGroup) gregYearGroup.style.display = "flex";
      if (hebMonthGroup) hebMonthGroup.style.display = "none";
      if (hebYearGroup) hebYearGroup.style.display = "none";
      if (btnViewToggle) btnViewToggle.textContent = "Hebrew View";
    }

    function showHebControls() {
      if (gregMonthGroup) gregMonthGroup.style.display = "none";
      if (gregYearGroup) gregYearGroup.style.display = "none";
      if (hebMonthGroup) hebMonthGroup.style.display = "flex";
      if (hebYearGroup) hebYearGroup.style.display = "flex";
      if (btnViewToggle) btnViewToggle.textContent = "Gregorian View";
    }

    if (btnViewToggle) {
      btnViewToggle.addEventListener("click", function () {
        var core = HebrewCore();
        isHebrewView = !isHebrewView;

        if (isHebrewView) {
          // Switching TO Hebrew view — figure out current Hebrew month/year
          // from whatever the Gregorian controls show
          if (core) {
            try {
              var gYear = Number(yearInput.value) || today.getFullYear();
              var gMonth = Number(monthSelect.value) || 0;
              var h = core.gregorianToHebrew(gYear, gMonth, 15);
              if (hebYearInput) hebYearInput.value = String(h.hebrewYear);
              if (hebMonthSelect) {
                global.View.populateHebrewMonthSelector(hebMonthSelect, h.hebrewYear);
                hebMonthSelect.value = h.hebrewMonthName;
              }
            } catch (e) {
              // Fallback: use current Hebrew date
              if (hebYearInput) hebYearInput.value = String(todayHeb.hebrewYear || 5786);
              if (hebMonthSelect) {
                global.View.populateHebrewMonthSelector(hebMonthSelect, todayHeb.hebrewYear || 5786);
                hebMonthSelect.value = todayHeb.hebrewMonthName || "Tishrey";
              }
            }
          }
          showHebControls();
        } else {
          // Switching TO Gregorian view — figure out Gregorian month/year
          // from the Hebrew controls
          if (core) {
            try {
              var hy = Number(hebYearInput.value) || 5786;
              var hm = hebMonthSelect ? hebMonthSelect.value : "Tishrey";
              var g = core.gregorianFromHebrew(hy, hm, 15);
              yearInput.value = String(g.year);
              monthSelect.value = String(g.monthIndex);
            } catch (e) {
              // Keep current Gregorian values
            }
          }
          showGregControls();
        }

        renderCurrent();
      });
    }

    /* ==================== Search popup ============================ */

    if (global.Search && global.Search.setupSearch) {
      var controlsSection = document.querySelector("section.controls");
      global.Search.setupSearch({
        core: global.HebrewCore,
        buttonParent: controlsSection,
        onSelect: function (result) {
          if (isHebrewView && result.hebrewYear && result.hebrewMonthName) {
            // Navigate in Hebrew view
            if (hebYearInput) hebYearInput.value = String(result.hebrewYear);
            if (hebMonthSelect) {
              global.View.populateHebrewMonthSelector(hebMonthSelect, result.hebrewYear);
              hebMonthSelect.value = result.hebrewMonthName;
            }
          } else {
            // Navigate in Gregorian view
            if (isHebrewView) {
              isHebrewView = false;
              showGregControls();
            }
            if (result.gregYear != null) yearInput.value = String(result.gregYear);
            if (result.gregMonthIndex != null) monthSelect.value = String(result.gregMonthIndex);
          }
          renderCurrent();
        },
      });
    }

    /* ==================== Populate dropdowns ====================== */

    if (global.HebrewCore) {
      const holidays = global.HebrewCore.HEBREW_HOLIDAYS || [];
      holidays.forEach((h) => {
        [holidaySelect, hebrewHolidaySelect, histHolidaySelect].forEach((sel) => {
          if (sel) {
            var opt = document.createElement("option");
            opt.value = h.name;
            opt.textContent = h.name;
            sel.appendChild(opt);
          }
        });
      });

      const months = global.HebrewCore.HEBREW_MONTHS || [];
      [hebrewMonthSelect, histMonthSelect].forEach((sel) => {
        if (sel) {
          sel.innerHTML = "";
          months.forEach((m) => {
            var opt = document.createElement("option");
            opt.value = m;
            opt.textContent = m;
            sel.appendChild(opt);
          });
        }
      });
    }

    /* ====================== Stat buttons ========================== */

    const btnStatsBack = document.getElementById("btn-stats-back");
    const allStatBtns = document.querySelectorAll(".stat-btn");

    /** Show only the clicked stat button + back; hide the rest. */
    function activateStat(activeBtn) {
      allStatBtns.forEach(function (b) {
        b.style.display = b === activeBtn ? "" : "none";
      });
      if (btnStatsBack) btnStatsBack.style.display = "";
    }

    /** Restore all stat buttons, hide back, close panels/charts/output. */
    function deactivateStat() {
      allStatBtns.forEach(function (b) { b.style.display = ""; });
      if (btnStatsBack) btnStatsBack.style.display = "none";
      togglePanel(""); // close all panels
      statsOutput.textContent = "";
      if (holidayChartWrapper) holidayChartWrapper.style.display = "none";
      if (tishreiChartWrapper) tishreiChartWrapper.style.display = "none";
      if (moonChartWrapper) moonChartWrapper.style.display = "none";
    }

    if (btnStatsBack) {
      btnStatsBack.addEventListener("click", deactivateStat);
    }

    /* ====================== Stat button wiring ========================= */

    // Run list Hebrew date by year (current selection)
    function runListStat() {
      const core = global.HebrewCore;
      if (!core) {
        if (statsOutput) statsOutput.textContent = "HebrewCore not loaded.";
        return;
      }
      let years =
        tishreiYearsInput && tishreiYearsInput.value
          ? Number(tishreiYearsInput.value)
          : 19;
      if (!Number.isFinite(years) || years <= 0) years = 19;
      if (years > 2000) years = 2000;
      const kind = hebrewDateKind ? hebrewDateKind.value : "holiday";
      let monthName, day, label;
      if (kind === "holiday" && hebrewHolidaySelect) {
        const holidayName = hebrewHolidaySelect.value;
        const holidays = core.HEBREW_HOLIDAYS || [];
        const holiday = holidays.find((h) => h.name === holidayName);
        if (!holiday) {
          if (statsOutput) statsOutput.textContent = "Unknown holiday: " + holidayName;
          return;
        }
        monthName = holiday.month;
        day = holiday.startDay;
        label = holiday.name;
      } else {
        monthName = hebrewMonthSelect ? hebrewMonthSelect.value : "Tishrey";
        day = hebrewDayInput ? Number(hebrewDayInput.value) : 1;
        if (!monthName || !day) {
          if (statsOutput) statsOutput.textContent = "Please choose a Hebrew month and day.";
          return;
        }
        label = day + " " + monthName;
      }
      if (statsOutput) {
        statsOutput.textContent = global.Stats.listHebrewDateYears(
          monthName,
          day,
          years,
          label
        );
      }
    }

    // "List Hebrew date by year" — toggle its panel and show data for current selection
    btnTishreiList.addEventListener("click", () => {
      activateStat(btnTishreiList);
      if (moonChartWrapper) moonChartWrapper.style.display = "none";
      togglePanel("panel-tishrei-list");
      runListStat();
    });

    // Toggle sub-fields based on date type
    if (hebrewDateKind) {
      function syncListDateFields() {
        var kind = hebrewDateKind.value;
        if (hebrewHolidaySelect) hebrewHolidaySelect.style.display = kind === "holiday" ? "" : "none";
        if (hebrewMonthSelect) hebrewMonthSelect.style.display = kind === "custom" ? "" : "none";
        if (hebrewDayInput) hebrewDayInput.style.display = kind === "custom" ? "" : "none";
      }
      hebrewDateKind.addEventListener("change", syncListDateFields);
      syncListDateFields(); // set initial state
    }

    if (btnTishreiListRun) {
      btnTishreiListRun.addEventListener("click", runListStat);
    }

    // Run day-of-week histogram (current selection)
    function runHistStat() {
      var core = global.HebrewCore;
      if (!core) return;
      var monthName, day, label;
      var kind = histKind ? histKind.value : "holiday";
      if (kind === "holiday" && histHolidaySelect) {
        var holidayName = histHolidaySelect.value;
        var holidays = core.HEBREW_HOLIDAYS || [];
        var holiday = holidays.find(function (h) { return h.name === holidayName; });
        if (!holiday) {
          if (statsOutput) statsOutput.textContent = "Unknown holiday: " + holidayName;
          return;
        }
        monthName = holiday.month;
        day = holiday.startDay;
        label = holiday.name;
      } else {
        monthName = histMonthSelect ? histMonthSelect.value : "Tishrey";
        day = histDayInput ? Number(histDayInput.value) : 1;
        if (!monthName || !day) {
          if (statsOutput) statsOutput.textContent = "Please choose a Hebrew month and day.";
          return;
        }
        label = day + " " + monthName;
      }
      if (statsOutput) statsOutput.textContent = "";
      var hist = global.Stats.weekdayHistogramData(monthName, day, label);
      if (!hist) return;
      if (tishreiChartWrapper) tishreiChartWrapper.style.display = "block";
      var ctx = tishreiHistCanvas.getContext("2d");
      if (tishreiHistChart) tishreiHistChart.destroy();
      tishreiHistChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: hist.labels,
          datasets: [
            {
              label: hist.label + " – day of week (last 2000 years)",
              data: hist.data,
              backgroundColor: "rgba(96, 165, 250, 0.6)",
              borderColor: "rgba(96, 165, 250, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              ticks: { color: "#e5e7eb" },
              grid: { color: "rgba(31, 41, 55, 0.5)" },
            },
            y: {
              beginAtZero: true,
              ticks: { color: "#e5e7eb" },
              grid: { color: "rgba(31, 41, 55, 0.5)" },
            },
          },
          plugins: {
            legend: { labels: { color: "#e5e7eb" } },
          },
        },
      });
    }

    // "Day-of-week histogram" — toggle its panel and show data for current selection
    btnTishreiHist.addEventListener("click", () => {
      activateStat(btnTishreiHist);
      if (moonChartWrapper) moonChartWrapper.style.display = "none";
      togglePanel("panel-hist");
      runHistStat();
    });

    if (histKind) {
      histKind.addEventListener("change", () => {
        var isCustom = histKind.value === "custom";
        if (histHolidaySelect) histHolidaySelect.style.display = isCustom ? "none" : "";
        if (histMonthSelect) histMonthSelect.style.display = isCustom ? "" : "none";
        if (histDayInput) histDayInput.style.display = isCustom ? "" : "none";
      });
    }

    if (btnHistRun) {
      btnHistRun.addEventListener("click", runHistStat);
    }

    // "Holiday line graph" — toggle its panel and show graph for current selection
    if (btnHolidayGraphToggle) {
      btnHolidayGraphToggle.addEventListener("click", () => {
        activateStat(btnHolidayGraphToggle);
        if (moonChartWrapper) moonChartWrapper.style.display = "none";
        togglePanel("panel-holiday-graph");
        if (btnHolidayGraph) btnHolidayGraph.click();
      });
    }

    // "Rambam mean sun (12:1)" — show explanation + precomputed table
    if (btnRambamMeanSun && panelRambamMeanSun) {
      btnRambamMeanSun.addEventListener("click", () => {
        activateStat(btnRambamMeanSun);
        if (moonChartWrapper) moonChartWrapper.style.display = "none";
        togglePanel("panel-rambam-mean-sun");
        if (global.RambamMeanSun && global.RambamMeanSun.initRambamPanel) {
          global.RambamMeanSun.initRambamPanel();
        }
      });
    }

    // "Rambam sun calc (from epoch)" — Hebrew date + time → time from epoch, 4 sun calculations
    if (btnRambamSunCalc && panelRambamSunCalc) {
      btnRambamSunCalc.addEventListener("click", () => {
        activateStat(btnRambamSunCalc);
        if (moonChartWrapper) moonChartWrapper.style.display = "none";
        togglePanel("panel-rambam-sun-calc");
        if (global.RambamSunCalc && global.RambamSunCalc.initPanel) {
          global.RambamSunCalc.initPanel();
        }
      });
    }

    let runMoonGraphRef = null;
    // "New moon vs 29d 12h 793h" — toggle panel and show graph
    if (btnMoonGraphToggle) {
      btnMoonGraphToggle.addEventListener("click", () => {
        activateStat(btnMoonGraphToggle);
        togglePanel("panel-moon-graph");
        if (runMoonGraphRef) setTimeout(runMoonGraphRef, 0);
      });
    }

    // "Dehiyyot (postponement) stats" — toggle its panel and show data for current selection
    if (btnDehiyyotStats) {
      btnDehiyyotStats.addEventListener("click", () => {
        activateStat(btnDehiyyotStats);
        if (moonChartWrapper) moonChartWrapper.style.display = "none";
        togglePanel("panel-dehiyyot");
        if (btnDehiyyotRun) btnDehiyyotRun.click();
      });
    }

    // Dehiyyot Run button (also invoked when panel opens)
    if (btnDehiyyotRun && dehiyyotResults && dehiyyotTimeline) {
      const DEHYYOT_NAMES = {
        A: "A (lo ADU — RH not Sun/Wed/Fri)",
        B: "B (Molad Zaken — molad ≥ noon)",
        C: "C (BeTU'TeKPaT — Mon after leap year)",
        D: "D (GaTRaD — Tue in common year)",
      };
      btnDehiyyotRun.addEventListener("click", () => {
        const years = dehiyyotYearsInput ? Math.max(1, Math.min(4000, Number(dehiyyotYearsInput.value) || 1000)) : 1000;
        const data = global.Stats && global.Stats.dehiyyotStatsData ? global.Stats.dehiyyotStatsData(years) : null;
        if (!data) {
          dehiyyotResults.innerHTML = "<p>HebrewCore or dehiyyot stats not available.</p>";
          dehiyyotTimeline.innerHTML = "";
          return;
        }
        const { rules, timeline, startYear, endYear, totalYears } = data;
        let html = "<table class=\"dehiyyot-table\"><thead><tr><th>Rule</th><th>Years used</th><th>Percent</th><th>Last used (year)</th><th>Next used (year)</th></tr></thead><tbody>";
        ["A", "B", "C", "D"].forEach((k) => {
          const r = rules[k];
          html += "<tr><td>" + DEHYYOT_NAMES[k] + "</td><td>" + r.count + "</td><td>" + r.percent + "%</td><td>" + (r.lastUsed != null ? r.lastUsed : "—") + "</td><td>" + (r.nextUsed != null ? r.nextUsed : "—") + "</td></tr>";
        });
        html += "</tbody></table>";
        html = "<p class=\"dehiyyot-summary\">Rosh Hashanah postponement rules (dehiyyot), " + totalYears + " Hebrew years (" + startYear + "–" + endYear + ").</p>" + html;
        dehiyyotResults.innerHTML = html;

        // Top visualization: year strip — each cell is one year; colored = rule was used
        const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        let tlHtml = "<p class=\"dehiyyot-viz-caption\">Each cell is one year. Colored = rule was used that year.</p>";
        tlHtml += "<div class=\"dehiyyot-viz\">";
        ["A", "B", "C", "D"].forEach((ruleKey) => {
          tlHtml += "<div class=\"dehiyyot-viz-row\"><span class=\"dehiyyot-viz-label\">" + ruleKey + "</span><div class=\"dehiyyot-viz-strip\">";
          timeline.forEach((t, idx) => {
            const used = t.rules[ruleKey];
            const title = t.year + " " + (used ? "used" : "") + " Tishrei 1: " + t.dateStr + " (" + WEEKDAY_LABELS[t.weekday] + ") — click to jump to calendar";
            const isLabelYear = idx % 50 === 0;
            const cellClass = "dehiyyot-year-cell" + (used ? " dehiyyot-used" : "") + (isLabelYear ? " dehiyyot-year-cell-label" : "");
            tlHtml += "<span class=\"" + cellClass + "\" data-year=\"" + t.year + "\" title=\"" + title + "\">" + (isLabelYear ? t.year : "") + "</span>";
          });
          tlHtml += "</div></div>";
        });
        tlHtml += "</div>";

        // Week strip per rule: day separators, color where the rule is effective
        tlHtml += "<p class=\"dehiyyot-week-caption\">Visualization of week: strip with day separators for each rule. Colored = when the rule is effective.</p>";
        tlHtml += "<div class=\"dehiyyot-week-rules\">";
        // A (lo ADU): color Sun(0), Wed(3), Fri(5)
        tlHtml += "<div class=\"dehiyyot-week-rule-row\"><span class=\"dehiyyot-viz-label\">A</span><div class=\"dehiyyot-week-rule-strip\">";
        for (let w = 0; w < 7; w++) {
          const effective = w === 0 || w === 3 || w === 5;
          tlHtml += "<span class=\"dehiyyot-day-cell" + (effective ? " dehiyyot-effective" : "") + "\" title=\"" + WEEKDAY_LABELS[w] + (effective ? " (rule applies)" : "") + "\">" + WEEKDAY_LABELS[w].slice(0, 1) + "</span>";
        }
        tlHtml += "</div></div>";
        // B (Molad Zaken): last quarter of each day (4 quarters per day)
        tlHtml += "<div class=\"dehiyyot-week-rule-row\"><span class=\"dehiyyot-viz-label\">B</span><div class=\"dehiyyot-week-rule-strip dehiyyot-quarters\">";
        for (let w = 0; w < 7; w++) {
          for (let q = 0; q < 4; q++) {
            const effective = q === 3;
            tlHtml += "<span class=\"dehiyyot-quarter" + (effective ? " dehiyyot-effective" : "") + "\" title=\"" + WEEKDAY_LABELS[w] + " " + (q + 1) + "/4" + (effective ? " (rule applies)" : "") + "\"></span>";
          }
          if (w < 6) tlHtml += "<span class=\"dehiyyot-day-sep\"></span>";
        }
        tlHtml += "</div></div>";
        // C (BeTU'TeKPaT): Monday from 15h589p — effective = (day - 15h589p) / day (relative length)
        const DAY_CHALAKIM = 24 * 1080;
        const C_EFFECTIVE_PCT = ((DAY_CHALAKIM - (15 * 1080 + 589)) / DAY_CHALAKIM) * 100;
        const C_INACTIVE_PCT = 100 - C_EFFECTIVE_PCT;
        const D_EFFECTIVE_PCT = ((DAY_CHALAKIM - (9 * 1080 + 204)) / DAY_CHALAKIM) * 100;
        const D_INACTIVE_PCT = 100 - D_EFFECTIVE_PCT;
        tlHtml += "<div class=\"dehiyyot-week-rule-row\"><span class=\"dehiyyot-viz-label\">C</span><div class=\"dehiyyot-week-rule-strip dehiyyot-day-parts\">";
        for (let w = 0; w < 7; w++) {
          tlHtml += "<div class=\"dehiyyot-day-slot\">";
          const isMonday = w === 1;
          if (isMonday) {
            tlHtml += "<span class=\"dehiyyot-day-part dehiyyot-day-part-inactive\" style=\"width:" + C_INACTIVE_PCT + "%\" title=\"Monday before 15h589p\"></span>";
            tlHtml += "<span class=\"dehiyyot-day-part dehiyyot-effective\" style=\"width:" + C_EFFECTIVE_PCT + "%\" title=\"Monday from 15h589p (rule applies)\"></span>";
          } else {
            tlHtml += "<span class=\"dehiyyot-day-part\" style=\"width:100%\" title=\"" + WEEKDAY_LABELS[w] + "\"></span>";
          }
          tlHtml += "</div>";
          if (w < 6) tlHtml += "<span class=\"dehiyyot-day-sep\"></span>";
        }
        tlHtml += "</div></div>";
        // D (GaTRaD): Tuesday from 9h204p — effective = (day - 9h204p) / day
        tlHtml += "<div class=\"dehiyyot-week-rule-row\"><span class=\"dehiyyot-viz-label\">D</span><div class=\"dehiyyot-week-rule-strip dehiyyot-day-parts\">";
        for (let w = 0; w < 7; w++) {
          tlHtml += "<div class=\"dehiyyot-day-slot\">";
          const isTuesday = w === 2;
          if (isTuesday) {
            tlHtml += "<span class=\"dehiyyot-day-part dehiyyot-day-part-inactive\" style=\"width:" + D_INACTIVE_PCT + "%\" title=\"Tuesday before 9h204p\"></span>";
            tlHtml += "<span class=\"dehiyyot-day-part dehiyyot-effective\" style=\"width:" + D_EFFECTIVE_PCT + "%\" title=\"Tuesday from 9h204p (rule applies)\"></span>";
          } else {
            tlHtml += "<span class=\"dehiyyot-day-part\" style=\"width:100%\" title=\"" + WEEKDAY_LABELS[w] + "\"></span>";
          }
          tlHtml += "</div>";
          if (w < 6) tlHtml += "<span class=\"dehiyyot-day-sep\"></span>";
        }
        tlHtml += "</div></div>";
        tlHtml += "</div>";
        dehiyyotTimeline.innerHTML = tlHtml;
      });
    }

    /** Jump calendar to Tishrei 1 of the given Hebrew year and scroll to calendar. */
    function jumpToTishrei1(hebrewYear) {
      const core = HebrewCore();
      if (!core || !monthSelect || !yearInput) return;
      const d = core.tishrei1Date(hebrewYear);
      const gYear = d.getUTCFullYear();
      const gMonth = d.getUTCMonth();
      monthSelect.value = String(gMonth);
      yearInput.value = String(gYear);
      if (hebYearInput) hebYearInput.value = String(hebrewYear);
      if (hebMonthSelect) {
        global.View.populateHebrewMonthSelector(hebMonthSelect, hebrewYear);
        hebMonthSelect.value = "Tishrey";
      }
      renderCurrent();
      var calendarSection = document.querySelector(".calendars");
      if (calendarSection) {
        calendarSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    // Click on year cell in dehiyyot viz → jump calendar to Tishrei 1 of that year (document-level delegation)
    document.addEventListener("click", function (e) {
      var cell = e.target && e.target.closest ? e.target.closest(".dehiyyot-year-cell") : null;
      if (!cell) return;
      var y = cell.getAttribute("data-year");
      if (y == null || y === "") return;
      var hy = parseInt(y, 10);
      if (!Number.isFinite(hy)) return;
      jumpToTishrei1(hy);
    });

    /* ================ Holiday Line Graph logic =================== */

    if (btnHolidayGraph && holidaySelect) {
      btnHolidayGraph.addEventListener("click", () => {
        const holidayName = holidaySelect.value;
        statsOutput.textContent = "";

        if (typeof Chart === "undefined" || !holidayLineCanvas) return;

        // How many years did the user ask for?
        let requestedYears =
          holidayYearsInput && holidayYearsInput.value
            ? Number(holidayYearsInput.value)
            : DEFAULT_GRAPH_YEARS;
        if (!Number.isFinite(requestedYears) || requestedYears < 1)
          requestedYears = DEFAULT_GRAPH_YEARS;
        if (requestedYears > 2000) requestedYears = 2000;

        const series = global.Stats.holidayDateSeries(holidayName, requestedYears);
        if (!series) return;

        if (holidayChartWrapper) holidayChartWrapper.style.display = "block";

        const total = series.years.length;
        const windowSize = Math.min(MAX_VISIBLE_POINTS, total);
        const needsSlider = total > MAX_VISIBLE_POINTS;

        // Show / hide the slider row
        if (holidayRangeControls) {
          holidayRangeControls.style.display = needsSlider ? "flex" : "none";
        }

        if (yearRangeSlider && needsSlider) {
          yearRangeSlider.min = "0";
          yearRangeSlider.max = String(total - windowSize);
          yearRangeSlider.step = "1";
          yearRangeSlider.value = String(total - windowSize); // default to latest
        }

        // Convert simplified day-of-year (1–365, Feb=28) to "d.m" label (e.g. 3.3 = 3 March)
          function simplifiedDayToDotted(value) {
            var monthStarts = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
            var monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            for (var m = 0; m < 12; m++) {
              if (value <= monthStarts[m] + monthLengths[m]) {
                var d = value - monthStarts[m];
                return d + "." + (m + 1);
              }
            }
            return String(value);
          }

          const updateHolidayChart = () => {
            let startIdx = 0;
            if (needsSlider && yearRangeSlider) {
              startIdx = Number(yearRangeSlider.value) || 0;
            }
            if (startIdx < 0) startIdx = 0;
            const endIdx = Math.min(startIdx + windowSize, total);

            const labels = series.years.slice(startIdx, endIdx);
            const data = series.dayOfYear.slice(startIdx, endIdx);
            const dates = series.gregDates.slice(startIdx, endIdx);
            const days = series.weekdays.slice(startIdx, endIdx);

            var dataMin = data.length ? Math.min.apply(null, data) : 1;
            var dataMax = data.length ? Math.max.apply(null, data) : 365;
            var yMin = dataMin - 3;
            var yMax = dataMax + 3;

            if (yearRangeLabel && labels.length) {
              yearRangeLabel.textContent =
                "Showing " + labels[0] + " – " + labels[labels.length - 1] +
                " (" + labels.length + " of " + total + " years)";
            } else if (yearRangeLabel) {
              yearRangeLabel.textContent =
                total + " years (all visible)";
            }

            const ctx = holidayLineCanvas.getContext("2d");
            if (holidayLineChart) holidayLineChart.destroy();

            holidayLineChart = new Chart(ctx, {
              type: "line",
              data: {
                labels: labels,
                datasets: [
                  {
                    label: series.holidayName + " (date d.m)",
                    data: data,
                    borderColor: "rgba(34, 197, 94, 1)",
                    backgroundColor: "rgba(34, 197, 94, 0.25)",
                    tension: 0.1,
                    pointRadius: windowSize <= 40 ? 3 : 0,
                  },
                ],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: {
                    title: { display: true, text: "Hebrew Year", color: "#e5e7eb" },
                    ticks: { color: "#e5e7eb", maxTicksLimit: 15 },
                    grid: { color: "rgba(31, 41, 55, 0.5)" },
                  },
                  y: {
                    title: { display: true, text: "Date (d.m)", color: "#e5e7eb" },
                    min: yMin,
                    max: yMax,
                    ticks: {
                      color: "#e5e7eb",
                      callback: function (value) {
                        return simplifiedDayToDotted(value);
                      },
                    },
                    grid: { color: "rgba(31, 41, 55, 0.5)" },
                  },
                },
                plugins: {
                  legend: { labels: { color: "#e5e7eb" } },
                  tooltip: {
                    callbacks: {
                      title: function (items) {
                        if (!items.length) return "";
                        return "Hebrew year " + items[0].label;
                      },
                      label: function (context) {
                        var i = context.dataIndex;
                        var dotted = simplifiedDayToDotted(context.parsed.y);
                        var d = dates[i] || "";
                        var wd = days[i] || "";
                        return dotted + " — " + d + " (" + wd + ")";
                      },
                    },
                  },
                },
              },
            });
          };

        updateHolidayChart();

        if (yearRangeSlider) {
          yearRangeSlider.oninput = updateHolidayChart;
        }
      });
    }

    /* =============== Cycle-mode toggle & graph ==================== */

    if (btnCycleMode) {
      btnCycleMode.addEventListener("click", function () {
        if (!cycleControls) return;
        var showing = cycleControls.style.display !== "none";
        cycleControls.style.display = showing ? "none" : "flex";
        btnCycleMode.textContent = showing
          ? "Show specific years of cycle (19 year cycle)"
          : "Hide cycle controls";
      });
    }

    if (btnCycleGraph) {
      btnCycleGraph.addEventListener("click", function () {
        var holidayName = holidaySelect ? holidaySelect.value : "";
        statsOutput.textContent = "";

        if (typeof Chart === "undefined" || !holidayLineCanvas) return;

        // Always use 2000 years in cycle mode
        var series = global.Stats.holidayDateSeries(holidayName, 2000);
        if (!series) return;

        // Determine which cycle positions are checked
        var checked = [];
        document.querySelectorAll(".cycle-cb:checked").forEach(function (c) {
          checked.push(Number(c.value));
        });
        if (!checked.length) {
          statsOutput.textContent = "Please select at least one cycle year.";
          return;
        }

        // Hide slider (not used in cycle mode) and show chart
        if (holidayRangeControls) holidayRangeControls.style.display = "none";
        if (holidayChartWrapper) holidayChartWrapper.style.display = "block";

        function cycleDayToDotted(value) {
          var monthStarts = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
          var monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
          for (var m = 0; m < 12; m++) {
            if (value <= monthStarts[m] + monthLengths[m]) {
              var d = value - monthStarts[m];
              return d + "." + (m + 1);
            }
          }
          return String(value);
        }

        // Build one dataset per checked cycle position
        var datasets = checked.map(function (cyclePos) {
          var data = [];
          for (var i = 0; i < series.years.length; i++) {
            var pos = ((series.years[i] - 1) % 19) + 1;
            data.push(pos === cyclePos ? series.dayOfYear[i] : null);
          }
          var color = CYCLE_COLORS[(cyclePos - 1) % CYCLE_COLORS.length];
          return {
            label: "Cycle year " + cyclePos,
            data: data,
            borderColor: color,
            backgroundColor: color + "40",
            tension: 0.1,
            pointRadius: 2,
            spanGaps: true,
          };
        });

        // Min/max from displayed values only (non-null across all built datasets)
        var allDisplayed = [];
        datasets.forEach(function (ds) {
          (ds.data || []).forEach(function (v) {
            if (v != null) allDisplayed.push(v);
          });
        });
        var dataMin = allDisplayed.length ? Math.min.apply(null, allDisplayed) : 1;
        var dataMax = allDisplayed.length ? Math.max.apply(null, allDisplayed) : 365;
        var yMin = dataMin - 3;
        var yMax = dataMax + 3;

        var ctx = holidayLineCanvas.getContext("2d");
        if (holidayLineChart) holidayLineChart.destroy();

        holidayLineChart = new Chart(ctx, {
          type: "line",
          data: {
            labels: series.years,
            datasets: datasets,
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                title: { display: true, text: "Hebrew Year", color: "#e5e7eb" },
                ticks: { color: "#e5e7eb", maxTicksLimit: 20 },
                grid: { color: "rgba(31, 41, 55, 0.5)" },
              },
              y: {
                title: { display: true, text: "Date (d.m)", color: "#e5e7eb" },
                min: yMin,
                max: yMax,
                ticks: {
                  color: "#e5e7eb",
                  callback: function (value) {
                    return cycleDayToDotted(value);
                  },
                },
                grid: { color: "rgba(31, 41, 55, 0.5)" },
              },
            },
            plugins: {
              legend: { labels: { color: "#e5e7eb" } },
              tooltip: {
                callbacks: {
                  title: function (items) {
                    if (!items.length) return "";
                    return "Hebrew year " + items[0].label;
                  },
                  label: function (context) {
                    var idx = context.dataIndex;
                    var dotted = context.parsed.y != null ? cycleDayToDotted(context.parsed.y) : "";
                    var d = series.gregDates[idx] || "";
                    var wd = series.weekdays[idx] || "";
                    var cyc = ((series.years[idx] - 1) % 19) + 1;
                    return "Cycle " + cyc + ": " + dotted + " — " + d + " (" + wd + ")";
                  },
                },
              },
            },
          },
        });
      });
    }

    /* ================ New moon vs 29d 12h 793h graph ================ */

    if (moonLineCanvas && typeof global.Moon !== "undefined") {
      const Moon = global.Moon;
      let moonSeries = null;
      let moonYearsBeforeLinesOnly = MOON_GRAPH_DEFAULT_YEARS;

      /** Format days as "D H:MM:SS.s" (seconds one decimal). */
      function daysToDHMS(days) {
        var D = Math.floor(days);
        var hRem = (days - D) * 24;
        var H = Math.floor(hRem);
        var mRem = (hRem - H) * 60;
        var M = Math.floor(mRem);
        var S = (mRem - M) * 60;
        var pad2 = function (n) { return (n < 10 ? "0" : "") + n; };
        var sInt = Math.floor(S);
        var sFrac = (S - sInt).toFixed(1);
        var sTenth = sFrac.length > 2 ? sFrac.charAt(sFrac.length - 1) : "0";
        return D + " " + pad2(H) + ":" + pad2(M) + ":" + pad2(sInt) + "." + sTenth;
      }

      function hebrewLabelForLunation(N) {
        const core = HebrewCore();
        if (!core) return String(N);
        const jd = Moon.trueNewMoonJD(N);
        const d = Moon.jdToDate(jd);
        const y = d.getUTCFullYear();
        const m = d.getUTCMonth();
        const day = d.getUTCDate();
        try {
          const h = core.gregorianToHebrew(y, m, day);
          return h.hebrewMonthName + " " + h.hebrewYear;
        } catch (e) {
          return String(N);
        }
      }

      function updateMoonChart() {
        if (!moonSeries) return;
        const startIdx = 0;
        const endIdx = moonSeries.lunations.length;
        const linesOnly = moonLinesOnlyCb && moonLinesOnlyCb.checked;
        const fullData = moonSeries.hoursLater.slice(startIdx, endIdx);

        // Month lengths for header (D H:M S.s)
        var calculatedMonthDays = Moon.MEAN_SYNODIC_MONTH_DAYS;
        if (endIdx - startIdx > 1) {
          var firstJD = Moon.trueNewMoonJD(moonSeries.lunations[startIdx]);
          var lastJD = Moon.trueNewMoonJD(moonSeries.lunations[endIdx - 1]);
          calculatedMonthDays = (lastJD - firstJD) / (endIdx - startIdx - 1);
        }
        var onlineMonthDays = 29.530588853; // mean synodic month (Meeus / almanac, commonly cited)
        var halachicMonthDays = Moon.HEBREW_MONTH_DAYS;
        if (moonChartMonthLengthsEl) {
          moonChartMonthLengthsEl.innerHTML =
            "Calculated (this range): " + daysToDHMS(calculatedMonthDays) + " &nbsp;|&nbsp; " +
            "Reference (online): " + daysToDHMS(onlineMonthDays) + " &nbsp;|&nbsp; " +
            "Halachic (29d 12h 793): " + daysToDHMS(halachicMonthDays);
        }

        const realAverage = fullData.length
          ? fullData.reduce(function (a, b) { return a + b; }, 0) / fullData.length
          : 0;

        var labels = [];
        var data = fullData;
        var linesOnlyDefinitionData = null;
        var linesOnlySlopeText = "";
        var linesOnlyYAxisTitle = "";

        if (linesOnly && endIdx - startIdx > 1) {
          var totalLunations = endIdx - startIdx;
          var refMonthDays = 29.530588853; // reference (online) mean synodic month
          var sumJD = 0;
          for (var i = 0; i < totalLunations; i++) {
            sumJD += Moon.trueNewMoonJD(moonSeries.lunations[startIdx + i]);
          }
          var meanJD = sumJD / totalLunations;
          var epoch = meanJD - refMonthDays * (totalLunations - 1) / 2;
          var nPoints = Math.min(MOON_GRAPH_LINES_ONLY_POINTS, totalLunations);
          var step = nPoints > 1 ? (totalLunations - 1) / (nPoints - 1) : 0;
          var sampleOffsets = [];
          for (var s = 0; s < nPoints; s++) {
            sampleOffsets.push(nPoints > 1 ? (s === nPoints - 1 ? totalLunations - 1 : Math.round(s * step)) : 0);
          }
          for (var k = 0; k < sampleOffsets.length; k++) {
            labels.push(hebrewLabelForLunation(moonSeries.lunations[startIdx + sampleOffsets[k]]));
          }
          linesOnlyDefinitionData = sampleOffsets.map(function (offset) {
            var lunationN = moonSeries.lunations[startIdx + offset];
            var defAt = Moon.newMoonVsDefinition(lunationN);
            var refJDAt = epoch + offset * refMonthDays;
            return (defAt.definitionJD - refJDAt) * 24;
          });
          var driftPerLunationHours = (Moon.HEBREW_MONTH_DAYS - refMonthDays) * 24;
          var driftPerMonthSeconds = driftPerLunationHours * 3600;
          linesOnlySlopeText = "Reference avg: " + refMonthDays.toFixed(9) + " d, epoch chosen so avg diff = 0 | 29d 12h 793 slope: " + driftPerLunationHours.toFixed(4) + " h/lunation (" + driftPerMonthSeconds.toFixed(2) + " s/month)";
          linesOnlyYAxisTitle = "Hours later than reference average (0)";
          data = [];
        } else if (linesOnly) {
          labels.push(hebrewLabelForLunation(moonSeries.lunations[startIdx]));
          linesOnlyDefinitionData = [0];
          data = [];
        } else {
          for (var i = startIdx; i < endIdx; i++) {
            labels.push(hebrewLabelForLunation(moonSeries.lunations[i]));
          }
        }
        const hoursDefinitionAfterAverage = -realAverage;

        function findLocalMaxIndices(arr) {
          var peaks = [];
          for (var i = 1; i < arr.length - 1; i++) {
            if (arr[i] >= arr[i - 1] && arr[i] >= arr[i + 1]) peaks.push(i);
          }
          return peaks;
        }

        var peakLocalIndices = findLocalMaxIndices(data);
        var peakSubtitle = "";
        if (peakLocalIndices.length >= 2 && !linesOnly) {
          var firstPeakIdx = peakLocalIndices[0];
          var lastPeakIdx = peakLocalIndices[peakLocalIndices.length - 1];
          var firstPeakLunation = moonSeries.lunations[startIdx + firstPeakIdx];
          var lastPeakLunation = moonSeries.lunations[startIdx + lastPeakIdx];
          var jdFirst = Moon.trueNewMoonJD(firstPeakLunation);
          var jdLast = Moon.trueNewMoonJD(lastPeakLunation);
          var daysBetween = jdLast - jdFirst;
          var numOscillations = peakLocalIndices.length - 1;
          var avgDaysPerOscillation = daysBetween / numOscillations;
          var avgYearsPerOscillation = avgDaysPerOscillation / 365.25;
          peakSubtitle = "Peaks: " + peakLocalIndices.length + " | Oscillations: " + numOscillations +
            " | Span: " + (daysBetween / 365.25).toFixed(1) + " y | Avg peak-to-peak: " +
            avgDaysPerOscillation.toFixed(1) + " d (" + avgYearsPerOscillation.toFixed(2) + " y)";
        }

        const ctx = moonLineCanvas.getContext("2d");
        if (moonLineChart) moonLineChart.destroy();
        const dataMin = data.length ? Math.min.apply(null, data) : 0;
        const dataMax = data.length ? Math.max.apply(null, data) : 0;
        const yMin = dataMin - 1;
        const yMax = dataMax + 1;

        const n = labels.length;
        var realAverageLine = Array(n).fill(realAverage);
        var definitionLine = Array(n).fill(0);
        if (linesOnly && linesOnlyDefinitionData) {
          realAverageLine = Array(n).fill(0);
          definitionLine = linesOnlyDefinitionData;
        }

        const datasets = [];
        if (!linesOnly) {
          datasets.push({
            label: "Hours later than 29d 12h 793h",
            data: data,
            borderColor: "rgba(59, 130, 246, 1)",
            backgroundColor: "rgba(59, 130, 246, 0.2)",
            tension: 0.1,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: "rgb(234, 179, 8)",
            pointBorderColor: "rgba(59, 130, 246, 1)",
            pointBorderWidth: 1,
          });
        }
        datasets.push(
          {
            label: linesOnly ? "Reference average, best-fit (0)" : "Real average (" + realAverage.toFixed(2) + " h)",
            data: realAverageLine,
            borderColor: "rgba(34, 197, 94, 1)",
            borderDash: [5, 5],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
          },
          {
            label: linesOnly ? "29d 12h 793h" : "29d 12h 793h definition (0 h) — " + hoursDefinitionAfterAverage.toFixed(2) + " h after real avg",
            data: definitionLine,
            borderColor: "rgba(248, 250, 252, 0.8)",
            borderDash: linesOnly ? [] : [3, 3],
            borderWidth: linesOnly ? 2 : 1,
            pointRadius: linesOnly ? 3 : 0,
            pointBackgroundColor: "rgba(248, 250, 252, 0.9)",
            fill: false,
          }
        );

        var yMinFinal = yMin;
        var yMaxFinal = yMax;
        if (linesOnly && linesOnlyDefinitionData && linesOnlyDefinitionData.length) {
          var defMin = Math.min.apply(null, linesOnlyDefinitionData);
          var defMax = Math.max.apply(null, linesOnlyDefinitionData);
          var padding = Math.max(0.5, (defMax - defMin) * 0.1 || 0.5);
          yMinFinal = Math.min(0, defMin) - padding;
          yMaxFinal = Math.max(0, defMax) + padding;
        } else if (linesOnly) {
          yMinFinal = Math.min(0, realAverage) - 2;
          yMaxFinal = Math.max(0, realAverage) + 2;
        }

        moonLineChart = new Chart(ctx, {
          type: "line",
          data: {
            labels: labels,
            datasets: datasets,
          },
            options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                title: { display: true, text: "Hebrew date (new moon)", color: "#e5e7eb" },
                ticks: { color: "#e5e7eb", maxTicksLimit: 15, maxRotation: 45, minRotation: 45 },
                grid: { color: "rgba(31, 41, 55, 0.5)" },
              },
              y: {
                title: { display: true, text: linesOnlyYAxisTitle || "Hours later", color: "#e5e7eb" },
                min: yMinFinal,
                max: yMaxFinal,
                ticks: { color: "#e5e7eb" },
                grid: { color: "rgba(31, 41, 55, 0.5)" },
              },
            },
            plugins: {
              title: {
                display: !!(linesOnlySlopeText || peakSubtitle),
                text: linesOnlySlopeText || peakSubtitle,
                color: "#e5e7eb",
                font: { size: 12 },
              },
              legend: { labels: { color: "#e5e7eb" } },
              tooltip: {
                callbacks: {
                  title: function (items) {
                    if (!items.length) return "";
                    return items[0].label;
                  },
                  label: function (context) {
                    const h = context.parsed.y;
                    return (h != null ? h.toFixed(2) : "") + " h later";
                  },
                },
              },
            },
          },
        });
      }

      function getMoonYearsValue() {
        var v = moonYearsInput ? Number(moonYearsInput.value) : (moonYearsSlider ? Number(moonYearsSlider.value) : MOON_GRAPH_DEFAULT_YEARS);
        return Number.isFinite(v) ? v : MOON_GRAPH_DEFAULT_YEARS;
      }

      function setMoonYearsUI(maxYears, value) {
        if (moonYearsInput) {
          moonYearsInput.max = String(maxYears);
          moonYearsInput.value = String(Math.max(1, Math.min(maxYears, value)));
        }
        if (moonYearsSlider) {
          moonYearsSlider.max = String(maxYears);
          moonYearsSlider.value = String(Math.max(1, Math.min(maxYears, value)));
        }
      }

      if (moonYearsInput && moonYearsSlider) {
        moonYearsInput.addEventListener("input", function () {
          var v = getMoonYearsValue();
          var linesOnly = moonLinesOnlyCb && moonLinesOnlyCb.checked;
          var maxY = linesOnly ? MOON_GRAPH_LINES_ONLY_DEFAULT_YEARS : MOON_GRAPH_FULL_DISPLAY_MAX_YEARS;
          v = Math.max(1, Math.min(maxY, v));
          moonYearsSlider.value = String(v);
          if (moonYearsInput.value !== String(v)) moonYearsInput.value = String(v);
          runMoonGraph();
        });
        moonYearsSlider.addEventListener("input", function () {
          var v = moonYearsSlider.value;
          if (moonYearsInput) moonYearsInput.value = v;
          runMoonGraph();
        });
      }

      if (moonLinesOnlyCb) {
        moonLinesOnlyCb.addEventListener("change", function () {
          if (moonLinesOnlyCb.checked) {
            moonYearsBeforeLinesOnly = Math.max(1, Math.min(MOON_GRAPH_FULL_DISPLAY_MAX_YEARS, getMoonYearsValue()));
            setMoonYearsUI(MOON_GRAPH_LINES_ONLY_DEFAULT_YEARS, MOON_GRAPH_LINES_ONLY_DEFAULT_YEARS);
          } else {
            setMoonYearsUI(MOON_GRAPH_FULL_DISPLAY_MAX_YEARS, moonYearsBeforeLinesOnly);
          }
          runMoonGraph();
        });
      }

      function runMoonGraph() {
        statsOutput.textContent = "";
        if (typeof Chart === "undefined" || !moonLineCanvas) return;

        const now = Moon.lunationNumber(new Date());
        const linesOnly = moonLinesOnlyCb && moonLinesOnlyCb.checked;
        const years = linesOnly
          ? MOON_GRAPH_LINES_ONLY_DEFAULT_YEARS
          : Math.max(1, Math.min(MOON_GRAPH_FULL_DISPLAY_MAX_YEARS, getMoonYearsValue()));
        const countLunations = Math.max(1, Math.round(years * Moon.LUNATIONS_PER_YEAR));
        const startN = now - countLunations + 1;
        const endN = now;

        moonSeries = Moon.newMoonVsDefinitionRange(startN, endN);
        if (!moonSeries.lunations.length) return;

        if (moonChartWrapper) moonChartWrapper.style.display = "block";
        updateMoonChart();
      }
      runMoonGraphRef = runMoonGraph;
    }

    /* ======================== boot ================================ */

    // Load parasha data, then render (so parasha names appear on first paint)
    if (global.Parashot && global.Parashot.loadParashaData) {
      global.Parashot.loadParashaData(function () {
        renderCurrent();
      });
    } else {
      renderCurrent();
    }
  }

  // Call setupUI directly — no async wrapping so errors surface immediately.
  setupUI();
})(typeof window !== "undefined" ? window : globalThis);
