import {
  Request,
  Response
} from "express";
import { activityStatus, AppOrRouter, RouteConfig, RouteEvent } from '../../types/route';

/**
 * Registers a route on an Express app or Router.
 *
 * @param app - An Express app or router instance.
 * @returns - A function that accepts a route config (without the app).
 */
export default function useRouter(app: AppOrRouter) {
  return (params: Omit<RouteConfig, "app">) =>
    routeHandler({
      app,
      ...params,
    });
}

/**
 * If the handler returns a value (and hasn't already responded),
 * we send it: JSON by default, or raw for Buffer/streams.
 *
 * If the handler throws, a structured JSON error is returned.
 *
 * @param config
 */
export function routeHandler({
  app,
  method,
  path,
  middleware = [],
  handler,
}: RouteConfig) {
  const verb = method.toLowerCase();
  if (typeof (app as any)[verb] !== "function") {
    throw new Error(`Invalid HTTP method "${method}" for route ${path}`);
  }

  (app as any)[verb](
    path,
    ...middleware,
    async (req: Request, res: Response) => {
      const event: RouteEvent = {
        req,
        res,
        next: () => {},
        params: req.params as Record<string, string>,
        query: req.query as Record<string, any>,
        body: req.body,
        headers: req.headers as Record<string, string | string[] | undefined>,
        rawBody: Buffer.isBuffer(req.body) ? req.body : undefined,
      };

      try {
        const result = await handler(event);
        const action_path = `${path}`;
        const action_verb = verb.toUpperCase();
        if (res.headersSent) return;

        if (result !== undefined && result.statusCode <= 299) {
          const status = result?.statusCode || 200;

          if (Buffer.isBuffer(result) || (result as any)?.pipe) {
            const message = "Sending raw response for";
            console.log(`
${message} ${action_verb} ${action_path}: ${status}
`);
            return res.status(result.statusCode || 200).send(result);
          } else {
            const message = "Sending JSON response for";

            console.log(`${message} ${action_verb} ${action_path}: ${status}`);
            return res.status(result.statusCode || 200).json(result);
          }
        } else {
          const status = result?.statusCode || 500;
          const message = "Sending response for";
          console.log(`${message} ${action_verb} ${action_path}: ${status}`);
          return res.status(result?.statusCode || 500).json({
            message: result?.message || "An unexpected error occurred",
            status: "bad",
            connectionActivity:
              (res.locals.isOnline as activityStatus) || "offline",
            statusCode: result?.statusCode || 500,
            success: false,
          });
        }
      } catch (error) {
        if (res.headersSent) return;

        const statusCode =
          (error as any)?.status || (error as any)?.statusCode || 500;
        const message =
          (error as any)?.message || "An unexpected error occurred";
        console.error(`ERROR in ${verb.toUpperCase()} ${path}:`, error);

        return res.status(statusCode).json({
          status: "bad",
          connectionActivity:
            (res.locals.isOnline as activityStatus) || "offline",
          statusCode,
          message,
          success: false,
        });
      }
    }
  );
}
