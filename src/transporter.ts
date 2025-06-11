import { SMTPConfig } from './types';
import nodemailer from 'nodemailer';


export const createTransporter = (config: SMTPConfig) => {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  transporter.verify()

  return transporter;
};