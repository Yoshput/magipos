import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Static assets & API bypass
  const isStatic =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/apple-touch-icon') ||
    pathname.startsWith('/api/');

  if (isStatic) {
    return NextResponse.next();
  }

  const isAuthPage = pathname.startsWith('/login');
  const isLandingPage = pathname === '/';
  const sessionCookie = request.cookies.get('nyeni_session');

  // If already logged in and visiting login page, redirect to app
  if (sessionCookie && isAuthPage) {
    let userRole = 'cashier';
    try {
      const rawVal = sessionCookie.value;
      const sessionData = JSON.parse(decodeURIComponent(rawVal));
      userRole = sessionData.role || 'cashier';
    } catch {
      userRole = 'cashier';
    }

    const url = request.nextUrl.clone();
    url.pathname = userRole === 'admin' ? '/dashboard' : '/pos';
    return NextResponse.redirect(url);
  }

  // If already logged in, check role restrictions
  if (sessionCookie) {
    let userRole = 'cashier';
    try {
      const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
      userRole = sessionData.role || 'cashier';
    } catch {
      userRole = 'cashier';
    }

    // Cashier restricted from admin pages
    const adminRoutes = ['/dashboard', '/reports', '/menu', '/expenses', '/users', '/settings'];
    if (userRole === 'cashier' && adminRoutes.some((r) => pathname.startsWith(r))) {
      const url = request.nextUrl.clone();
      url.pathname = '/pos';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets/|manifest.json).*)',
  ],
};
