// view.js
// Responsible for rendering the calendars into the DOM.

(function (global) {
  const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function populateMonthSelector(selectEl) {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    selectEl.innerHTML = "";
    monthNames.forEach((name, index) => {
      const opt = document.createElement("option");
      opt.value = String(index);
      opt.textContent = name;
      selectEl.appendChild(opt);
    });
  }

  function renderGregorianCalendar(container, year, monthIndex) {
    container.innerHTML = "";
    renderHeaders(container);

    const firstDay = new Date(year, monthIndex, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    for (let i = 0; i < startWeekday; i++) {
      const cell = document.createElement("div");
      cell.className = "calendar-cell empty";
      container.appendChild(cell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement("div");
      cell.className = "calendar-cell";

      const dateRow = document.createElement("div");
      dateRow.className = "date-row";

      const dateMain = document.createElement("span");
      dateMain.className = "date-main";
      dateMain.textContent = String(day);

      dateRow.appendChild(dateMain);
      cell.appendChild(dateRow);
      container.appendChild(cell);
    }
  }

  function renderCombinedCalendar(
    container,
    gregorianYear,
    monthIndex,
    hebrewDayInfoFn,
    onHolidayNav
  ) {
    container.innerHTML = "";
    renderHeaders(container);

    const firstDay = new Date(gregorianYear, monthIndex, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(gregorianYear, monthIndex + 1, 0).getDate();

    for (let i = 0; i < startWeekday; i++) {
      const cell = document.createElement("div");
      cell.className = "calendar-cell empty";
      container.appendChild(cell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement("div");
      cell.className = "calendar-cell";

      const gregRow = document.createElement("div");
      gregRow.className = "date-row";

      const gregSpan = document.createElement("span");
      gregSpan.className = "date-main";
      gregSpan.textContent = String(day);

      gregRow.appendChild(gregSpan);
      cell.appendChild(gregRow);

      const { hebrewDay, hebrewMonthName, hebrewYear } = hebrewDayInfoFn(
        gregorianYear,
        monthIndex,
        day
      );

      const hebRow = document.createElement("div");
      hebRow.className = "date-row";

      const hebSpan = document.createElement("span");
      hebSpan.className = "date-sub";
      hebSpan.textContent = `${hebrewDay} ${hebrewMonthName}`;

      hebRow.appendChild(hebSpan);
      cell.appendChild(hebRow);

      const holiday = findHolidayObjForHebrewDate(hebrewMonthName, hebrewDay);
      if (holiday) {
        const holidayEl = document.createElement("div");
        holidayEl.className = "holiday";

        const prevBtn = document.createElement("span");
        prevBtn.className = "holiday-nav-btn";
        prevBtn.textContent = "\u25C0";
        prevBtn.title = holiday.name + " in previous Hebrew year";
        prevBtn.tabIndex = 0;
        prevBtn.setAttribute("role", "button");

        const nameSpan = document.createElement("span");
        nameSpan.textContent = holiday.name;

        const nextBtn = document.createElement("span");
        nextBtn.className = "holiday-nav-btn";
        nextBtn.textContent = "\u25B6";
        nextBtn.title = holiday.name + " in next Hebrew year";
        nextBtn.tabIndex = 0;
        nextBtn.setAttribute("role", "button");

        if (onHolidayNav) {
          prevBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            onHolidayNav(hebrewYear, holiday.month, holiday.startDay, -1);
          });
          nextBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            onHolidayNav(hebrewYear, holiday.month, holiday.startDay, 1);
          });
        }

        holidayEl.appendChild(prevBtn);
        holidayEl.appendChild(nameSpan);
        holidayEl.appendChild(nextBtn);
        cell.appendChild(holidayEl);
      }

      container.appendChild(cell);
    }
  }

  function renderHebrewCalendar(
    container,
    gregorianYear,
    monthIndex,
    hebrewDayInfoFn
  ) {
    container.innerHTML = "";
    renderHeaders(container);

    const firstDay = new Date(gregorianYear, monthIndex, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(gregorianYear, monthIndex + 1, 0).getDate();

    for (let i = 0; i < startWeekday; i++) {
      const cell = document.createElement("div");
      cell.className = "calendar-cell empty";
      container.appendChild(cell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement("div");
      cell.className = "calendar-cell";

      const dateRow = document.createElement("div");
      dateRow.className = "date-row";

      const { hebrewDay, hebrewMonthName } = hebrewDayInfoFn(
        gregorianYear,
        monthIndex,
        day
      );

      const dateMain = document.createElement("span");
      dateMain.className = "date-main";
      dateMain.textContent = `${hebrewDay}`;

      const dateSub = document.createElement("span");
      dateSub.className = "date-sub";
      dateSub.textContent = hebrewMonthName;

      dateRow.appendChild(dateMain);
      dateRow.appendChild(dateSub);
      cell.appendChild(dateRow);

      const holidayName = findHolidayForHebrewDate(hebrewMonthName, hebrewDay);
      if (holidayName) {
        const holidayEl = document.createElement("div");
        holidayEl.className = "holiday";
        holidayEl.textContent = holidayName;
        cell.appendChild(holidayEl);
      }

      container.appendChild(cell);
    }
  }

  function populateHebrewMonthSelector(selectEl, hebrewYear) {
    const core = global.HebrewCore;
    if (!core) return;
    var prevValue = selectEl.value;
    selectEl.innerHTML = "";
    var months = core.yearMonths(hebrewYear);
    months.forEach(function (m) {
      var opt = document.createElement("option");
      opt.value = m.name;
      opt.textContent = m.name;
      selectEl.appendChild(opt);
    });
    // Restore selection if the month still exists
    var exists = months.some(function (m) { return m.name === prevValue; });
    if (exists) selectEl.value = prevValue;
  }

  var SHORT_GREG_MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  function renderHebrewMonthCalendar(
    container,
    hebrewYear,
    hebrewMonthName,
    onHolidayNav
  ) {
    container.innerHTML = "";
    renderHeaders(container);

    var core = global.HebrewCore;
    if (!core) return;

    var months = core.yearMonths(hebrewYear);
    var monthObj = null;
    for (var mi = 0; mi < months.length; mi++) {
      if (months[mi].name === hebrewMonthName) {
        monthObj = months[mi];
        break;
      }
    }
    if (!monthObj) return;

    var daysInMonth = monthObj.length;

    // Find the weekday of the 1st of this Hebrew month
    var firstDayGreg = core.gregorianFromHebrew(hebrewYear, hebrewMonthName, 1);
    var startWeekday = firstDayGreg.weekday;

    // Empty padding cells
    for (var i = 0; i < startWeekday; i++) {
      var emptyCell = document.createElement("div");
      emptyCell.className = "calendar-cell empty";
      container.appendChild(emptyCell);
    }

    for (var day = 1; day <= daysInMonth; day++) {
      var cell = document.createElement("div");
      cell.className = "calendar-cell";

      // Hebrew date as primary
      var hebRow = document.createElement("div");
      hebRow.className = "date-row";
      var hebSpan = document.createElement("span");
      hebSpan.className = "date-main";
      hebSpan.textContent = day + " " + hebrewMonthName;
      hebRow.appendChild(hebSpan);
      cell.appendChild(hebRow);

      // Gregorian date as secondary
      var greg = core.gregorianFromHebrew(hebrewYear, hebrewMonthName, day);
      var gregRow = document.createElement("div");
      gregRow.className = "date-row";
      var gregSpan = document.createElement("span");
      gregSpan.className = "date-sub";
      gregSpan.textContent = greg.day + " " + SHORT_GREG_MONTHS[greg.monthIndex] + " " + greg.year;
      gregRow.appendChild(gregSpan);
      cell.appendChild(gregRow);

      // Holiday with nav arrows
      var holiday = findHolidayObjForHebrewDate(hebrewMonthName, day);
      if (holiday) {
        var holidayEl = document.createElement("div");
        holidayEl.className = "holiday";

        var prevBtn = document.createElement("span");
        prevBtn.className = "holiday-nav-btn";
        prevBtn.textContent = "\u25C0";
        prevBtn.title = holiday.name + " in previous Hebrew year";
        prevBtn.tabIndex = 0;
        prevBtn.setAttribute("role", "button");

        var nameSpan = document.createElement("span");
        nameSpan.textContent = holiday.name;

        var nextBtn = document.createElement("span");
        nextBtn.className = "holiday-nav-btn";
        nextBtn.textContent = "\u25B6";
        nextBtn.title = holiday.name + " in next Hebrew year";
        nextBtn.tabIndex = 0;
        nextBtn.setAttribute("role", "button");

        if (onHolidayNav) {
          (function (hy, hol) {
            prevBtn.addEventListener("click", function (e) {
              e.stopPropagation();
              onHolidayNav(hy, hol.month, hol.startDay, -1);
            });
            nextBtn.addEventListener("click", function (e) {
              e.stopPropagation();
              onHolidayNav(hy, hol.month, hol.startDay, 1);
            });
          })(hebrewYear, holiday);
        }

        holidayEl.appendChild(prevBtn);
        holidayEl.appendChild(nameSpan);
        holidayEl.appendChild(nextBtn);
        cell.appendChild(holidayEl);
      }

      container.appendChild(cell);
    }
  }

  function renderHeaders(container) {
    WEEKDAY_LABELS.forEach((label) => {
      const headerCell = document.createElement("div");
      headerCell.className = "calendar-header-cell";
      headerCell.textContent = label;
      container.appendChild(headerCell);
    });
  }

  function findHolidayForHebrewDate(monthName, day) {
    const holidays =
      (global.HebrewCore && global.HebrewCore.HEBREW_HOLIDAYS) || [];
    for (const holiday of holidays) {
      if (
        holiday.month === monthName &&
        day >= holiday.startDay &&
        day <= holiday.endDay
      ) {
        return holiday.name;
      }
    }
    return "";
  }

  function findHolidayObjForHebrewDate(monthName, day) {
    const holidays =
      (global.HebrewCore && global.HebrewCore.HEBREW_HOLIDAYS) || [];
    for (const holiday of holidays) {
      if (
        holiday.month === monthName &&
        day >= holiday.startDay &&
        day <= holiday.endDay
      ) {
        return holiday;
      }
    }
    return null;
  }

  const View = {
    populateMonthSelector,
    populateHebrewMonthSelector,
    renderGregorianCalendar,
    renderHebrewCalendar,
    renderCombinedCalendar,
    renderHebrewMonthCalendar,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = View;
  }

  global.View = View;
})(typeof window !== "undefined" ? window : globalThis);

