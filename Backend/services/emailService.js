import nodemailer from "nodemailer";

// Transporter mailtrap
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// HTML TEMPLATE
const getEmailTemplate = (invite, evenement) => {
  const baseUrl = "http://localhost:5001";

  const confirmUrl = `${baseUrl}/api/invites/respond/${invite.id_invite}?response=confirm`;
  const declineUrl = `${baseUrl}/api/invites/respond/${invite.id_invite}?response=decline`;

  return `
  <div style="font-family: Arial; background:#f4f4f4; padding:20px;">
    <div style="max-width:600px; margin:auto; background:white; border-radius:8px; overflow:hidden;">

      <div style="background:#2563eb; color:white; padding:20px; text-align:center;">
        <h1>Invitation</h1>
      </div>

      <div style="padding:25px;">
        <p>Bonjour <strong>${invite.prenom} ${invite.nom}</strong>,</p>

        <p>Vous êtes invité à :</p>

        <div style="background:#f9fafb; padding:20px; border-left:4px solid #2563eb;">
          <h2>${evenement.nom_evenement}</h2>
          <p><strong>Date :</strong> ${new Date(
            evenement.date_debut,
          ).toLocaleDateString()}</p>
          ${
            evenement.description
              ? `<p><strong>Description :</strong> ${evenement.description}</p>`
              : ""
          }
        </div>

        <p>Merci de confirmer votre présence :</p>

        <div style="text-align:center; margin:30px 0;">
          <a href="${confirmUrl}" style="background:#16a34a; color:white; padding:12px 20px; text-decoration:none; border-radius:6px;">
            Confirmer
          </a>

          <a href="${declineUrl}" style="background:#dc2626; color:white; padding:12px 20px; text-decoration:none; border-radius:6px; margin-left:10px;">
            Refuser
          </a>
        </div>
      </div>

      <div style="text-align:center; font-size:12px; color:#888; padding:15px;">
        Email automatique - ne pas répondre
      </div>

    </div>
  </div>
  `;
};

// Envoyer 1 email
export async function sendInvitation(invite, evenement) {
  return transporter.sendMail({
    from: '"Hôtel La Promenade" <no-reply@hotel.com>',
    to: invite.email,
    subject: `Invitation : ${evenement.nom_evenement}`,
    html: getEmailTemplate(invite, evenement),
  });
}
