import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Static assets & API bypass
  const isStatic =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/api/');

  if (isStatic) {
    return NextResponse.next();
  }

  const isAuthPage = pathname.startsWith('/login');
  const isLandingPage = pathname === '/';
  const sessionCookie = request.cookies.get('nyeni_session');

  // If not logged in and accessing protected route
  if (!sessionCookie && !isAuthPage && !isLandingPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If already logged in
  if (sessionCookie) {
    let userRole = 'cashier';
    try {
      const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
      userRole = sessionData.role || 'cashier';
    } catch {
      // fallback
    }

    // On login page, redirect according to role
    if (isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = userRole === 'admin' ? '/dashboard' : '/pos';
      return NextResponse.redirect(url);
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
