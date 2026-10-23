// Handler modules register against the router on import (side effects first).
import "@/server/handlers/auth";
import "@/server/handlers/courses";
import "@/server/handlers/storefront";
import "@/server/handlers/checkout";
import "@/server/handlers/learner";
import "@/server/handlers/creator";
import "@/server/handlers/admin";
import { dispatch } from "@/server/router";

export const dynamic = "force-dynamic";

async function handle(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  return dispatch(req, path);
}

export {
  handle as GET,
  handle as POST,
  handle as PUT,
  handle as PATCH,
  handle as DELETE,
};
