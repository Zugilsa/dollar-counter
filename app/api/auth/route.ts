import { NextRequest, NextResponse } from 'next/server';

const PASSWORD = process.env.APP_PASSWORD || 'ONE1DOLLAR';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (password === PASSWORD) {
      const response = NextResponse.json({ success: true });
      response.cookies.set('dc_auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
