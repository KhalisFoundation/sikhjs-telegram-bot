const TelegramBot = require("node-telegram-bot-api");
const {
  granthLabels,
  baniDB,
  toSearchResults,
  toShabad,
  toAngParts
} = require("./util");

const TOKEN = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(
  /\/(sggs|dg)(\d+)/,
  async ({ chat: { id } }, [string, granth, ang]) => {
    console.log(`Loading ${granth}:${ang}`);
    const shabad = await baniDB({ ang, source: granthLabels[granth] });
    const [meta, part1, part2] = toAngParts(shabad);
    bot.sendMessage(id, meta);
    await bot.sendMessage(id, part1);
    bot.sendMessage(id, part2);
  }
);

bot.onText(/\/s(\d+)/, async ({ chat: { id: chatId } }, [string, id]) => {
  console.log(`Loading shabad "${id}"`);
  const shabad = await baniDB({ id });
  bot.sendMessage(chatId, toShabad(shabad), { parse_mode: "Markdown" });
});

bot.onText(/\/search (.+)/, async ({ chat: { id } }, [string, q]) => {
  console.log(`Loading search results of "${q}"`);
  const { shabads } = await baniDB({ q, source: "all", type: 1 });
  bot.sendMessage(id, toSearchResults(shabads), {
    parse_mode: "Markdown"
  });
});

bot.onText(/\/help/, async ({ chat: { id } }) => {
  await bot.sendMessage(id, WELCOME_MESSAGE, { parse_mode: "Markdown" });
  bot.sendPhoto(
    id,
    "https://www.sikhitothemax.org/assets/images/help/web-desktop-keyboard-map.png"
  );
});

bot.on("message", ({ chat: { id } }) =>
  bot.sendMessage(id, "🙏 \nUse /help for more info.")
);

const WELCOME_MESSAGE = `
ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖਾਲਸਾ
ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫਤਹਿ

Welcome to [SikhiToTheMax](https://SikhiToTheMax.org) GurbaniBot

I can help you fetch Gurbani right from Telegram.

➡️ Use \`/search@GurbaniBot jqmvh\` to search a shabad that has a line containing first letters of words as
  ਜ(j) ਤ(q) ਮ(m) ਵ(v) ਹ(h)
➡️ Use the following image to learn how to type Gurmukhi in Roman Script.
➡️ Search results of above query will have links like \`/s123\`. Click those to view the shabad.
➡️ Use \`/sggs123@GurbaniBot\` to load Ang 123 from Sri Guru Granth Sahib Jee.
➡️ Use \`/dg123@GurbaniBot\` to load Ang 123 from Sri Dasam Granth.

You can always user \`/help@GurbaniBot\` to bring this information again.
Contact @bogas04 in case of any issue.
  `;
