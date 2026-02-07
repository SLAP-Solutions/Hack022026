import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Azure App Service
 * This endpoint is used by Azure to monitor the application's health
 */
export async function GET() {
  try {
    // Basic health check - you can add more checks here:
    // - Database connectivity
    // - External service availability
    // - Memory usage
    // - etc.

    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'unknown',
      port: process.env.PORT || 'not set',
      hostname: process.env.HOSTNAME || 'not set',
    };

    // Log health check for Azure diagnostics
    console.log('[Health Check] Status: healthy', healthCheck);

    return NextResponse.json(healthCheck, { status: 200 });
  } catch (error) {
    // If any critical error occurs, return unhealthy status
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    
    console.error('[Health Check] Status: unhealthy', errorResponse);
    
    return NextResponse.json(errorResponse, { status: 503 });
  }
}
