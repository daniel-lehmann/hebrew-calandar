# Parashot (weekly Torah readings)

## What is shown

On **Saturdays (Shabbat)**, the calendar shows which **parasha** (weekly Torah portion) is read that week. The name appears in the cell (e.g. *Bereshit*, *Yitro*, *Vaetchanan*). On festival Shabbatot (e.g. Pesach, Shavuot), the regular parasha is not read; the app shows *Holiday reading* instead.

## Click for details

Clicking a parasha name opens a **popup** with:

- **Book** (e.g. Genesis, Exodus)
- **Torah portion** (e.g. Exodus 18:1–20:23)
- **Psukim (verses)** — number of verses in the portion
- **Haftarah** — accompanying prophetic reading
- **Read on Sefaria →** — link to the text on Sefaria.org
- **Read on Chabad.org →** — link to the parasha page on Chabad.org

For **double parashot** (e.g. *Matot / Masei*), the popup shows details for each portion.

## Scheduling rules

The app follows standard scheduling rules:

- The cycle **starts** with *Bereshit* on the first Shabbat **after** Simchat Torah.
- The cycle **ends** with *Vezot Haberakhah* on Simchat Torah (when it falls on Shabbat).
- *Devarim* is always read on **Shabbat Chazon** (the Shabbat on or before 9 Av).
- *Vaetchanan* is always read on **Shabbat Nachamu** (the Shabbat after 9 Av).
- When there are fewer Shabbatot than portions, certain pairs are combined (e.g. Matot+Masei, Tazria+Metzora) according to common practice.

Details are loaded from `data/parashot.json` (and embedded in `data/parashot-data.js` so the popup works when opening the app as a local file).
