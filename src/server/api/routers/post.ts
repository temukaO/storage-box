
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const postsRouter = createTRPCRouter({
  getAll: protectedProcedure
  .query(({ ctx }) => {
    return ctx.db.post.findMany({
      where: {
        postId: ctx.session.user.id,
      },
    });
  }),

  create: protectedProcedure
    .input(z.object({ content: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.db.post.create({
        data: {
          postId: ctx.session.user.id,
          content: input.content,
        },
      });
    }),
    /*
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input}) =>{
      return ctx.prisma.post.delete({
        where: {
          id: input.id,
        }
      })
    } )
*/
});
