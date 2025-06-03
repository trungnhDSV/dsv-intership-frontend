import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
  const REDIRECT_URI = 'http://localhost:3000/api/oauth/google-drive/callback'; // nhớ đổi production
  const SCOPE = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ].join(' ');

  const state = 'some_random_csrf_state'; // tốt nhất generate random và lưu vào cookie/session để check

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', SCOPE);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', state);

  return NextResponse.redirect(url.toString());
}
