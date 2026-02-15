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

      const holiday = findHolidayObjForHebrewDate(hebrewYear, hebrewMonthName, hebrewDay);
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
          const core = global.HebrewCore;
          const getMonth = core && core.getHolidayMonthForYear
            ? (hol, y) => core.getHolidayMonthForYear(hol, y)
            : (hol) => hol.month;
          prevBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            const targetYear = hebrewYear - 1;
            onHolidayNav(hebrewYear, getMonth(holiday, targetYear), holiday.startDay, -1);
          });
          nextBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            const targetYear = hebrewYear + 1;
            onHolidayNav(hebrewYear, getMonth(holiday, targetYear), holiday.startDay, 1);
          });
        }

        holidayEl.appendChild(prevBtn);
        holidayEl.appendChild(nameSpan);
        holidayEl.appendChild(nextBtn);
        cell.appendChild(holidayEl);
      }

      // Parasha on Saturdays
      var weekday = new Date(gregorianYear, monthIndex, day).getDay();
      if (weekday === 6 && global.Parashot) {
        var parasha = global.Parashot.getParashaForDate(gregorianYear, monthIndex, day);
        if (parasha && parasha.name) {
          var parashaEl = document.createElement("div");
          parashaEl.className = "parasha";
          parashaEl.textContent = parasha.name;
          parashaEl.title = "Click for details";
          if (!parasha.holiday) {
            parashaEl.style.cursor = "pointer";
            (function (pName) {
              parashaEl.addEventListener("click", function (e) {
                e.stopPropagation();
                global.Parashot.showParashaPopup(pName);
              });
            })(parasha.name);
          }
          cell.appendChild(parashaEl);
        }
      }

      // Molad of Tishrei: on the day of the molad show time; on Tishrei 1 if molad was another day show "Molad was on ..."
      var core = global.HebrewCore;
      if (core && core.getMoladTishrei) {
        var molad = core.getMoladTishrei(hebrewYear);
        var moladLocalY = molad.date.getFullYear();
        var moladLocalM = molad.date.getMonth();
        var moladLocalD = molad.date.getDate();
        var thisDayIsMoladDay = (gregorianYear === moladLocalY && monthIndex === moladLocalM && day === moladLocalD);
        var thisDayIsTishrei1 = (hebrewMonthName === "Tishrey" && hebrewDay === 1);
        var moladTimeStr = molad.hour + "h " + molad.chalakim + "/1080";
        var moladWeekdayStr = WEEKDAY_LABELS[molad.weekday];
        if (thisDayIsMoladDay) {
          var moladEl = document.createElement("div");
          moladEl.className = "molad-time";
          moladEl.textContent = "Molad " + moladTimeStr;
          moladEl.title = "Molad Tishrei " + hebrewYear + " — " + moladWeekdayStr + " " + moladTimeStr;
          cell.appendChild(moladEl);
        } else if (thisDayIsTishrei1) {
          var moladWasEl = document.createElement("div");
          moladWasEl.className = "molad-was";
          moladWasEl.textContent = "Molad was on " + moladWeekdayStr + " " + moladTimeStr;
          moladWasEl.title = "Molad Tishrei " + hebrewYear + " occurred on " + moladWeekdayStr + " " + moladTimeStr;
          cell.appendChild(moladWasEl);
        }
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

      const { hebrewDay, hebrewMonthName, hebrewYear } = hebrewDayInfoFn(
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

      const holidayName = findHolidayForHebrewDate(hebrewYear, hebrewMonthName, hebrewDay);
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
      var holiday = findHolidayObjForHebrewDate(hebrewYear, hebrewMonthName, day);
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
            const core = global.HebrewCore;
            const getMonth = core && core.getHolidayMonthForYear
              ? (h, y) => core.getHolidayMonthForYear(h, y)
              : (h) => h.month;
            prevBtn.addEventListener("click", function (e) {
              e.stopPropagation();
              onHolidayNav(hy, getMonth(hol, hy - 1), hol.startDay, -1);
            });
            nextBtn.addEventListener("click", function (e) {
              e.stopPropagation();
              onHolidayNav(hy, getMonth(hol, hy + 1), hol.startDay, 1);
            });
          })(hebrewYear, holiday);
        }

        holidayEl.appendChild(prevBtn);
        holidayEl.appendChild(nameSpan);
        holidayEl.appendChild(nextBtn);
        cell.appendChild(holidayEl);
      }

      // Parasha on Saturdays (Hebrew view)
      if (greg.weekday === 6 && global.Parashot) {
        var parasha = global.Parashot.getParashaForHebrewDate(hebrewYear, hebrewMonthName, day);
        if (parasha && parasha.name) {
          var parashaEl = document.createElement("div");
          parashaEl.className = "parasha";
          parashaEl.textContent = parasha.name;
          parashaEl.title = "Click for details";
          if (!parasha.holiday) {
            parashaEl.style.cursor = "pointer";
            (function (pName) {
              parashaEl.addEventListener("click", function (e) {
                e.stopPropagation();
                global.Parashot.showParashaPopup(pName);
              });
            })(parasha.name);
          }
          cell.appendChild(parashaEl);
        }
      }

      // Molad of Tishrei (Hebrew view)
      if (core.getMoladTishrei) {
        var molad = core.getMoladTishrei(hebrewYear);
        var moladLocalY = molad.date.getFullYear();
        var moladLocalM = molad.date.getMonth();
        var moladLocalD = molad.date.getDate();
        var thisDayIsMoladDay = (greg.year === moladLocalY && greg.monthIndex === moladLocalM && greg.day === moladLocalD);
        var thisDayIsTishrei1 = (hebrewMonthName === "Tishrey" && day === 1);
        var moladTimeStr = molad.hour + "h " + molad.chalakim + "/1080";
        var moladWeekdayStr = WEEKDAY_LABELS[molad.weekday];
        if (thisDayIsMoladDay) {
          var moladEl = document.createElement("div");
          moladEl.className = "molad-time";
          moladEl.textContent = "Molad " + moladTimeStr;
          moladEl.title = "Molad Tishrei " + hebrewYear + " — " + moladWeekdayStr + " " + moladTimeStr;
          cell.appendChild(moladEl);
        } else if (thisDayIsTishrei1) {
          var moladWasEl = document.createElement("div");
          moladWasEl.className = "molad-was";
          moladWasEl.textContent = "Molad was on " + moladWeekdayStr + " " + moladTimeStr;
          moladWasEl.title = "Molad Tishrei " + hebrewYear + " occurred on " + moladWeekdayStr + " " + moladTimeStr;
          cell.appendChild(moladWasEl);
        }
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

  function monthMatchesHoliday(holiday, monthName) {
    return (
      holiday.month === monthName ||
      (holiday.leapMonth && holiday.leapMonth === monthName)
    );
  }

  function findHolidayForHebrewDate(hebrewYear, monthName, day) {
    const core = global.HebrewCore;
    const holidays = (core && core.HEBREW_HOLIDAYS) || [];
    if (core && core.isDayInHoliday && hebrewYear != null) {
      for (const holiday of holidays) {
        if (core.isDayInHoliday(hebrewYear, monthName, day, holiday)) {
          return holiday.name;
        }
      }
      return "";
    }
    for (const holiday of holidays) {
      const endDay = holiday.endDay != null ? holiday.endDay : holiday.startDay;
      if (
        monthMatchesHoliday(holiday, monthName) &&
        day >= holiday.startDay &&
        day <= endDay
      ) {
        return holiday.name;
      }
    }
    return "";
  }

  function findHolidayObjForHebrewDate(hebrewYear, monthName, day) {
    const core = global.HebrewCore;
    const holidays = (core && core.HEBREW_HOLIDAYS) || [];
    if (core && core.isDayInHoliday && hebrewYear != null) {
      for (const holiday of holidays) {
        if (core.isDayInHoliday(hebrewYear, monthName, day, holiday)) {
          return holiday;
        }
      }
      return null;
    }
    for (const holiday of holidays) {
      const endDay = holiday.endDay != null ? holiday.endDay : holiday.startDay;
      if (
        monthMatchesHoliday(holiday, monthName) &&
        day >= holiday.startDay &&
        day <= endDay
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

