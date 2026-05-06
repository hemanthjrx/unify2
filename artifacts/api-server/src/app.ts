import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { mkdirSync } from "fs";

const UPLOAD_DIR = process.env["UPLOAD_DIR"] || "/tmp/unify-uploads";
try { mkdirSync(UPLOAD_DIR, { recursive: true }); } catch {}

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/uploads", express.static(UPLOAD_DIR));

app.use("/api", router);

export default app;
export { UPLOAD_DIR };
