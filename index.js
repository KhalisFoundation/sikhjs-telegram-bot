const TelegramBot = require('node-telegram-bot-api');
const { granthLabels, khajana, toSearchResults, toShabad, toAngParts } = require('./util');

const TOKEN = '<INSERT-YOUR-TOKEN-HERE>';
const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/\/(sggs|dg)(\d+)/, ({ chat: { id } }, [string, granth, ang]) =>
  khajana({ ang, source: granthLabels[granth] })
    .then(shabad => {
      const [meta, part1, part2] = toAngParts(shabad);
      bot.sendMessage(id, meta);
      bot
        .sendMessage(id, part1)
        .then(() => bot.sendMessage(id, part2));
    })
);

bot.onText(/\/s(\d+)/, ({ chat: { id: chatId } }, [string, id]) => khajana({ id })
  .then(shabad => bot.sendMessage(chatId, toShabad(shabad)))
);

bot.onText(/\/search (.+)/, ({ chat: { id } }, [string, q]) =>
  khajana({ q, source: 'all', type: 1 })
    .then(({ shabads }) => bot.sendMessage(id, toSearchResults(shabads)))
);

bot.onText(/\/help/, ({ chat: { id } }) => bot
  .sendMessage(id, `
ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖਾਲਸਾ
ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫਤਹਿ

Welcome to SikhJSBot

I can help you fetch Gurbani right from Telegram.

* Use \`/search@SikhJSBot jqmvh\` to search a shabad that has a line containing first letters of words as
  ਜ(j) ਤ(q) ਮ(m) ਵ(v) ਹ(h)
  Use the following image to learn how to type Gurmukhi in Roman Script.
  * Search results of above query will have links like \`/s123\`. Click those to view the shabad.

* Use \`/sggs123@SikhJSBot\` to load Ang 123 from Sri Guru Granth Sahib Jee.

* Use \`/dg123@SikhJSBot\` to load Ang 123 from Dasveh Patsaahi Ka Granth (aka Dasam Granth, Bachitar Natak Granth)

You can always user \`/help@SikhJSBot\` to bring this information again.
Contact @bogas04 in case of any issue.
  `)
  .then(() => bot.sendPhoto(id, 'http://www.jattsite.com/infos/infosbilder/03a-anlmolLipi-key-map.jpg'))
);

bot.on('message', ({ chat: { id } }) => bot.sendMessage(id, 'Loading...\nUse /help for more info.'));
