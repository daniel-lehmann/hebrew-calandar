// main.js
// Wires together the view layer, core logic, stats and a minimal API.

(function (global) {
  const HebrewCore = () => global.HebrewCore;
  let holidayLineChart = null;
  let tishreiHistChart = null;
  const DEFAULT_GRAPH_YEARS = 50;
  const MAX_VISIBLE_POINTS = 50; // points shown at once; slider if total > this

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
    const btnEarliestPesach = document.getElementById("btn-earliest-pesach");
    const btnLatestHolidays = document.getElementById("btn-latest-holidays");
    const btnTishreiList = document.getElementById("btn-tishrei-list");
    const btnTishreiHist = document.getElementById("btn-tishrei-hist");
    const btnHolidayGraphToggle = document.getElementById("btn-holiday-graph-toggle");
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
    }

    if (btnStatsBack) {
      btnStatsBack.addEventListener("click", deactivateStat);
    }

    // Earliest / Latest — no panel needed, just output text
    btnEarliestPesach.addEventListener("click", () => {
      activateStat(btnEarliestPesach);
      togglePanel(""); // close all panels
      statsOutput.textContent = global.Stats.summarizeEarliestPesach();
    });
    btnLatestHolidays.addEventListener("click", () => {
      activateStat(btnLatestHolidays);
      togglePanel("");
      statsOutput.textContent = global.Stats.summarizeLatestHolidays();
    });

    // "List Hebrew date by year" — toggle its panel
    btnTishreiList.addEventListener("click", () => {
      activateStat(btnTishreiList);
      togglePanel("panel-tishrei-list");
    });

    // Run button inside the panel
    if (btnTishreiListRun) {
      btnTishreiListRun.addEventListener("click", () => {
        const core = global.HebrewCore;
        if (!core) {
          statsOutput.textContent = "HebrewCore not loaded.";
          return;
        }

        let years =
          tishreiYearsInput && tishreiYearsInput.value
            ? Number(tishreiYearsInput.value)
            : 19;
        if (!Number.isFinite(years) || years <= 0) years = 19;
        if (years > 2000) years = 2000;

        const kind = hebrewDateKind ? hebrewDateKind.value : "tishrei1";

        let monthName = "Tishrey";
        let day = 1;
        let label = "1 Tishrey";

        if (kind === "holiday" && hebrewHolidaySelect) {
          const holidayName = hebrewHolidaySelect.value;
          const holidays = core.HEBREW_HOLIDAYS || [];
          const holiday = holidays.find((h) => h.name === holidayName);
          if (!holiday) {
            statsOutput.textContent = "Unknown holiday: " + holidayName;
            return;
          }
          monthName = holiday.month;
          day = holiday.startDay;
          label = holiday.name;
        } else if (kind === "custom" && hebrewMonthSelect && hebrewDayInput) {
          monthName = hebrewMonthSelect.value;
          day = Number(hebrewDayInput.value);
          if (!monthName || !day) {
            statsOutput.textContent = "Please choose a Hebrew month and day.";
            return;
          }
          label = day + " " + monthName;
        }

        statsOutput.textContent = global.Stats.listHebrewDateYears(
          monthName,
          day,
          years,
          label
        );
      });
    }

    // "Day-of-week histogram" — toggle its panel
    btnTishreiHist.addEventListener("click", () => {
      activateStat(btnTishreiHist);
      togglePanel("panel-hist");
    });

    // Toggle holiday vs custom fields inside the histogram panel
    if (histKind) {
      histKind.addEventListener("change", () => {
        var isCustom = histKind.value === "custom";
        if (histHolidaySelect) histHolidaySelect.style.display = isCustom ? "none" : "";
        if (histMonthSelect) histMonthSelect.style.display = isCustom ? "" : "none";
        if (histDayInput) histDayInput.style.display = isCustom ? "" : "none";
      });
    }

    // Run the histogram
    if (btnHistRun) {
      btnHistRun.addEventListener("click", () => {
        var core = global.HebrewCore;
        if (!core) return;

        var monthName, day, label;
        var kind = histKind ? histKind.value : "holiday";

        if (kind === "holiday" && histHolidaySelect) {
          var holidayName = histHolidaySelect.value;
          var holidays = core.HEBREW_HOLIDAYS || [];
          var holiday = holidays.find(function (h) { return h.name === holidayName; });
          if (!holiday) {
            statsOutput.textContent = "Unknown holiday: " + holidayName;
            return;
          }
          monthName = holiday.month;
          day = holiday.startDay;
          label = holiday.name;
        } else {
          monthName = histMonthSelect ? histMonthSelect.value : "Tishrey";
          day = histDayInput ? Number(histDayInput.value) : 1;
          if (!monthName || !day) {
            statsOutput.textContent = "Please choose a Hebrew month and day.";
            return;
          }
          label = day + " " + monthName;
        }

        statsOutput.textContent = "";
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
      });
    }

    // "Holiday line graph" — toggle its panel
    if (btnHolidayGraphToggle) {
      btnHolidayGraphToggle.addEventListener("click", () => {
        activateStat(btnHolidayGraphToggle);
        togglePanel("panel-holiday-graph");
      });
    }

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
                  label: series.holidayName + " – Gregorian day-of-year",
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
                  title: { display: true, text: "Gregorian day-of-year", color: "#e5e7eb" },
                  ticks: { color: "#e5e7eb" },
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
                      var d = dates[i] || "";
                      var wd = days[i] || "";
                      return d + " (" + wd + ")";
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
                title: {
                  display: true,
                  text: "Gregorian day-of-year",
                  color: "#e5e7eb",
                },
                ticks: { color: "#e5e7eb" },
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
                    var d = series.gregDates[idx] || "";
                    var wd = series.weekdays[idx] || "";
                    var cyc = ((series.years[idx] - 1) % 19) + 1;
                    return (
                      "Cycle " + cyc + ": " + d + " (" + wd + ")"
                    );
                  },
                },
              },
            },
          },
        });
      });
    }

    /* ======================== boot ================================ */
    renderCurrent();
  }

  // Call setupUI directly — no async wrapping so errors surface immediately.
  setupUI();
})(typeof window !== "undefined" ? window : globalThis);
