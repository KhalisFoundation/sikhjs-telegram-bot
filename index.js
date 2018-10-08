const TelegramBot = require("node-telegram-bot-api");
const {
  SOURCES,
  granthLabels,
  baniDB,
  toSearchResults,
  toLine,
  toShabad,
  prepareMessageText,
  toAngURL,
  toShabadURL,
  toAng,
  toAngParts
} = require("./util");

const TOKEN = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });
const parse_mode = "Markdown";

bot.on("inline_query", async ({ id, query }) => {
  const defaultResult = [
    {
      ...DEFAULT_INLINE_PARAMS,
      id: 1,
      title: "Need help?",
      description: "Click for more help",
      input_message_content: {
        message_text: WELCOME_MESSAGE_INLINE,
        parse_mode,
        disable_web_page_preview: false
      },
      url: `https://sttm.co`,
      hide_url: false
    }
  ];

  try {
    const q = query.trim();
    console.log(`Inline query! ${q}`);

    switch (false) {
      case !/^\d+$/.test(q): {
        console.log(`Numeric search "${q}"`);

        // Call API for fetching angs from all sources
        let results = await Promise.all(
          Object.keys(SOURCES).map(source => baniDB({ ang: q, source }))
        );

        results = []
          // Aggregate all results
          .concat(...results)
          // Transform to user content
          .map(toAng)
          // Filter null results
          .filter(r => r[2].source !== undefined)
          // Filter duplicates
          .filter(
            (i, index, arr) =>
              arr.findIndex(
                t => t[2].pageno === i[2].pageno && t[2].source === i[2].source
              ) === index
          )
          // Prepare response
          .map(
            ([
              description,
              message_text,
              {
                source,
                pageno,
                id: sourceID,
                _url: url = toAngURL(pageno, sourceID),
                _readMore = `\n[Read More](${url})`
              }
            ]) => ({
              ...DEFAULT_INLINE_PARAMS,
              id: `${sourceID}${pageno}`,
              title: description,
              description,
              input_message_content: {
                message_text: prepareMessageText({
                  prefix: description,
                  text: message_text,
                  suffix: _readMore
                }),
                parse_mode,
                disable_web_page_preview: true
              },
              url
            })
          );

        console.log(`Found ${results.length} results`);

        await bot.answerInlineQuery(id, defaultResult.concat(results));
        break;
      }
      case !q.includes(" "): {
        console.log(`Sentence search "${q}"`);
        let results = await Promise.all(
          [4, 3, 2].map(type => baniDB({ q, type, source: SOURCES.all }))
        );

        results = []
          // Aggregate all results
          .concat(
            ...results
              // transform to shabads
              .map(r => r.shabads)
              // filter undefined results
              .filter(r => r.length !== 0)
          )
          // Prepare response
          .map(({ shabad, _url: url = toShabadURL(shabad) }) => ({
            ...DEFAULT_INLINE_PARAMS,
            id: shabad.id,
            title: shabad.gurbani.unicode,
            description: shabad.translation.english.ssk,
            input_message_content: {
              message_text: `${toLine(shabad)}\n[Read Online](${url})`,
              parse_mode,
              disable_web_page_preview: false
            },
            url
          }));

        console.log(`Found ${results.length} results`);

        await bot.answerInlineQuery(id, defaultResult.concat(results));
        break;
      }
      case !(q.length > 2): {
        console.log(`Word search "${q}"`);

        let results = await Promise.all(
          [3, 1].map(type => baniDB({ q, type, source: SOURCES.all }))
        );

        results = []
          // Aggregate all results
          .concat(
            ...results
              // transform to shabads
              .map(r => r.shabads)
              // filter undefined results
              .filter(r => r.length !== 0)
          )
          // Prepare response
          .map(({ shabad, _url: url = toShabadURL(shabad) }) => ({
            ...DEFAULT_INLINE_PARAMS,
            id: shabad.id,
            title: shabad.gurbani.unicode,
            description: shabad.translation.english.ssk,
            input_message_content: {
              message_text: `${toLine(shabad)}\n[Read Online](${url})`,
              parse_mode,
              disable_web_page_preview: false
            },
            url
          }));

        console.log(`Found ${results.length} results`);

        await bot.answerInlineQuery(id, defaultResult.concat(results));
        break;
      }
    }
  } catch (err) {
    console.log(err.name, err.message);
  } finally {
    await bot.answerInlineQuery(id, defaultResult);
  }
});

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
  try {
    const shabad = await baniDB({ id });
    bot.sendMessage(chatId, toShabad(shabad), { parse_mode });
  } catch (err) {
    bot.sendMessage(
      chatId,
      `Sorry we couldn't get the shabad. Try reading it on the [website](https://sttm.co/s/${id}).`,
      { parse_mode }
    );
  }
});

bot.onText(/\/search (.+)/, async ({ chat: { id } }, [string, q]) => {
  console.log(`Loading search results of "${q}"`);
  const { shabads } = await baniDB({ q, source: "all", type: 1 });
  bot.sendMessage(id, toSearchResults(shabads), {
    parse_mode
  });
});

bot.onText(/\/help/, async ({ chat: { id } }) => {
  await bot.sendMessage(id, WELCOME_MESSAGE, { parse_mode });
  bot.sendPhoto(
    id,
    "https://www.sikhitothemax.org/assets/images/help/web-desktop-keyboard-map.png"
  );
});

bot.on("message", ({ chat: { id } }) =>
  bot.sendMessage(id, "🙏 \nUse /help for more info.")
);

const WELCOME_MESSAGE_INLINE = `
ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖਾਲਸਾ
ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫਤਹਿ

Welcome to [SikhiToTheMax](https://SikhiToTheMax.org) GurbaniBot

You've reached here by using inline feature.

➡️ Use \`@GurbaniBot hhqnh\` to search "har har tera naam hai" by first letters. Refer to [this keyboard](https://www.sikhitothemax.org/assets/images/help/web-desktop-keyboard-map.png).
➡️ Use \`@GurbaniBot mere man gur gur\` to search the shabad directly.
➡️ Use \`@GurbaniBot khalsa\` to search for english translations.
➡️ Use \`@GurbaniBot 123\` to load Ang 123 of various Granths.

You can always user \`/help@GurbaniBot\` to bring this information again.
Contact @bogas04 in case of any issue.`;

const WELCOME_MESSAGE = `
ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖਾਲਸਾ
ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫਤਹਿ

Welcome to [SikhiToTheMax](https://SikhiToTheMax.org) GurbaniBot.

You've reached here by using /help in a group with @GurbaniBot.
I can help you fetch Gurbani right from Telegram.

➡️ Use \`/search@GurbaniBot jqmvh\` to search a shabad that has a line containing first letters of words as
  ਜ(j) ਤ(q) ਮ(m) ਵ(v) ਹ(h)
➡️ Use the following image to learn how to type Gurmukhi in Roman Script.
➡️ Search results of above query will have links like \`/s123\`. Click those to view the shabad.
➡️ Use \`/sggs123@GurbaniBot\` to load Ang 123 from Sri Guru Granth Sahib Jee.
➡️ Use \`/dg123@GurbaniBot\` to load Ang 123 from Sri Dasam Granth.

You can always user \`/help@GurbaniBot\` to bring this information again.
Contact @bogas04 in case of any issue.`;

const DEFAULT_INLINE_PARAMS = {
  type: "article",
  thumb_url: `http://sttm.co/assets/images/sttm_icon.png`,
  thumb_width: 256,
  thumb_height: 256
};
