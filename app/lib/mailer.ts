import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // ← np. eki360.kontakt@gmail.com
    pass: process.env.GMAIL_PASS, // ← hasło aplikacji z Google
  },
});

export const sendTempAccountEmail = async (to: string) => {
  const info = await transporter.sendMail({
    from: `"EquiConnect" <${process.env.GMAIL_USER}>`,
    to,
    subject: '📩 Twoje tymczasowe konto EquiConnect',
    html: `
      <p>Dziękujemy za wypełnienie oceny zachowania konia!</p>
      <p>Utworzyliśmy dla Ciebie tymczasowe konto powiązane z adresem <strong>${to}</strong>.</p>
      <p>Masz 7 dni, aby się zarejestrować i przypisać wynik do konta.</p>
      <a href="https://equi-connect.pl/rejestracja?email=${encodeURIComponent(to)}" style="color: #0D1F40; font-weight: bold;">Zarejestruj się tutaj</a>
    `,
  });

  console.log('✅ E-mail wysłany:', info.messageId);
};
