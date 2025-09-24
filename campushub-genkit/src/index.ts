// campushub-genkit/src/index.ts
import { setGlobalOptions } from 'firebase-functions/v2/options';
import { onRequest } from 'firebase-functions/v2/https';
import next from 'next';
import express from 'express';
import { resolve } from 'path';

// ---------- config ----------
setGlobalOptions({ maxInstances: 10 });

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({
  dev,
    conf: { distDir: resolve(__dirname, '..', '..', '.next') }, // .next sits at repo root
    });
    const handle = nextApp.getRequestHandler();
    const prepare = nextApp.prepare(); // start once, reuse promise

    // ---------- express wrapper ----------
    const server = express();
    server.all('*', async (req, res) => {
      await prepare;
        handle(req, res);
        });

        // ---------- export ----------
        export const app = onRequest(
          { timeoutSeconds: 120, memory: '1GiB', maxInstances: 10 },
            server, // <-- 2nd-gen wants the *server*, not a handler
            );