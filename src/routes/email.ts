import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";

import { EmailPayload, SMTPConfig } from "../types";
import { createTransporter } from "../transporter";

import { handleError } from "../utils/errorHandler";
import bodyErrorBoundary from "../bodyErrorBoundary";
import useCache from "../useCache";
import { Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

const router = Router();

router.post(
  "/send",
  [
    body("config").isObject().withMessage("SMTP configuration is required"),
    body("data.to").isEmail().withMessage("Valid recipient email required"),
    body("data.subject").notEmpty().withMessage("Subject is required"),
    body("data.html").notEmpty().withMessage("HTML body is required"),
    body("data.autoresponse")
      .optional()
      .isObject()
      .withMessage("Autoresponse must be an object"),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { config, data }: { config: SMTPConfig; data: EmailPayload } =
      req.body;

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
      return res
        .status(400)
        .json({ status: "error", error: boundaryResult.errorMessage });
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
          to:config.auth.user,
          subject: `Re: ${subject}`,
          text: autoresponse.content,
          html: autoresponse.content,
        });
      }

      return res.json({ status: "success", messageId: info.messageId });
    } catch (error) {
      const handledError = handleError(error);
      return res.status(500).json(handledError);
    }
  }
);
export default router;
