# Hebrew Calendar App — Architecture & File Reference

This document describes how the app is built and what each file does. Use it when making changes or onboarding.

---

## Overall Architecture

- **Stack:** Static HTML + CSS + vanilla JavaScript. No build step; open `index.html` in a browser or deploy as static files.
- **Script load order:** Scripts are loaded in dependency order in `index.html`. Core/helpers first, then view/search, then `main.js` which wires everything and runs `setupUI()` on load.
- **Globals:** Each JS module attaches to `window` (or `globalThis`) with a single namespace (e.g. `HebrewCore`, `View`, `Stats`). There is no bundler; modules rely on load order.
- **Data:** Parashot data is either embedded via `data/parashot-data.js` (`window.PARASHOT_JSON`) or loaded at runtime from `data/parashot.json` via XHR.

---

## Entry & Shell

### `index.html`
- Single-page shell: header, controls, calendar grid, stats section (buttons + panels + charts), footer.
- **Controls:** Month/year (Gregorian) or Hebrew month/year, “Go”, “Hebrew View” toggle. Search is injected by `search.js` into the controls section.
- **Calendar:** One panel with nav arrows (prev/next month, prev/next year) and `#combined-calendar` grid filled by `View`.
- **Stats:** Row of stat buttons; each opens a panel (histogram, list, holiday graph, dehiyyot, moon graph, Rambam Kiddush HaChodesh, Rambam sun calc). Rambam verses (12:1, 12:2, 13:4, 14:1–14:2, 14:3–14:4) are under the Rambam Kiddush HaChodesh verse dropdown. Chart.js canvases and a `<pre id="stats-output">` for text output.
- **Scripts (order):** Chart.js (CDN) → `api.js` → `moon.js` → `hebrew-core.js` → `stats.js` → `rambam-mean-sun.js` → `rambam-helpers.js` → `rambam-sun-calc.js` → `rambam-moon-mean.js` → `rambam-moon-mean-path.js` → `view.js` → `search.js` → `data/parashot-data.js` → `parashot.js` → `main.js`.

---

## Core Logic (no DOM)

### `js/hebrew-core.js`
Hebrew calendar arithmetic. Exposes **`HebrewCore`** (and `module.exports` in Node).

