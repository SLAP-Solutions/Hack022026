import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware runs before Next.js routing
// It excludes Azure Static Web Apps internal paths (.swa) from custom routing
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// Configure middleware to exclude Azure Static Web Apps paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - .swa (Azure Static Web Apps internal paths for health checks)
     */
    '/((?!.swa).*)',
  ],
};
