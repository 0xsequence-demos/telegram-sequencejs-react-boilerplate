import { onRequest as endpointHandler } from "./api/endpoint";
import { onRequest as registerWebhookHandler } from "./api/registerWebhook";
import { onRequest as unregisterWebhookHandler } from "./api/unregisterWebhook";

export interface Env {
  BOT_TOKEN: string;
  BOT_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    void ctx;
    const url = new URL(request.url);

    // Route the request to the appropriate handler
    switch (url.pathname) {
      case "/api/endpoint":
        return endpointHandler({ request, env });
      case "/api/registerWebhook":
        return registerWebhookHandler({ request, env });
      case "/api/unregisterWebhook":
        return unregisterWebhookHandler({ request, env });
      default:
        return new Response("Not found", { status: 404 });
    }
  },
};
