import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Basic ')) {
    const credentials = atob(auth.slice(6));
    const password = credentials.split(':').slice(1).join(':');
    const adminPw = process.env.ADMIN_PASSWORD ?? 'printdrop2025';
    if (password === adminPw) return NextResponse.next();
  }
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="PrintDrop Admin"' },
  });
}

export const config = { matcher: ['/admin/:path*'] };
