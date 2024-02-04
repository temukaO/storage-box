import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { env } from "../../../env.mjs";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const imageRouter = createTRPCRouter({
  
  getObjects: protectedProcedure
  .query(async ({ ctx }) => {

    const listObjectsOutput = await ctx.s3.listObjectsV2({
      Bucket: env.BUCKET_NAME,
    });

    return listObjectsOutput.Contents ?? [];
  }),
  
  createObject: protectedProcedure
  .input(z.object({ key: z.string()}))
  .mutation(async ({ ctx, input}) => {
    const  { key }  = input;
    const  { s3 }  = ctx;
    const putObjectCommand = new PutObjectCommand({
      Bucket: env.BUCKET_NAME,
      Key: key,
    })
    return await getSignedUrl(s3, putObjectCommand)
  }),
  
  getStandardUploadPresignedUrl: protectedProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { key } = input;
      const { s3 } = ctx;
      const getObjectCommand = new GetObjectCommand({
        Bucket: env.BUCKET_NAME,
        Key: key,
      });
      
      return await getSignedUrl(s3, getObjectCommand);
    }),

  deleteObjects: protectedProcedure
  .input(z.object({ key: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { key } = input;
    const { s3 } = ctx;
    const deleteObjectCommand = new DeleteObjectCommand({
      Bucket: env.BUCKET_NAME,
      Key: key,
    });
    return await getSignedUrl(s3, deleteObjectCommand);
  })

    

});
