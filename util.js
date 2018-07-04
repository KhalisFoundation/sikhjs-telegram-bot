const fetch = require("node-fetch");
const { buildApiUrl, SOURCES } = require("@sttm/banidb");

const granthLabels = { sggs: "G", dg: "D" };

const khajana = options => fetch(buildApiUrl(options)).then(r => r.json());

const toLine = shabad =>
  [shabad.gurbani.unicode, shabad.translation.english.ssk].join("\n    ");

const toSearchResult = shabad => `
${shabad.source.english}:${shabad.pageno} - ${shabad.writer.english}

${toLine(shabad)}

/s${shabad.shabadid}
`;

const toSearchResults = shabads => `
Found ${shabads.length} results.

${shabads.map(s => toSearchResult(s.shabad)).join("\n\n")}
`;

const toShabad = ({ shabadinfo: shabad, gurbani }) => `
${shabad.source.english}:${shabad.pageno} - ${shabad.writer.english}

${gurbani.map(({ shabad }) => toLine(shabad)).join("\n\n")}

/s${shabad.id}
`;

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

module.exports = {
  granthLabels,
  khajana,
  toLine,
  toSearchResult,
  toSearchResults,
  toShabad,
  toAngParts
};
