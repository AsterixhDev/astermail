import { Request, Response, NextFunction, Application, Router, RequestHandler } from 'express';

export type activityStatus = 'online' | 'offline';
export type healthStatus = 'good' | 'bad';

export interface pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface generalResponse {
  status: healthStatus;
  connectionActivity: activityStatus;
  statusCode: number;
  message?: string;
}

export type DotNestedKeys<T> = T extends object
  ? {
      [K in Extract<keyof T, string>]:
        NonPlainObject<T[K]> extends true
          ? K
          : K | `${K}.${DotNestedKeys<T[K]>}`;
    }[Extract<keyof T, string>]
  : never;

export type NonPlainObject<T> = T extends string | number | boolean | bigint | symbol | null | undefined | Function | Date | any[]
  ? true
  : false;

export interface RouteEvent {
  req: Request;
  res: Response;
  next: NextFunction;
  params: Record<string, string>;
  query: Record<string, any>;
  body: any;
  headers?: Record<string, string | string[] | undefined>;
  rawBody?: Buffer;
}

export type AppOrRouter = Application | Router;
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'all';

export interface RouteConfig {
  app: AppOrRouter;
  method: HttpMethod;
  path: string;
  middleware?: RequestHandler[];
  handler: (event: RouteEvent) => any;
}