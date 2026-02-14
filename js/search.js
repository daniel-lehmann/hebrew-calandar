// search.js
// Unified search popup — Ctrl+J or search icon.
// Autocomplete for holidays, Hebrew dates, and Gregorian dates.

(function (global) {
  var GREG_MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  var GREG_SHORT = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];
  var DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  // ---- DOM refs (created in createDOM) ----
  var overlay, popup, input, resultsList;
  var onSelectCb;
  var coreRef;

  // ---- active suggestion state ----
  var activeIdx = -1;
  var suggestions = [];

  // ===================== DOM creation =====================

  function createDOM() {
    overlay = document.createElement("div");
    overlay.className = "search-overlay";
    overlay.style.display = "none";

    popup = document.createElement("div");
    popup.className = "search-popup";

    var inputWrap = document.createElement("div");
    inputWrap.className = "search-input-wrap";

    var icon = document.createElement("span");
    icon.className = "search-input-icon";
    icon.innerHTML = "&#128269;"; // 🔍

    input = document.createElement("input");
    input.type = "text";
    input.className = "search-input";
    input.placeholder = "Search holidays, Hebrew dates, Gregorian dates\u2026";
    input.autocomplete = "off";
    input.spellcheck = false;

    var hint = document.createElement("span");
    hint.className = "search-hint";
    hint.textContent = "Ctrl+J";

    inputWrap.appendChild(icon);
    inputWrap.appendChild(input);
    inputWrap.appendChild(hint);

    resultsList = document.createElement("ul");
    resultsList.className = "search-results";

    popup.appendChild(inputWrap);
    popup.appendChild(resultsList);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
  }

  // ===================== open / close =====================

  function openPopup() {
    overlay.style.display = "flex";
    input.value = "";
    refreshSuggestions();
    input.focus();
  }

  function closePopup() {
    overlay.style.display = "none";
    input.value = "";
    resultsList.innerHTML = "";
    suggestions = [];
    activeIdx = -1;
  }

  // ===================== rendering =====================

  function renderSuggestions(list) {
    resultsList.innerHTML = "";
    suggestions = list;
    activeIdx = -1;

    list.forEach(function (s, i) {
      var li = document.createElement("li");
      li.className = "search-result-item";

      var left = document.createElement("div");
      left.className = "search-result-left";

      var label = document.createElement("span");
      label.className = "search-result-label";
      label.textContent = s.label;

      var detail = document.createElement("span");
      detail.className = "search-result-detail";
      detail.textContent = s.detail || "";

      left.appendChild(label);
      left.appendChild(detail);

      var badge = document.createElement("span");
      badge.className = "search-result-badge search-badge-" + s.type;
      badge.textContent = s.type;

      li.appendChild(left);
      li.appendChild(badge);

      li.addEventListener("mousedown", function (e) {
        e.preventDefault();
        selectItem(i);
      });
      li.addEventListener("mouseenter", function () {
        setActive(i);
      });

      resultsList.appendChild(li);
    });
  }

  function setActive(idx) {
    var items = resultsList.querySelectorAll(".search-result-item");
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle("active", i === idx);
    }
    activeIdx = idx;
    // Scroll into view
    if (items[idx]) items[idx].scrollIntoView({ block: "nearest" });
  }

  function selectItem(idx) {
    var s = suggestions[idx];
    if (s && onSelectCb) onSelectCb(s);
    closePopup();
  }

  // ===================== suggestion engine =====================

  function refreshSuggestions() {
    var list = generateSuggestions(input.value);
    renderSuggestions(list);
  }

  function generateSuggestions(query) {
    var q = (query || "").trim();
    if (!q) return defaultSuggestions();

    var results = [];
    results = results.concat(matchHolidays(q));
    results = results.concat(matchHebrewDates(q));
    results = results.concat(matchGregorianDates(q));
    results = results.concat(matchNumeric(q));

    // Deduplicate by label
    var seen = {};
    var unique = [];
    results.forEach(function (r) {
      var key = r.label;
      if (!seen[key]) {
        seen[key] = true;
        unique.push(r);
      }
    });
    return unique.slice(0, 10);
  }

  function defaultSuggestions() {
    // Show upcoming holidays for current Hebrew year
    return matchHolidays("").slice(0, 8);
  }

  // ---- current Hebrew year helper ----
  function currentHebrewYear() {
    var core = coreRef;
    if (!core) return 5786;
    try {
      var now = new Date();
      var h = core.gregorianToHebrew(now.getFullYear(), now.getMonth(), now.getDate());
      return h.hebrewYear;
    } catch (e) { return 5786; }
  }

  // ---- holiday matching ----
  function matchHolidays(query) {
    var core = coreRef;
    if (!core) return [];
    var holidays = core.HEBREW_HOLIDAYS || [];
    var ql = query.toLowerCase();
    var hy = currentHebrewYear();
    var results = [];

    // Parse optional year from query, e.g. "pesach 5785"
    var yearOverride = null;
    var queryWords = ql.split(/[\s,]+/).filter(Boolean);
    var nameWords = [];
    queryWords.forEach(function (w) {
      var n = parseInt(w, 10);
      if (!isNaN(n) && n > 100) {
        yearOverride = n;
      } else {
        nameWords.push(w);
      }
    });
    var namePart = nameWords.join(" ");

    holidays.forEach(function (h) {
      var hLower = h.name.toLowerCase();
      // Match: prefix, contains, or individual words
      if (namePart && !hLower.includes(namePart)) {
        // Try word-by-word: all name words must appear
        var allMatch = nameWords.every(function (w) {
          return hLower.includes(w);
        });
        if (!allMatch) return;
      }

      var targetYear = yearOverride || hy;
      try {
        var month = core.getHolidayMonthForYear
          ? core.getHolidayMonthForYear(h, targetYear)
          : h.month;
        var months = core.yearMonths(targetYear);
        var monthExists = months.some(function (m) { return m.name === month; });
        if (!monthExists) return;

        var g = core.gregorianFromHebrew(targetYear, month, h.startDay);
        var gregStr = GREG_MONTHS[g.monthIndex] + " " + g.day + ", " + g.year;
        var dayName = DAY_NAMES[g.weekday];
        results.push({
          label: h.name + " " + targetYear,
          detail: h.startDay + " " + h.month + " \u2192 " + gregStr + " (" + dayName + ")",
          type: "holiday",
          gregYear: g.year,
          gregMonthIndex: g.monthIndex,
          gregDay: g.day,
          hebrewYear: targetYear,
          hebrewMonthName: h.month,
          hebrewDay: h.startDay,
        });
      } catch (e) {}
    });
    return results;
  }

  // ---- Hebrew date matching ----
  function matchHebrewDates(query) {
    var core = coreRef;
    if (!core) return [];
    var hebMonths = core.HEBREW_MONTHS || [];
    // Also include Adar2 for leap years
    var allMonths = hebMonths.slice();
    if (allMonths.indexOf("Adar2") === -1) allMonths.push("Adar2");

    var tokens = query.split(/[\s,]+/).filter(Boolean);
    if (!tokens.length) return [];

    // Find a Hebrew month token
    var monthName = null;
    var monthTokenIdx = -1;

    for (var ti = 0; ti < tokens.length; ti++) {
      var tl = tokens[ti].toLowerCase();
      for (var mi = 0; mi < allMonths.length; mi++) {
        if (allMonths[mi].toLowerCase().startsWith(tl) && tl.length >= 2) {
          monthName = allMonths[mi];
          monthTokenIdx = ti;
          break;
        }
      }
      // Also handle "adar ii" → Adar2
      if (!monthName && tl === "adar" && tokens[ti + 1] && tokens[ti + 1].toLowerCase() === "ii") {
        monthName = "Adar2";
        monthTokenIdx = ti;
        // skip "ii" token
        tokens.splice(ti + 1, 1);
        break;
      }
      if (monthName) break;
    }

    if (!monthName) return [];

    // Extract day and year from remaining tokens
    var remaining = tokens.filter(function (_, i) { return i !== monthTokenIdx; });
    var dayVal = null;
    var yearVal = null;

    remaining.forEach(function (t) {
      var n = parseInt(t, 10);
      if (isNaN(n)) return;
      if (n >= 1 && n <= 30 && dayVal === null) {
        dayVal = n;
      } else if (n > 30 && yearVal === null) {
        yearVal = n;
      } else if (dayVal !== null && yearVal === null && n > 0) {
        yearVal = n;
      }
    });

    var hy = currentHebrewYear();
    var results = [];

    if (dayVal && yearVal) {
      // Full Hebrew date
      results = results.concat(hebrewDateResult(yearVal, monthName, dayVal));
    } else if (dayVal) {
      // Day + month, show current year +-1
      [hy, hy + 1, hy - 1].forEach(function (y) {
        results = results.concat(hebrewDateResult(y, monthName, dayVal));
      });
    } else {
      // Just month — show 1st of month for current year
      results = results.concat(hebrewDateResult(hy, monthName, 1));
    }

    return results;
  }

  function hebrewDateResult(hebrewYear, monthName, day) {
    var core = coreRef;
    if (!core) return [];
    try {
      var months = core.yearMonths(hebrewYear);
      var mObj = months.find(function (m) { return m.name === monthName; });
      if (!mObj || day > mObj.length) return [];

      var g = core.gregorianFromHebrew(hebrewYear, monthName, day);
      var gregStr = GREG_MONTHS[g.monthIndex] + " " + g.day + ", " + g.year;
      var dayName = DAY_NAMES[g.weekday];
      return [{
        label: day + " " + monthName + " " + hebrewYear,
        detail: gregStr + " (" + dayName + ")",
        type: "hebrew",
        gregYear: g.year,
        gregMonthIndex: g.monthIndex,
        gregDay: g.day,
        hebrewYear: hebrewYear,
        hebrewMonthName: monthName,
        hebrewDay: day,
      }];
    } catch (e) { return []; }
  }

  // ---- Gregorian date matching ----
  function matchGregorianDates(query) {
    var core = coreRef;
    if (!core) return [];
    var tokens = query.split(/[\s,]+/).filter(Boolean);
    if (!tokens.length) return [];

    // Find a Gregorian month token
    var monthName = null;
    var monthIndex = -1;
    var monthTokenIdx = -1;

    for (var ti = 0; ti < tokens.length; ti++) {
      var tl = tokens[ti].toLowerCase();
      for (var mi = 0; mi < GREG_MONTHS.length; mi++) {
        if (GREG_MONTHS[mi].toLowerCase().startsWith(tl) && tl.length >= 2) {
          monthName = GREG_MONTHS[mi];
          monthIndex = mi;
          monthTokenIdx = ti;
          break;
        }
      }
      // Also match short forms
      if (!monthName) {
        for (var si = 0; si < GREG_SHORT.length; si++) {
          if (GREG_SHORT[si].toLowerCase() === tl) {
            monthName = GREG_MONTHS[si];
            monthIndex = si;
            monthTokenIdx = ti;
            break;
          }
        }
      }
      if (monthName) break;
    }

    if (!monthName) return [];

    var remaining = tokens.filter(function (_, i) { return i !== monthTokenIdx; });
    var dayVal = null;
    var yearVal = null;

    remaining.forEach(function (t) {
      var n = parseInt(t, 10);
      if (isNaN(n)) return;
      if (n >= 1 && n <= 31 && dayVal === null) {
        dayVal = n;
      } else if (n > 31 && yearVal === null) {
        yearVal = n;
      } else if (dayVal !== null && yearVal === null && n > 0) {
        yearVal = n;
      }
    });

    var currentYear = new Date().getFullYear();
    var results = [];

    if (dayVal && yearVal) {
      results = results.concat(gregDateResult(yearVal, monthIndex, dayVal));
    } else if (dayVal) {
      results = results.concat(gregDateResult(currentYear, monthIndex, dayVal));
    } else {
      // Just month
      results.push({
        label: monthName + " " + currentYear,
        detail: "Show full month",
        type: "gregorian",
        gregYear: currentYear,
        gregMonthIndex: monthIndex,
        gregDay: 1,
        hebrewYear: null,
        hebrewMonthName: null,
        hebrewDay: null,
      });
    }
    return results;
  }

  function gregDateResult(year, monthIndex, day) {
    var core = coreRef;
    if (!core) return [];
    try {
      // Validate day
      var maxDay = new Date(year, monthIndex + 1, 0).getDate();
      if (day < 1 || day > maxDay) return [];

      var h = core.gregorianToHebrew(year, monthIndex, day);
      var hebStr = h.hebrewDay + " " + h.hebrewMonthName + " " + h.hebrewYear;
      var d = new Date(year, monthIndex, day);
      var dayName = DAY_NAMES[d.getDay()];
      return [{
        label: GREG_MONTHS[monthIndex] + " " + day + ", " + year,
        detail: hebStr + " (" + dayName + ")",
        type: "gregorian",
        gregYear: year,
        gregMonthIndex: monthIndex,
        gregDay: day,
        hebrewYear: h.hebrewYear,
        hebrewMonthName: h.hebrewMonthName,
        hebrewDay: h.hebrewDay,
      }];
    } catch (e) { return []; }
  }

  // ---- Numeric date matching (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD) ----
  function matchNumeric(query) {
    var core = coreRef;
    if (!core) return [];
    var results = [];

    // Slash format: 3/15/2025
    var slashMatch = query.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (slashMatch) {
      var a = parseInt(slashMatch[1], 10);
      var b = parseInt(slashMatch[2], 10);
      var c = parseInt(slashMatch[3], 10);
      if (c < 100) c += 2000; // 25 → 2025

      // MM/DD/YYYY
      if (a >= 1 && a <= 12 && b >= 1 && b <= 31) {
        results = results.concat(gregDateResult(c, a - 1, b));
      }
    }

    // ISO format: 2025-03-15
    var isoMatch = query.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (isoMatch) {
      var yr = parseInt(isoMatch[1], 10);
      var mo = parseInt(isoMatch[2], 10);
      var dy = parseInt(isoMatch[3], 10);
      if (mo >= 1 && mo <= 12 && dy >= 1 && dy <= 31) {
        results = results.concat(gregDateResult(yr, mo - 1, dy));
      }
    }

    return results;
  }

  // ===================== event wiring =====================

  function setupEvents() {
    // Ctrl+J to open
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === "j" || e.key === "J")) {
        e.preventDefault();
        openPopup();
      }
    });

    // Click overlay background to close
    overlay.addEventListener("mousedown", function (e) {
      if (e.target === overlay) closePopup();
    });

    // Typing
    input.addEventListener("input", function () {
      refreshSuggestions();
    });

    // Keyboard navigation
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        e.preventDefault();
        closePopup();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (activeIdx < suggestions.length - 1) setActive(activeIdx + 1);
        else setActive(0);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (activeIdx > 0) setActive(activeIdx - 1);
        else setActive(suggestions.length - 1);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (activeIdx >= 0 && activeIdx < suggestions.length) {
          selectItem(activeIdx);
        } else if (suggestions.length > 0) {
          selectItem(0);
        }
      }
    });
  }

  // ===================== public API =====================

  /**
   * @param {Object} opts
   * @param {Object} opts.core   - HebrewCore reference
   * @param {Function} opts.onSelect - callback(result) when a suggestion is picked
   * @param {HTMLElement} opts.buttonParent - where to insert the search icon button
   */
  function setupSearch(opts) {
    coreRef = opts.core;
    onSelectCb = opts.onSelect;

    createDOM();
    setupEvents();

    // Insert a small search icon button
    if (opts.buttonParent) {
      var btn = document.createElement("button");
      btn.id = "btn-search";
      btn.className = "search-icon-btn";
      btn.title = "Search (Ctrl+J)";
      btn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" ' +
        'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
      btn.addEventListener("click", function () {
        openPopup();
      });
      opts.buttonParent.appendChild(btn);
    }
  }

  global.Search = { setupSearch: setupSearch };
})(typeof window !== "undefined" ? window : globalThis);
