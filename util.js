const fetch = require("node-fetch");
const { buildApiUrl, SOURCES } = require("@sttm/banidb");

const granthLabels = { sggs: "G", dg: "D" };

const baniDB = options => fetch(buildApiUrl(options)).then(r => r.json());

const toLine = (shabad, formatting = true) =>
  [
    shabad.gurbani.unicode,
    formatting
      ? `_${shabad.translation.english.ssk}_`
      : shabad.translation.english.ssk
  ].join("\n    ");

const toSearchResult = shabad => `
🔵 ${shabad.source.english}:${shabad.pageno} - ${shabad.writer.english} /s${
  shabad.shabadid
}

${toLine(shabad)}`;

const toSearchResults = shabads => `
Found ${shabads.length} results.
${shabads.map(s => toSearchResult(s.shabad)).join("\n")}
`;

const toShabad = ({ shabadinfo: shabad, gurbani }) => `
${shabad.source.english}:${shabad.pageno} - ${shabad.writer.english}

${gurbani.map(({ shabad }) => toLine(shabad)).join("\n\n")}

/s${shabad.id}
`;

const toAng = ({ page, source: { english: source, pageno, id } }) => [
  `${source} ${pageno}`,
  page.map(({ shabad }) => toLine(shabad, false)).join("\n\n"),
  { source, pageno, id }
];

const toAngParts = ({ page, source: { english: source, pageno } }) => [
  `${source} ${pageno}`,
  page
    .slice(0, page.length / 2)
    .map(({ shabad }) => toLine(shabad))
    .join("\n\n"),
  page
    .slice(page.length / 2)
    .map(({ shabad }) => toLine(shabad))
    .join("\n\n")
];

const prepareMessageText = ({ prefix, text, suffix, limit = 4096 }) =>
  `${prefix}\n\n${text.slice(
    0,
    limit - prefix.length - suffix.length - 10
  )}...${suffix}`;

const toShabadURL = shabad =>
  `https://www.sikhitothemax.org/shabad?id=${shabad.shabadid}&highlight=${
    shabad.id
  }`;

const toAngURL = (ang, id) =>
  `https://www.sikhitothemax.org/ang?ang=${ang}&source=${id}`;

module.exports = {
  toAngURL,
  toShabadURL,
  prepareMessageText,
  SOURCES,
  granthLabels,
  baniDB,
  toLine,
  toSearchResult,
  toSearchResults,
  toShabad,
  toAng,
  toAngParts
};
