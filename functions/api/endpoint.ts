
interface IEnv {
  BOT_TOKEN: string; // Get it from @BotFather https://core.telegram.org/bots#6-botfather
  BOT_SECRET: string; // A-Z, a-z, 0-9, _ and -
}

/**
 * Return url to telegram api, optionally with parameters added
 */
export const onRequest: PagesFunction<IEnv> = async (ctx) => {
    // Check secret
    if (ctx.request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== ctx.env.BOT_SECRET) {
      return new Response('Unauthorized', { status: 403 })
    }
  
    // Read request body synchronously
    const update = await ctx.request.json()

    // Deal with response asynchronously
    await onUpdate(update)
  
    return new Response('Ok')
};

/**
 * Handle incoming Update
 * https://core.telegram.org/bots/api#update
 */
async function onUpdate (update) {
    if ('message' in update) {
      await onMessage(update.message)
    }
  }

/**
 * Handle incoming Message
 * https://core.telegram.org/bots/api#message
 */
function onMessage (message) {
  return sendPlainText(message.chat.id, 'Echo:\n' + message.text)
}

/**
 * Send plain text message
 * https://core.telegram.org/bots/api#sendmessage
 */
async function sendPlainText (chatId, text) {
  return (await fetch(apiUrl('sendMessage', {
    chat_id: chatId,
    text
  }))).json()
}
    

function apiUrl (methodName:string, params:Record<string, string>) {
let query = ''
  if (params) {
    query = '?' + new URLSearchParams(params).toString()
  }
  return `https://api.telegram.org/bot${TOKEN}/${methodName}${query}`
}