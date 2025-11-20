import { Router } from "express";
import useRouter from "../utils/route/routeHandler";
import withErrorHandling from "../utils/route/withErrorHandling";
import { EmailPayload, SMTPConfig } from "../types";
import { createTransporter } from "../transporter";
import { handleError } from "../utils/errorHandler";
import bodyErrorBoundary from "../bodyErrorBoundary";
import useCache from "../useCache";
import { Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { AppOrRouter } from "../types/route";

export default function setupEmailRoutes(app: AppOrRouter) {
  const router = useRouter(app);

  router({
    method: "post",
    path: "/api/send",
    handler: withErrorHandling(async (event) => {
      const { body } = event;
      const { config, data }: { config: SMTPConfig; data: EmailPayload } = body;

      const boundaryResult = bodyErrorBoundary(data, ["to", "subject", "html"], {
        bodyLabel: "Email Data",
        checkers: {
          to: {
            action: (value) => !!value,
            message: "Recipient email is invalid",
          },
          subject: { action: (value) => !!value, message: "Subject is invalid" },
          html: { action: (value) => !!value, message: "HTML body is invalid" },
        },
      });

      if (boundaryResult.hasError || !boundaryResult.body) {
        return {
          status: "error",
          error: boundaryResult.errorMessage,
          statusCode: 400,
        };
      }

      const { to, subject, html, autoresponse } = boundaryResult.body;
      const text = html.replace(/<[^>]+>/g, "").slice(0, 2000);

      try {
        const transporter = await useCache<
          Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options>
        >(config.auth.user, () => createTransporter(config), 10);
        const info = await transporter.sendMail({
          from: config.auth.user,
          to,
          subject,
          text,
          html,
          headers: {
            "List-Unsubscribe": `<mailto:${config.auth.user}?subject=unsubscribe>`,
          },
        });

        if (autoresponse?.enabled) {
          await transporter.sendMail({
            from: to,
            to: config.auth.user,
            subject: `Re: ${subject}`,
            text: autoresponse.content,
            html: autoresponse.content,
          });
        }

        return { status: "success", messageId: info.messageId };
      } catch (error) {
        const handledError = handleError(error);
        throw { statusCode: 500, ...handledError };
      }
    }),
  });
}
