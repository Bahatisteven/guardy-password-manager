import nodemailer from 'nodemailer';
import logger  from './logger.js';
import dotenv from 'dotenv';
dotenv.config();



/**
 * Sends an email using nodemailer.
 * @param {Object} options - Email options.
 * @param {string} options.to - Recipient email address.
 * @param {string} options.subject - Email subject.
 * @param {string} options.text - Plain text body of the email.
 * @param {string} options.html - HTML body of the email.
 * @returns {Promise<Object>} Information about the sent email.
 * @throws {Error} If email sending fails.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"${process.env.APP_NAME}" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      text,
html,
    });

    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error("Error sending email:", error);
    throw new Error("Failed to send email.");
  }
};

export { sendEmail };