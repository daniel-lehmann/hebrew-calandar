// parashot.js
// Parasha scheduling engine for a Hebrew year and detail popup.

(function (global) {

  var parashaData = null;
  if (typeof window !== "undefined" && window.PARASHOT_JSON && Array.isArray(window.PARASHOT_JSON)) {
    parashaData = window.PARASHOT_JSON;
  }

  // The 54 parashot in order (indices into parashaData)
  var PARASHA_ORDER = [
    "Bereshit","Noah","Lech-Lecha","Vayera","Chayei Sarah","Toldot",
    "Vayetze","Vayishlach","Vayeshev","Miketz","Vayigash","Vayechi",
    "Shemot","Vaera","Bo","Beshalach","Yitro","Mishpatim",
    "Terumah","Tetzaveh","Ki Tisa","Vayakhel","Pekudei",
    "Vayikra","Tzav","Shemini","Tazria","Metzora",
    "Achrei Mot","Kedoshim","Emor","Behar","Bechukotai",
    "Bamidbar","Naso","Behaalotecha","Shelach","Korach",
    "Chukat","Balak","Pinchas","Matot","Masei",
    "Devarim","Vaetchanan","Eikev","Reeh","Shoftim",
    "Ki Tetze","Ki Tavo","Nitsavim","Vayelech","Haazinu",
    "Vezot Haberakhah"
  ];

  // Joinable pairs: [indexA, indexB] in PARASHA_ORDER
  var JOINABLE = [
    [21, 22],  // Vayakhel + Pekudei
    [26, 27],  // Tazria + Metzora
    [28, 29],  // Achrei Mot + Kedoshim
    [31, 32],  // Behar + Bechukotai
    [38, 39],  // Chukat + Balak
    [41, 42],  // Matot + Masei
    [50, 51],  // Nitsavim + Vayelech
  ];

  var DAY_MS = 24 * 60 * 60 * 1000;

  function loadParashaData(callback) {
    if (parashaData && parashaData.length > 0) { callback(parashaData); return; }
    var xhr = new XMLHttpRequest();
    var base = (typeof document !== "undefined" && document.baseURI) ? document.baseURI.replace(/\/[^/]*$/, "/") : "";
    xhr.open("GET", base + "data/parashot.json", true);
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { parashaData = JSON.parse(xhr.responseText); } catch (e) { }
      }
      if (!parashaData || parashaData.length === 0) { parashaData = (window.PARASHOT_JSON || []); }
      callback(parashaData);
    };
    xhr.onerror = function () {
      parashaData = (window.PARASHOT_JSON || []);
      callback(parashaData);
    };
    xhr.send();
  }

  function getParashaInfo(name) {
    if (!parashaData) return null;
    for (var i = 0; i < parashaData.length; i++) {
      if (parashaData[i].name === name) return parashaData[i];
    }
    return null;
  }

  // ---- Holiday-on-Shabbat detection ----
  // When a festival falls on Shabbat, the regular weekly parasha is NOT read.

  function isHolidayShabbat(core, hebrewMonth, hebrewDay) {
    // Pesach (including Chol HaMoed): Nisan 15-21
    if (hebrewMonth === "Nisan" && hebrewDay >= 15 && hebrewDay <= 21) return true;
    // Shavuot: Sivan 6
    if (hebrewMonth === "Sivan" && hebrewDay === 6) return true;
    // Rosh Hashanah: Tishrey 1-2
    if (hebrewMonth === "Tishrey" && hebrewDay >= 1 && hebrewDay <= 2) return true;
    // Yom Kippur: Tishrey 10
    if (hebrewMonth === "Tishrey" && hebrewDay === 10) return true;
    // Sukkot + Chol HaMoed + Shemini Atzeret + Simchat Torah: Tishrey 15-23
    if (hebrewMonth === "Tishrey" && hebrewDay >= 15 && hebrewDay <= 23) return true;

    return false;
  }

  // ---- Scheduling helpers ----

  /** Collect Shabbatot in [startAbs, endAbs) marking holiday ones. */
  function collectShabbatot(core, startAbs, endAbs) {
    var list = [];
    for (var s = startAbs; s < endAbs; s += 7) {
      var d = new Date(s * DAY_MS);
      var h = core.gregorianToHebrew(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      var isHol = isHolidayShabbat(core, h.hebrewMonthName, h.hebrewDay);
      list.push({ abs: s, holiday: isHol });
    }
    return list;
  }

  function countAvailable(shabbatot) {
    var n = 0;
    for (var i = 0; i < shabbatot.length; i++) {
      if (!shabbatot[i].holiday) n++;
    }
    return n;
  }

  /** Build a reading list from a parasha slice, applying the given joins. */
  function buildReadings(parashotSlice, joins) {
    var result = [];
    var i = 0;
    while (i < parashotSlice.length) {
      var joinKey = i + "+" + (i + 1);
      if (joins.has(joinKey) && i + 1 < parashotSlice.length) {
        result.push({ name: parashotSlice[i] + " / " + parashotSlice[i + 1], joined: true });
        i += 2;
      } else {
        result.push({ name: parashotSlice[i], joined: false });
        i++;
      }
    }
    return result;
  }

  /** Assign readings to Shabbatot, writing into schedule map. */
  function assignReadings(schedule, shabbatot, readings) {
    var readIdx = 0;
    for (var si = 0; si < shabbatot.length; si++) {
      if (shabbatot[si].holiday) {
        schedule.set(shabbatot[si].abs, { name: "Holiday reading", holiday: true });
      } else if (readIdx < readings.length) {
        schedule.set(shabbatot[si].abs, readings[readIdx]);
        readIdx++;
      }
    }
  }

  // ---- Scheduling engine ----

  /**
   * Compute the parasha schedule for a reading CYCLE.
   *
   * The cycle starts with Bereshit on the first Shabbat AFTER Simchat Torah
   * (Tishrey 23) of hebrewYear, and runs until Simchat Torah of hebrewYear+1.
   *
   * KEY ANCHOR RULE:
   *   Devarim (#44, index 43) is ALWAYS read on Shabbat Chazon —
   *   the last Shabbat on or before 9 Av.
   *   Vaetchanan (#45, index 44) therefore ALWAYS falls on Shabbat Nachamu —
   *   the first Shabbat after 9 Av.
   *
   * The schedule is split into two segments around this anchor:
   *   Segment 1: Bereshit (0) → Masei (42)   — 43 parashot
   *   Segment 2: Devarim (43) → Haazinu (52)  — 10 parashot
   *
   * Returns a Map: absoluteDay -> { name, joined, holiday, simchatTorah }
   */
  function computeCycleSchedule(hebrewYear) {
    var core = global.HebrewCore;
    if (!core) return new Map();

    // ---- Key dates ----
    var simchatTorahAbs = core.absoluteFromHebrew(hebrewYear, "Tishrey", 23);
    var nextSimchatTorahAbs = core.absoluteFromHebrew(hebrewYear + 1, "Tishrey", 23);
    var tishaBAv_abs = core.absoluteFromHebrew(hebrewYear, "Av", 9);

    // First Shabbat STRICTLY AFTER Simchat Torah → Bereshit
    var stWd = new Date(simchatTorahAbs * DAY_MS).getUTCDay();
    var daysToSat = (6 - stWd + 7) % 7;
    if (daysToSat === 0) daysToSat = 7;
    var bereshitShabbat = simchatTorahAbs + daysToSat;

    // Shabbat Chazon: last Shabbat on or before 9 Av → Devarim
    var tbWd = new Date(tishaBAv_abs * DAY_MS).getUTCDay();
    var daysBack = (tbWd + 1) % 7; // days from prev Saturday to this day
    var shabbatChazon = tishaBAv_abs - daysBack;

    // =============== Segment 1: Bereshit → Masei ===============
    // Shabbatot from bereshitShabbat to the Shabbat BEFORE shabbatChazon.
    var seg1Shabbatot = collectShabbatot(core, bereshitShabbat, shabbatChazon);
    var seg1Available = countAvailable(seg1Shabbatot);

    var seg1Parashot = PARASHA_ORDER.slice(0, 43); // indices 0–42
    var seg1Surplus = seg1Parashot.length - seg1Available;

    // Joinable pairs within Segment 1 (by index in seg1Parashot)
    var seg1JoinPriority = [
      [41, 42],  // Matot + Masei
      [26, 27],  // Tazria + Metzora
      [28, 29],  // Achrei Mot + Kedoshim
      [31, 32],  // Behar + Bechukotai
      [21, 22],  // Vayakhel + Pekudei
      [38, 39],  // Chukat + Balak
    ];

    var seg1Joins = new Set();
    var rem1 = seg1Surplus;
    for (var ji = 0; ji < seg1JoinPriority.length && rem1 > 0; ji++) {
      seg1Joins.add(seg1JoinPriority[ji][0] + "+" + seg1JoinPriority[ji][1]);
      rem1--;
    }

    var seg1Readings = buildReadings(seg1Parashot, seg1Joins);

    // =============== Segment 2: Devarim → Haazinu ===============
    // Shabbatot from shabbatChazon to last Shabbat before next Simchat Torah.
    var seg2Shabbatot = collectShabbatot(core, shabbatChazon, nextSimchatTorahAbs);
    var seg2Available = countAvailable(seg2Shabbatot);

    var seg2Parashot = PARASHA_ORDER.slice(43, 53); // indices 0–9 within seg2
    var seg2Surplus = seg2Parashot.length - seg2Available;

    // Only possible join in Segment 2: Nitsavim + Vayelech
    // They are indices 7 and 8 within seg2Parashot.
    var seg2Joins = new Set();
    if (seg2Surplus > 0) {
      seg2Joins.add("7+8");
    }

    var seg2Readings = buildReadings(seg2Parashot, seg2Joins);

    // =============== Assign to Shabbatot ===============
    var schedule = new Map();
    assignReadings(schedule, seg1Shabbatot, seg1Readings);
    assignReadings(schedule, seg2Shabbatot, seg2Readings);

    // Vezot Haberakhah on next Simchat Torah (if it falls on Shabbat)
    var nextSTWeekday = new Date(nextSimchatTorahAbs * DAY_MS).getUTCDay();
    if (nextSTWeekday === 6) {
      schedule.set(nextSimchatTorahAbs, {
        name: "Vezot Haberakhah",
        joined: false,
        simchatTorah: true
      });
    }

    return schedule;
  }

  // ---- Cache ----
  // Keyed by the cycle-start year (the Hebrew year whose Simchat Torah
  // begins the cycle).
  var scheduleCache = {};

  /**
   * Determine which reading cycle a given absolute day belongs to.
   * The cycle for year Y covers dates AFTER Tishrey 23 of Y
   * through Tishrey 23 of Y+1 (inclusive, for Vezot Haberakhah).
   */
  function cycleYearForAbs(core, abs) {
    // Get the Hebrew date to find a starting estimate
    var d = new Date(abs * DAY_MS);
    var h = core.gregorianToHebrew(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    var hy = h.hebrewYear;

    var simchatTorahAbs = core.absoluteFromHebrew(hy, "Tishrey", 23);

    if (abs > simchatTorahAbs) {
      // After Simchat Torah of this Hebrew year → belongs to this year's cycle
      return hy;
    } else {
      // On or before Simchat Torah → belongs to the previous year's cycle
      return hy - 1;
    }
  }

  function getParashaForDate(gregYear, gregMonth, gregDay) {
    var core = global.HebrewCore;
    if (!core) return null;

    var abs = Math.floor(Date.UTC(gregYear, gregMonth, gregDay) / DAY_MS);
    var weekday = new Date(abs * DAY_MS).getUTCDay();
    if (weekday !== 6) return null; // not Shabbat

    var cy = cycleYearForAbs(core, abs);

    if (!scheduleCache[cy]) {
      scheduleCache[cy] = computeCycleSchedule(cy);
    }

    return scheduleCache[cy].get(abs) || null;
  }

  function getParashaForHebrewDate(hebrewYear, hebrewMonth, hebrewDay) {
    var core = global.HebrewCore;
    if (!core) return null;

    var g = core.gregorianFromHebrew(hebrewYear, hebrewMonth, hebrewDay);
    if (g.weekday !== 6) return null;

    var abs = Math.floor(g.date.getTime() / DAY_MS);
    var cy = cycleYearForAbs(core, abs);

    if (!scheduleCache[cy]) {
      scheduleCache[cy] = computeCycleSchedule(cy);
    }

    return scheduleCache[cy].get(abs) || null;
  }

  // ---- Detail popup ----

  var popupOverlay = null;

  function createPopup() {
    if (popupOverlay) return;
    popupOverlay = document.createElement("div");
    popupOverlay.className = "parasha-popup-overlay";
    popupOverlay.style.display = "none";
    popupOverlay.addEventListener("mousedown", function (e) {
      if (e.target === popupOverlay) closePopup();
    });
    document.body.appendChild(popupOverlay);
  }

  function closePopup() {
    if (popupOverlay) popupOverlay.style.display = "none";
  }

  function renderPopupContent(parashaName, box) {
    var names = parashaName.split(" / ");
    var infos = names.map(function (n) { return getParashaInfo(n.trim()); }).filter(Boolean);

    var closeBtn = document.createElement("button");
    closeBtn.className = "parasha-popup-close";
    closeBtn.textContent = "\u00D7";
    closeBtn.addEventListener("click", closePopup);
    box.appendChild(closeBtn);

    if (!infos.length) {
      var p = document.createElement("p");
      p.textContent = "No details available for " + parashaName;
      box.appendChild(p);
      return;
    }

    infos.forEach(function (info) {
      var title = document.createElement("h3");
      title.className = "parasha-popup-title";
      title.textContent = info.name;
      box.appendChild(title);

      var details = [
        ["Book", info.book],
        ["Torah portion", info.torah],
        ["Haftarah", info.haftarah],
      ];
      if (info.psukim != null && info.psukim !== undefined) {
        details.splice(2, 0, ["Psukim (verses)", String(info.psukim)]);
      }
      details.forEach(function (d) {
        var row = document.createElement("div");
        row.className = "parasha-popup-row";
        var label = document.createElement("span");
        label.className = "parasha-popup-label";
        label.textContent = d[0] + ": ";
        var value = document.createElement("span");
        value.textContent = d[1];
        row.appendChild(label);
        row.appendChild(value);
        box.appendChild(row);
      });

      var linksWrap = document.createElement("div");
      linksWrap.className = "parasha-popup-links";

      if (info.url) {
        var linkSefaria = document.createElement("a");
        linkSefaria.className = "parasha-popup-link";
        linkSefaria.href = info.url;
        linkSefaria.target = "_blank";
        linkSefaria.rel = "noopener noreferrer";
        linkSefaria.textContent = "Read on Sefaria \u2192";
        linksWrap.appendChild(linkSefaria);
      }
      if (info.chabadUrl) {
        var linkChabad = document.createElement("a");
        linkChabad.className = "parasha-popup-link parasha-popup-link-chabad";
        linkChabad.href = info.chabadUrl;
        linkChabad.target = "_blank";
        linkChabad.rel = "noopener noreferrer";
        linkChabad.textContent = "Read on Chabad.org \u2192";
        linksWrap.appendChild(linkChabad);
      }
      box.appendChild(linksWrap);
    });
  }

  function showParashaPopup(parashaName) {
    createPopup();

    var box = document.createElement("div");
    box.className = "parasha-popup-box";

    function showContent() {
      box.innerHTML = "";
      renderPopupContent(parashaName, box);
      popupOverlay.innerHTML = "";
      popupOverlay.appendChild(box);
      popupOverlay.style.display = "flex";
    }

    if (parashaData) {
      showContent();
    } else {
      loadParashaData(function () {
        showContent();
      });
    }
  }

  // ---- Public API ----

  global.Parashot = {
    loadParashaData: loadParashaData,
    getParashaForDate: getParashaForDate,
    getParashaForHebrewDate: getParashaForHebrewDate,
    showParashaPopup: showParashaPopup,
    getParashaInfo: getParashaInfo,
  };

})(typeof window !== "undefined" ? window : globalThis);