**Data / constants:**
- `HEBREW_MONTHS`, `HEBREW_HOLIDAYS`
- Epoch: Molad Tishrei 5786 (Monday 22 Sep 2025, 18h 187 parts); chalakim constants; postponement thresholds (Molad Zaken, BeTU'TeKPaT, GaTRaD)

**Functions:**
- `isLeapYearHebrew(year)` — 19-year cycle leap check
- `monthsBetweenYears(fromYear, toYear)` — month count between Hebrew years
- `moladTishreyMs(year)` — molad Tishrei as ms since Unix epoch
- `getMoladTishrei(year)` — `{ date, weekday, hour, chalakim }` for calendar display
- `tishrei1Date(year)` — `Date` of Rosh Hashanah (with dehiyyot)
- `tishrei1Dehiyyot(year)` — `{ date, weekday, rules: { A, B, C, D } }` for stats
- `absoluteFromDate(date)`, `absoluteFromGregorian(y,m,d)`, `absoluteFromHebrew(y,monthName,day)` — day numbers
- `tishrei1Absolute(year)`, `hebrewYearLength(year)`
- `yearMonths(year)` — `[{ name, length }, ...]` for the year (includes Adar2 in leap years)
- `gregorianToHebrew(year, monthIndex, day)` — `{ hebrewYear, hebrewMonthIndex, hebrewMonthName, hebrewDay }`
- `gregorianFromHebrew(year, monthName, day)` — `{ year, monthIndex, day, weekday, date }`
- `guessHebrewYearForGregorian(gYear)` — approximate Hebrew year from Gregorian year

---

### `js/stats.js`
Statistical queries on the Hebrew calendar. Uses `HebrewCore`. Exposes **`Stats`**.

**Functions:**
- `summarizeEarliestPesach()` — text table of earliest Gregorian dates per holiday (2000 years)
- `summarizeLatestHolidays()` — latest occurrences
- `listTishrei1Years()`, `listHebrewDateYears(monthName, day, countYears, label)` — list of years with Gregorian dates for a Hebrew date
- `tishrei1WeekdayHistogram()`, `tishrei1HistogramData()` — legacy text / data for 1 Tishrey
- `weekdayHistogramData(monthName, day, label)` — `{ label, labels, data }` for Chart.js bar chart (day-of-week histogram)
- `holidayDateGraph(holidayName)` — ASCII art graph (legacy)
- `holidayDateSeries(holidayName, countYears)` — `{ holidayName, years, dayOfYear, gregDates, weekdays }` for line chart
- `simplifiedDayOfYear(monthIndex, day)` — 1–365 with Feb = 28 days (for chart scale)
- `dehiyyotStatsData(numYears)` — `{ rules, timeline, startYear, endYear, totalYears }` for postponement stats and viz

---

### `js/moon.js`
Real new-moon / full-moon times (Meeus-style). Exposes **`Moon`**.

**Constants:** `JD_2000_UT`, `LUNATION_DAYS`, `HEBREW_MONTH_DAYS`, `MEAN_SYNODIC_MONTH_DAYS`, `LUNATIONS_PER_YEAR`, Jerusalem offset for “29d 12h 793h” definition.

**Functions:**
- `newMoonJD(N)`, `trueNewMoonJD(N)` — mean and corrected new moon Julian Date (UT)
- `fullMoonJD(N)` — full moon JD
- `jdToDate(jd)`, `dateToJD(d)` — JD ↔ Date
- `lunationNumber(d)` — lunation index for a date
- `phaseAt(d)` — `{ phase, ageDays, nextNew, nextFull }`
- `hebrewMonthDays()` — 29d 12h 793h in days
- `newMoonVsDefinition(N)` — `{ jd, definitionJD, hoursLater }` (true new moon vs halachic definition)
- `newMoonVsDefinitionSeries(countMonths, endLunation)`, `newMoonVsDefinitionRange(startN, endN)` — for moon graph

---

### `js/api.js`
Placeholder API layer. Exposes **`Api`**.

**Functions:**
- `fetchHebrewCalendarConfig()` — returns `Promise.resolve({ epochHebrewYear: 5786 })` (could later call a server)

---

## View & UI (DOM)

### `js/view.js`
Renders calendars into the DOM. Exposes **`View`**. Depends on `HebrewCore` and optionally `Parashot`.

**Functions:**
- `populateMonthSelector(selectEl)` — Gregorian month names
- `populateHebrewMonthSelector(selectEl, hebrewYear)` — Hebrew months for that year (incl. Adar2)
- `renderHeaders(container)` — weekday row (Sun–Sat)
- `renderGregorianCalendar(container, year, monthIndex)` — Gregorian-only grid
- `renderCombinedCalendar(container, gregorianYear, monthIndex, hebrewDayInfoFn, onHolidayNav)` — combined grid: Gregorian + Hebrew, holidays with nav arrows, parasha on Shabbat, molad Tishrei
- `renderHebrewCalendar(...)` — Hebrew-primary grid (legacy path)
- `renderHebrewMonthCalendar(container, hebrewYear, hebrewMonthName, onHolidayNav)` — Hebrew month as primary with Gregorian as sub; holidays, parasha, molad
- `findHolidayForHebrewDate(monthName, day)` — holiday name or ""
- `findHolidayObjForHebrewDate(monthName, day)` — holiday object or null

---

### `js/main.js`
Wires the app: controls, calendar nav, view toggle, search, stat buttons, panels, and Chart.js (holiday line, histogram, moon graph, dehiyyot viz). No global name; runs in an IIFE and calls `setupUI()` once.

**Notable behavior:**
- **Calendar:** Gregorian or Hebrew view; `renderCurrent()` calls `View.renderCombinedCalendar` or `View.renderHebrewMonthCalendar`; parasha data loaded before first render if available.
- **Search:** `Search.setupSearch({ core, buttonParent, onSelect })` — onSelect navigates calendar (Hebrew or Gregorian) and closes overlay.
- **Stats:** Each stat button shows one panel and hides others; “Back” clears panels and restores buttons. Holiday graph with optional year slider and cycle-mode (19-year) graph; moon graph with “lines only” and years slider; dehiyyot table + timeline + click-to-jump to Tishrei 1.
- **Charts:** Holiday line chart, Tishrei histogram, moon line chart created/destroyed in place; constants for default years and max visible points.

---

### `js/search.js`
Unified search popup (Ctrl+J or search icon). Exposes **`Search`**.

**Functions:**
- `setupSearch(opts)` — `opts: { core, buttonParent, onSelect }`. Creates overlay, input, results list; inserts search button into `buttonParent`; wires Ctrl+J, Escape, arrows, Enter.

**Internal (suggestion engine):**
- `openPopup()`, `closePopup()` — show/hide overlay
- `refreshSuggestions()`, `generateSuggestions(query)` — builds list from holidays, Hebrew dates, Gregorian dates, numeric formats
- `matchHolidays(q)`, `matchHebrewDates(q)`, `matchGregorianDates(q)`, `matchNumeric(q)` — typed matches; results have `label`, `detail`, `type` and either `gregYear/gregMonthIndex/gregDay` or `hebrewYear/hebrewMonthName/hebrewDay` for `onSelect`.

---

## Parashot (scheduling + data)

### `js/parashot.js`
Weekly parasha scheduling and detail popup. Exposes **`Parashot`**. Depends on `HebrewCore` and `window.PARASHOT_JSON` or `data/parashot.json`.

**Functions:**
- `loadParashaData(callback)` — ensures parasha data (XHR or embedded), then calls callback
- `getParashaInfo(name)` — returns parasha record from data or null
- `getParashaForDate(gregYear, gregMonth, gregDay)` — `{ name, joined, holiday }` or null (Shabbat only)
- `getParashaForHebrewDate(hebrewYear, hebrewMonth, hebrewDay)` — same, keyed by Hebrew date
- `showParashaPopup(parashaName)` — builds overlay and shows name, book, Torah/Haftarah, links (Sefaria, Chabad)

**Scheduling (internal):**
- `computeCycleSchedule(hebrewYear)` — from first Shabbat after Simchat Torah to next Simchat Torah; anchor: Devarim on Shabbat Chazon (last Shabbat on or before 9 Av); join pairs when needed. Returns `Map(absoluteDay -> { name, joined, holiday, simchatTorah })`.
- `cycleYearForAbs(core, abs)`, `collectShabbatot`, `countAvailable`, `buildReadings`, `assignReadings`, `isHolidayShabbat` — used by `computeCycleSchedule`. Cached per cycle year.

---

### `data/parashot-data.js`
Defines `window.PARASHOT_JSON`: array of `{ name, book, torah, haftarah, url, psukim?, chabadUrl? }` for all 54 parashot. Used if JSON file is not loaded.

### `data/parashot.json`
Same structure as above; loaded by `parashot.js` when not embedded.

---

## Rambam (Kiddush HaChodesh / sun)

### `js/rambam-helpers.js`
Shared angle and correction helpers. Exposes **`RambamHelpers`**.

**Functions:**
- `mod360(deg)` — normalize angle to [0, 360)
- `degToDms(deg)` — `{ d, m, s }`
- `formatDms(deg, omitSeconds)` — "d° m′ s″" or "d° m′"
- `TABLE_ROWS_13_4` — Rambam correction table (mean anomaly → degrees)
- `rambamCorrectionFromTable(meanAnomalyDeg)` — interpolated correction from table
- `rambamCorrectionFromEccentricity(meanAnomalyDeg, eccentricity)` — equation-of-center from eccentricity
- `rambamSunCorrection(meanAnomalyDeg, useRambamTable)` — main entry: table (rounded to degree) or exact eccentricity; used by sun-calc

---

### `js/rambam-mean-sun.js`
Rambam Hilchot Kiddush HaChodesh 12:1, 12:2, 13:4, 14:1–14:2, 14:3–14:4: verse dropdown, Hebrew + explanation, tables (sun 12:1/12:2/13:4; moon 14:1–14:2 from **RambamMoonMean**; moon mean path 14:3–14:4 from **RambamMoonMeanPath**), orbit visualization for 13:4, daily motion computation. Exposes **`RambamMeanSun`**.

**Functions:**
- `initRambamPanel()` — verse dropdown (12:1, 12:2, 13:4, 14:1–14:2, 14:3–14:4), Hebrew + explanation, sun table or moon block (14:1–14:2: cycle + table with 13° 10′ 35.03″ row) or moon mean-path block (14:3–14:4: cycle + table with 13° 3′ 54″), SVG orbit for 13:4, eccentricity and days input for 12:1/13:4. Binds verse change, eccentricity, and days input.

**Internal:** Verse data (`VERSES`), table rows (`TABLE_ROWS_12_1`, `TABLE_ROWS_12_2`, `TABLE_ROWS_13_4`), `clampEccentricity`, `anomalyForEccentricity`, `formatAngleDegrees`, `initVisualization` (SVG + animation), `degToDms`, `formatDms`, `updateDaysComputation`, `populateVerseSelect`, `updateComputationText`, `renderVerse`, `renderTable`.

---

### `js/rambam-sun-calc.js`
Sun position from epoch (Thursday Nisan 3 4938, 0h). Exposes **`RambamSunCalc`**. Depends on **RambamHelpers** and **HebrewCore**.

**Functions:**
- `daysFromEpoch(hebrewYear, hebrewMonth, hebrewDay, hebrewHour)` — fractional days from epoch (uses HebrewCore absolutes)
- `compute(days, useRambamTable)` — `{ sunAveragePlace, aphelionPlace, distanceFromAphelion, realPlace, correction }` in degrees; uses `RambamHelpers.rambamSunCorrection`
- `formatDms(deg, omitSeconds)` — delegate to RambamHelpers
- `buildMonthOptions(year)` — Hebrew months for year (for dropdown)
- `initPanel()` — year/month/day/hour and “Use Rambam calculation” checkbox; on change, recomputes and fills `#rambam-calc-output` (time from epoch + table)

**Constants:** `EPOCH_YEAR`, `EPOCH_MONTH`, `EPOCH_DAY`; sun average and aphelion at epoch; daily mean and aphelion motion.

---

### `js/rambam-moon-mean.js`
Rambam Hilchot Kiddush HaChodesh 14:1–14:2: mean motion of the moon (first mean movement — אמצע הירח; daily 13° 10′ 35″). Exposes **`RambamMoonMean`**. Depends on **RambamHelpers**.

**Functions:**
- `getVerseData()` — returns `{ hebrewText, englishSummary }` for 14:1–14:2 (used by Rambam mean sun panel verse dropdown).
- `renderMoonContent()` — fills cycle block and moon table inside the Rambam Kiddush HaChodesh panel; uses 13° 10′ 35.03″ for the dynamic calculation row.
- `initPanel()` — legacy; full standalone panel init (verse text, explanation, cycle, table).
- `getTableRows()` — for tests.

**Constants:** `MOON_DAILY_DEG` (13° 10′ 35″), `MOON_DAILY_DEG_EXACT` (13° 10′ 35.03″ for the calculation row), `CYCLE_DAYS`; table rows from 14:2; `SYNODIC_MONTH_DAYS`, `SIDEREAL_MONTH_DAYS`, `ANOMALISTIC_MONTH_DAYS` for comparison.

---

### `js/rambam-moon-mean-path.js`
Rambam Hilchot Kiddush HaChodesh 14:3–14:4: mean motion of the orbit (second mean movement — אמצעי המסלול; daily 13° 3′ 54″). Exposes **`RambamMoonMeanPath`**. Depends on **RambamHelpers**.

**Functions:**
- `getVerseData()` — returns `{ hebrewText, englishSummary }` for 14:3–14:4 (used by Rambam mean sun panel verse dropdown).
- `renderMoonPathContent()` — fills cycle block and table inside the Rambam Kiddush HaChodesh panel (time for one 360° cycle, comparison with synodic/sidereal/anomalistic month, table with optional dynamic days row).

**Constants:** `PATH_DAILY_DEG` (13° 3′ 54″), `CYCLE_DAYS`; table rows from 14:3–14:4; same month-length constants for comparison.

---

## Styles

### `styles.css`
Global layout and theme: app shell, controls, calendar grid, stats buttons/panels, search overlay, parasha popup, dehiyyot viz, Rambam panels, charts. Dark theme (e.g. `#0f172a`, `#e5e7eb`).

### `styles/rambam-sun-calc.css`
Rambam sun calc panel and orbit SVG styling.

---

## Data & Config

- **Parashot:** `data/parashot-data.js` (embedded) and/or `data/parashot.json`.
- **Epoch / config:** Currently in code (e.g. `hebrew-core.js` epoch 5786; `rambam-sun-calc.js` epoch 4938). `api.js` can later provide config.

---

## Scripts & Deploy

### `deploy-github-pages.ps1`
PowerShell script: checks git and remote, adds key files, commits, pushes to `gh-pages` (or given branch). No build step.

---

## Tests

- **`tests/run-hebrew-core-tests.js`** — Unit tests for HebrewCore (Gregorian ↔ Hebrew, Tishrei 1, dehiyyot, etc.). Run with Node.
- **`tests/rambam-sun-calc-epoch-test.js`** — Epoch / sun calc checks (Node).
- **`tests/rambam-helpers-check.js`** — RambamHelpers (e.g. correction at 86°).
- **`tests/test-parashot.js`** — Parasha scheduling / cycle tests.

Run from project root, e.g. `node tests/run-hebrew-core-tests.js`.

---

## Quick Reference: Who Calls Whom

| Consumer        | Depends on                          |
|----------------|--------------------------------------|
| main.js        | View, HebrewCore, Stats, Search, Parashot, Moon, RambamMeanSun, RambamSunCalc, RambamMoonMean, RambamMoonMeanPath |
| view.js        | HebrewCore, Parashot (optional)      |
| search.js      | HebrewCore (injected)                |
| stats.js       | HebrewCore                           |
| parashot.js    | HebrewCore, PARASHOT_JSON / parashot.json |
| rambam-sun-calc.js | RambamHelpers, HebrewCore        |
| rambam-moon-mean.js      | RambamHelpers                    |
| rambam-moon-mean-path.js | RambamHelpers                    |
| rambam-mean-sun.js      | (DOM only; optional RambamHelpers for display) |
| rambam-helpers.js | (standalone)                      |
| moon.js        | (standalone)                         |
| hebrew-core.js | (standalone)                         |

Use this file when planning changes: add new features in the appropriate layer (core vs view vs main), and keep DOM in view/main/Rambam panels and core logic in hebrew-core, stats, moon, and rambam-*.
