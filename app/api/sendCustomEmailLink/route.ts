import { NextRequest, NextResponse } from 'next/server';
import { sendCustomEmailLink } from '../../lib/sendCustomEmailLink';

export async function POST(req: NextRequest) {
  try {
    const { to, subject, text } = await req.json();

    if (!to || !subject || !text) {
      return NextResponse.json({ error: 'Brakuje danych' }, { status: 400 });
    }

    // Stwórz link np. do logowania lub dashboardu — możesz dopasować
    const dummyLink = 'https://equiconnect.pl/zaloguj';

    // Używamy Twojej funkcji do wysyłki maila
    await sendCustomEmailLink(to, dummyLink, subject, text);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Błąd przy wysyłce maila:', error);
    return NextResponse.json({ error: 'Wysyłka nie powiodła się' }, { status: 500 });
  }
}
