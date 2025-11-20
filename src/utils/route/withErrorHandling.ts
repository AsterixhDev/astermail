import { activityStatus, generalResponse, RouteEvent } from '../../types/route';

/**
 * Normalize any thrown value into message + statusCode.
 * @param err
 * @returns {{ message: string, statusCode: number }}
 */
function normalizeError(err: unknown): { message: string; statusCode: number } {
  let message = "Internal server error";
  let statusCode = 500;

  if (err instanceof Error) {
    message = err.message;
  } else if (typeof err === "string") {
    message = err;
  } else if (err && typeof err === "object") {
    const { message: m, statusCode: sc } = err as any;
    message = m || message;
    statusCode = sc;
  }

  return { message, statusCode };
}

/**
 * Wraps an Express-style event handler with error handling and default JSON envelope.
 *
 * @param handler
 * @returns
 */
export default function withErrorHandling(
  handler: (event: RouteEvent) => Promise<any>
): (event: RouteEvent) => Promise<generalResponse> {
  return async function (event: RouteEvent): Promise<generalResponse> {
    const { res } = event;

    // Execute handler and build envelope
    try {
      const data = await handler(event);
      return {
        message: "Request processed successfully",
        connectionActivity:
          (res.locals.isOnline as activityStatus) || "offline",
        statusCode: 200,
        success: true,
        status: "good",
        ...data,
      } as generalResponse;
    } catch (err) {
      const { message, statusCode } = normalizeError(err);
      return {
        status: "bad",
        connectionActivity:
          (res.locals.isOnline as activityStatus) || "offline",
        statusCode,
        message,
        success: false,
      } as generalResponse;
    }
  };
}
