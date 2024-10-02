interface IEnv {
  BOT_TOKEN: string; // Get it from @BotFather https://core.telegram.org/bots#6-botfather
  BOT_SECRET: string; // A-Z, a-z, 0-9, _ and -
}

/**
 * Return url to telegram api, optionally with parameters added
 */
export const onRequest: PagesFunction<IEnv> = async (ctx) => {
  // Check secret
  if (
    ctx.request.headers.get("X-Telegram-Bot-Api-Secret-Token") !==
    ctx.env.BOT_SECRET
  ) {
    return new Response("Unauthorized", { status: 403 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: any = await ctx.request.json();

  const d = JSON.stringify(update)
  if("game_short_name" in update) {
    console.log('game found in ', d)
  } else {
    console.log('game NOT found in ', d)
  }

  if("game_short_name" in update) {
    const d2 = {
      callback_query_id: update.callback_query.id,
      url: 'https://telegram-kit-embedded-wallet-react-boilerplate.pages.dev',
    }
    console.log('respond with ', d2)
    const r: { ok: boolean } = await (
      await fetch(
        apiUrl(ctx.env.BOT_TOKEN, "answerCallbackQuery", d2),
      )
    ).json();
    return new Response("ok" in r && r.ok ? "Ok" : JSON.stringify(r, null, 2));
  } else if ("message" in update) {
    const r: { ok: boolean } = await (
      await fetch(
        apiUrl(ctx.env.BOT_TOKEN, "sendMessage", {
          chat_id: update.message.chat.id,
          text: update.message.text,
        }),
      )
    ).json();
    return new Response("ok" in r && r.ok ? "Ok" : JSON.stringify(r, null, 2));
  } else {
    return new Response(
      JSON.stringify({ result: "no message in update" }, null, 2),
    );
  }
};

/**
 * Return url to telegram api, optionally with parameters added
 */
function apiUrl(
  botToken: string,
  methodName: string,
  params: Record<string, string>,
) {
  let query = "";
  if (params) {
    query = "?" + new URLSearchParams(params).toString();
  }
  return `https://api.telegram.org/bot${botToken}/${methodName}${query}`;
}
