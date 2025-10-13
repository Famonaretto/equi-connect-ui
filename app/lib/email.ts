import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // lub inny SMTP
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendActivationEmail(to: string, token: string) {
  const activationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/activate?token=${token}`;

  await transporter.sendMail({
    from: '"EquiConnect" <no-reply@equiconnect.pl>',
    to,
    subject: 'Aktywuj swoje konto',
    html: `
      <p>Cześć!</p>
      <p>Aby aktywować swoje konto, kliknij w link poniżej:</p>
      <a href="${activationUrl}">Aktywuj konto</a>
      <p>Link ważny przez 24h.</p>
    `,
  });
}
