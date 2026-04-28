import nodemailer from "nodemailer";
import { MailtrapTransport } from "mailtrap";

// Transporter Mailtrap
const transporter = nodemailer.createTransport(
  MailtrapTransport({
    token: process.env.MAILTRAP_API_TOKEN,
    sandbox: true,
    testInboxId: Number(process.env.MAILTRAP_INBOX_ID),
  }),
);

function getNotificationTemplate({ title, message, actionUrl = null }) {
  return `
  <div style="font-family: Arial, sans-serif; background:#f4f7fb; padding:24px;">
    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e6edf6;">

      <div style="background:#1d4ed8; color:white; padding:20px 24px;">
        <h1 style="margin:0; font-size:22px;">Hôtel La Promenade</h1>
        <p style="margin:6px 0 0; opacity:0.9;">Notification</p>
      </div>

      <div style="padding:24px;">
        <h2 style="margin:0 0 14px; color:#0f172a;">${title}</h2>
        <p style="margin:0 0 18px; color:#475569; line-height:1.6;">
          ${message}
        </p>

        ${
          actionUrl
            ? `
            <div style="margin-top:24px;">
              <a 
                href="${actionUrl}" 
                style="display:inline-block; background:#2563eb; color:white; text-decoration:none; padding:12px 18px; border-radius:8px; font-weight:600;"
              >
                Voir le détail
              </a>
            </div>
          `
            : ""
        }
      </div>

      <div style="padding:16px 24px; background:#f8fafc; color:#64748b; font-size:12px; text-align:center;">
        Email automatique - merci de ne pas répondre à ce message.
      </div>
    </div>
  </div>
  `;
}

export async function sendNotificationEmail({
  to,
  subject,
  title,
  message,
  actionUrl = null,
}) {
  try {
    const info = await transporter.sendMail({
      from: {
        address: "no-reply@hotelapromenade.com",
        name: "Hôtel La Promenade",
      },
      to: Array.isArray(to) ? to : [to],
      subject,
      html: getNotificationTemplate({
        title,
        message,
        actionUrl,
      }),
      category: "Notification",
    });

    console.log("Notification envoyée:", info.messageId);
    return info;
  } catch (error) {
    console.error("Erreur envoi notification:", error);
    throw error;
  }
}
