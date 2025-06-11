export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  autoresponse?: {
    enabled: boolean;
    content: string;
  };
}

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface ErrorResponse {
  status: 'error';
  message: string;
  details?: any;
}

export interface SuccessResponse {
  status: 'success';
  data?: any;
}

export type ApiResponse = ErrorResponse | SuccessResponse;
