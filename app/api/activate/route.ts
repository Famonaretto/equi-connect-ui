// app/api/activate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { findUserByToken, activateUser } from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Brak tokenu' }, { status: 400 });
  }

  const user = await findUserByToken(token);

  if (!user || user.activationExpires < new Date()) {
    return NextResponse.json({ error: 'Token wygasł lub nieprawidłowy' }, { status: 400 });
  }

  await activateUser(user.email);
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/logowanie?aktywowane=true`);
}
