import * as nodemailer from 'nodemailer';
import { EMAIL_HOST, EMAIL_USER, EMAIL_PASS } from '../constant/app.constant';

export const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: 587,
  secure: false, // Dùng true nếu port 465, false cho các port khác
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});
