import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { token } = await request.json();
  if (!token) {
    return NextResponse.json({ success: false, error: 'No CAPTCHA token provided' }, { status: 400 });
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.error('RECAPTCHA_SECRET_KEY is not defined');
    return NextResponse.json({ success: false, error: 'Server misconfiguration' }, { status: 500 });
  }

  const params = new URLSearchParams();
  params.append('secret', secret);
  params.append('response', token);

  const verificationResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const verificationJson = (await verificationResponse.json()) as { success: boolean; [key: string]: any };

  if (!verificationJson.success) {
    return NextResponse.json({ success: false, error: 'CAPTCHA verification failed' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}