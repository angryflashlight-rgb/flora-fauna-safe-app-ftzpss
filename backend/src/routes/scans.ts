import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { gateway } from '@specific-dev/framework';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';

// Zod schema for flora/fauna analysis
const analysisSchema = z.object({
  species: z.string().describe('Scientific name of the species'),
  commonName: z.string().describe('Common name of the species'),
  isSafeToEat: z.boolean().describe('Whether the species is safe to eat'),
  isSafeToTouch: z.boolean().describe('Whether the species is safe to touch'),
  confidence: z.enum(['high', 'medium', 'low']).describe('Confidence level of the identification'),
  warnings: z.string().describe('Any warnings or cautions about this species'),
  description: z.string().describe('Detailed description of the species and its characteristics'),
});

interface UploadBody {
  // Multipart form data with file
}

export function registerScansRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * POST /api/scans/upload
   * Upload an image and analyze it for flora/fauna
   */
  app.fastify.post('/api/scans/upload', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Starting image upload and analysis');

    try {
      const data = await request.file({ limits: { fileSize: 10 * 1024 * 1024 } });
      if (!data) {
        app.logger.warn({ userId: session.user.id }, 'No file provided');
        return reply.status(400).send({ error: 'No file provided' });
      }

      let buffer: Buffer;
      try {
        buffer = await data.toBuffer();
      } catch (err) {
        app.logger.warn({ userId: session.user.id }, 'File size limit exceeded');
        return reply.status(413).send({ error: 'File too large' });
      }

      // Upload to storage
      const key = `scans/${session.user.id}/${Date.now()}-${data.filename}`;
      app.logger.info({ userId: session.user.id, key }, 'Uploading file to storage');

      const uploadedKey = await app.storage.upload(key, buffer);
      const { url } = await app.storage.getSignedUrl(uploadedKey);

      // Analyze image with GPT-4 Vision
      app.logger.info({ userId: session.user.id, key: uploadedKey }, 'Analyzing image with AI');

      const base64 = buffer.toString('base64');
      const mimeType = data.mimetype || 'image/jpeg';

      const analysisResult = await generateObject({
        model: gateway('openai/gpt-4o'),
        schema: analysisSchema,
        schemaName: 'FloraFaunaAnalysis',
        schemaDescription: 'Analysis of a flora or fauna species from an image',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', image: base64, mediaType: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' },
              {
                type: 'text',
                text: `Analyze this image of flora or fauna. Identify the species (provide both scientific and common names).
Determine if it is safe to eat and safe to touch. Provide your confidence level in the identification (high, medium, or low).
Include any important warnings or cautions. Provide a detailed description of the species and its characteristics.`,
              },
            ],
          },
        ],
      });

      app.logger.info(
        {
          userId: session.user.id,
          species: analysisResult.object.species,
          confidence: analysisResult.object.confidence,
        },
        'AI analysis completed'
      );

      // Save analysis to database
      const [scan] = await app.db.insert(schema.scans).values({
        userId: session.user.id,
        imageUrl: url,
        imageKey: uploadedKey,
        species: analysisResult.object.species,
        commonName: analysisResult.object.commonName,
        isSafeToEat: analysisResult.object.isSafeToEat,
        isSafeToTouch: analysisResult.object.isSafeToTouch,
        confidence: analysisResult.object.confidence,
        warnings: analysisResult.object.warnings,
        description: analysisResult.object.description,
      }).returning();

      app.logger.info({ userId: session.user.id, scanId: scan.id }, 'Scan saved to database');

      return {
        scanId: scan.id,
        imageUrl: url,
        analysis: analysisResult.object,
      };
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to upload and analyze image');
      throw error;
    }
  });

  /**
   * GET /api/scans
   * Get all scans for the authenticated user
   */
  app.fastify.get('/api/scans', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    app.logger.info({ userId: session.user.id }, 'Retrieving user scans');

    try {
      const scans = await app.db.query.scans.findMany({
        where: eq(schema.scans.userId, session.user.id),
        orderBy: [desc(schema.scans.createdAt)],
      });

      app.logger.info({ userId: session.user.id, count: scans.length }, 'Scans retrieved successfully');

      return scans;
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id }, 'Failed to retrieve scans');
      throw error;
    }
  });

  /**
   * GET /api/scans/:id
   * Get a specific scan by ID
   */
  app.fastify.get('/api/scans/:id', async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const session = await requireAuth(request, reply);
    if (!session) return;

    const { id } = request.params;

    app.logger.info({ userId: session.user.id, scanId: id }, 'Retrieving scan details');

    try {
      const scan = await app.db.query.scans.findFirst({
        where: eq(schema.scans.id, id),
      });

      if (!scan) {
        app.logger.warn({ userId: session.user.id, scanId: id }, 'Scan not found');
        return reply.status(404).send({ error: 'Scan not found' });
      }

      // Verify ownership
      if (scan.userId !== session.user.id) {
        app.logger.warn({ userId: session.user.id, scanId: id, scanOwnerId: scan.userId }, 'Unauthorized access to scan');
        return reply.status(403).send({ error: 'Unauthorized' });
      }

      // Generate fresh signed URL for the image
      const { url } = await app.storage.getSignedUrl(scan.imageKey);

      app.logger.info({ userId: session.user.id, scanId: id }, 'Scan retrieved successfully');

      return {
        ...scan,
        imageUrl: url,
      };
    } catch (error) {
      app.logger.error({ err: error, userId: session.user.id, scanId: id }, 'Failed to retrieve scan');
      throw error;
    }
  });
}
