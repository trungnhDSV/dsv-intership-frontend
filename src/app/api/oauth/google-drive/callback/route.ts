import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'No code' }, { status: 400 });

  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
  const REDIRECT_URI = 'http://localhost:3000/api/oauth/google-drive/callback';

  // 1. Lấy access_token từ Google
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  const tokenJson = await tokenRes.json();

  // 2. Lấy profile Google của tài khoản Drive (chính acc user chọn)
  const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const profile = await profileRes.json();

  // 3. Gửi access_token/profile về FE (qua postMessage)
  // Nếu chạy trên Next.js App Router, dùng return HTML như sau:
  const html = `
    <script>
      window.opener.postMessage(
        ${JSON.stringify({
          access_token: tokenJson.access_token,
          refresh_token: tokenJson.refresh_token,
          expires_in: tokenJson.expires_in,
          profile,
        })},
        window.location.origin
      );
      window.close();
    </script>
  `;
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
