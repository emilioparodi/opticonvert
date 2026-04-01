import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import multer from 'multer';
import sharp from 'sharp';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

app.use(express.json());

/**
 * API: Get Image Metadata
 */
app.post('/api/metadata', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({error: 'No image uploaded'});
      return;
    }

    const metadata = await sharp(req.file.buffer).metadata();
    res.json({
      size: req.file.size,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
    });
  } catch (error) {
    console.error('Metadata extraction error:', error);
    res.status(500).json({error: 'Failed to extract metadata'});
  }
});

/**
 * API: Convert Image
 */
app.post('/api/convert', upload.single('image'), async (req, res) => {
  try {
    const {format, quality} = req.body;
    if (!req.file) {
      res.status(400).json({error: 'No image uploaded'});
      return;
    }

    const q = parseInt(quality as string) || 80;
    const targetFormat = (format as string) === 'avif' ? 'avif' : 'webp';

    let transformer = sharp(req.file.buffer);

    if (targetFormat === 'avif') {
      transformer = transformer.avif({quality: q});
    } else {
      transformer = transformer.webp({quality: q});
    }

    const outputBuffer = await transformer.toBuffer();

    res.set('Content-Type', `image/${targetFormat}`);
    res.set('Content-Disposition', `attachment; filename="converted.${targetFormat}"`);
    res.send(outputBuffer);
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({error: 'Failed to convert image'});
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
