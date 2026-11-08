import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import { CLERK_PROXY_PATH, clerkProxyMiddleware, getClerkProxyHost } from "./middlewares/clerkProxyMiddleware";
import { learnerIdentity, sameOrigin } from "./lib/pin-auth";
import { servePortableWeb } from "./lib/portable-web";

const app: Express = express();
// Render terminates TLS at its reverse proxy; trust only the nearest hop.
if (process.env.SERVE_WEB === "true") app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
if (process.env.PIN_ONLY !== "true") app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(cors({ origin: false }));
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: true }));
if (process.env.PIN_ONLY !== "true") app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.use("/api/math", sameOrigin, learnerIdentity);
app.use("/api", router);
servePortableWeb(app);
app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  req.log.error({ err }, "API request failed");
  res.status(500).json({ error: "Ndodhi një gabim gjatë ruajtjes. Provo përsëri." });
});

export default app;
