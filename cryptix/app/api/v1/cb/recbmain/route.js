
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const hash = searchParams.get('hash');
    
    // Check if hash is provided
    if (!hash) {
      return NextResponse.json({ 
        error: 'Anti-Bypassed Detected Invalid Request Body. Please complete the checkpoint properly',
        success: false 
      }, { status: 400 });
    }

    // Get the expected hash from environment variable
    const expectedHash = process.env.LINKVERTISE_MAIN_ANTIBYPASSING;
    
    if (!expectedHash) {
      return NextResponse.json({ 
        error: 'Server configuration error',
        success: false 
      }, { status: 500 });
    }

    // Validate hash
    if (hash !== expectedHash) {
      return NextResponse.json({ 
        error: 'Anti-Bypassed Detected Invalid Request Body. Please complete the checkpoint properly',
        success: false 
      }, { status: 400 });
    }

    // Hash is valid, redirect to ads page
    return NextResponse.redirect(new URL('/ads/get_key', request.url));

  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      success: false 
    }, { status: 500 });
  }
}
