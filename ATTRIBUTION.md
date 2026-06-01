# Attribution & Third-Party Licenses

The Kanji app source code is licensed under the MIT License (see `LICENSE`).
The **data**, **fonts**, and **libraries** it relies on are the work of others
and are distributed under their own licenses, summarized below. The bundled
dataset in `public/data/` is a derivative of these sources and inherits their
terms — in particular **CC BY-SA 4.0** (attribution + share-alike) from the
EDRDG dictionaries.

## Kanji & dictionary data

- **KANJIDIC2** — kanji readings, meanings, stroke counts, radicals.
  © The Electronic Dictionary Research and Development Group (EDRDG).
  Licensed under **Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0)**.
  <https://www.edrdg.org/wiki/index.php/KANJIDIC_Project>

- **JMdict** — vocabulary words, readings, and glosses.
  © EDRDG. Licensed under **CC BY-SA 4.0**.
  <https://www.edrdg.org/jmdict/j_jmdict.html>

- **Tatoeba** — example sentences and translations.
  © Tatoeba contributors. Licensed under **CC BY 2.0 FR**.
  <https://tatoeba.org/>

- **JLPT level assignments** — Jonathan Waller's authoritative JLPT kanji lists,
  via [davidluzgouveia/kanji-data](https://github.com/davidluzgouveia/kanji-data).
  KANJIDIC2 alone cannot distinguish N2 from N3, so these lists provide the
  per-level JLPT tags.

- **Kanken (漢検) level assignments** — from
  [mimneko/kanji-data](https://github.com/mimneko/kanji-data) (**CC0**, based on
  the 漢検漢字辞典).

- **School-grade (教育漢字) assignments** — from the Japanese Ministry of
  Education kyōiku-kanji grade lists (also carried by KANJIDIC2's grade field).

- **Mongolian translations** (`meaningsMn` / `meaningMn` / `mongolian`) — were
  produced for this project with an LLM translation pass and are provided as-is.

## Stroke-order

- **Hanzi Writer** ([hanzi-writer](https://hanziwriter.org/)) — stroke-order
  animation and quiz. The library is MIT-licensed; its character data derives
  from the [Make Me a Hanzi](https://github.com/skishore/makemeahanzi) project
  (graphics under the **Arphic Public License**, data under LGPL/MIT).

## Fonts (served via Google Fonts)

- **Geist** / **Geist Mono** — © Vercel, **SIL Open Font License 1.1**.
- **Noto Sans JP** / **Noto Serif JP** — © Google, **SIL Open Font License 1.1**.
- **Klee One** — © Fontworks, **SIL Open Font License 1.1**.

## Notable code dependencies

React, Vite, Tailwind CSS, Zustand, React Router, Radix UI, and lucide-react —
each under its own permissive license (MIT / Apache-2.0). See `package.json`
and the respective projects for details.

---

If you redistribute the bundled dataset, you must retain attribution to the
sources above and keep the dictionary-derived portions under CC BY-SA 4.0.
