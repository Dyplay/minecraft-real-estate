import { NextResponse } from 'next/server';

export async function middleware(request) {
  // Skip middleware for admin route and API routes
  if (
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.includes('_next') ||
    request.nextUrl.pathname.includes('favicon.ico')
  ) {
    return NextResponse.next();
  }

  try {
    // Get the base URL from the request
    const baseUrl = request.nextUrl.origin;
    console.log("Base URL for maintenance check:", baseUrl);
    
    // Check if maintenance mode is active using absolute URL
    const maintenanceResponse = await fetch(`${baseUrl}/api/maintenance/status`);
    
    if (!maintenanceResponse.ok) {
      throw new Error(`API request failed with status: ${maintenanceResponse.status}`);
    }
    
    const data = await maintenanceResponse.json();
    console.log("Maintenance API response:", data);
    
    if (data.isMaintenanceActive) {
      // Redirect to maintenance page with the message
      const url = new URL('/maintenance', request.url);
      url.searchParams.set('message', data.message || 'Site is under maintenance');
      return NextResponse.rewrite(url);
    }
  } catch (error) {
    console.error('Error checking maintenance status:', error);
    // Continue if we can't check maintenance status
  }

  return NextResponse.next();
} 