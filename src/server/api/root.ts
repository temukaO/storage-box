import { createTRPCRouter } from "~/server/api/trpc";
import { postsRouter } from "~/server/api/routers/post";
import { imageRouter } from "./routers/imagerouter";
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postsRouter,
  s3: imageRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
