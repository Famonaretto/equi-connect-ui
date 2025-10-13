import nodemailer from 'nodemailer';

export async function sendCustomEmailLink(toEmail: string, link: string, subject: string, text: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT), 
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: '"EquiConnect" <no-reply@equiconnect.pl>',
    to: toEmail,
    subject,
    html: `
      <p>${text}</p>
      <p><a href="${link}">${link}</a></p>
    `,
  });
}
