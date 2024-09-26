import {} from "@0xsequence/network";

interface IEnv {
  PROJECT_ACCESS_KEY: string; // From sequence.build
}

function fastResponse(message: string, status = 400) {
  return new Response(message, { status });
}

export const onRequest: PagesFunction<IEnv> = async (ctx) => {
  try {
    if (ctx.request.method === "POST") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body = (await ctx.request.text()) as any;
      // TODO
      // use the credential in the body to request a session token 
      // redirect the user to the app, with a cookie

      console.log(body.split('&'))
      return fastResponse(body.split('&').join('\n'), 200);
    } else {
      return fastResponse(`Method not supported: ${ctx.request.method}`, 405);
    }
  } catch (err) {
    console.error(`error: ${err}`);
    return fastResponse(err, 500);
  }
};
