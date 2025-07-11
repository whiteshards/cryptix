
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

    // Get the anti-bypass token from environment variable
    const antiBypassToken = process.env.LINKVERTISE_ANTIBYPASS_TOKEN;
    
    if (!antiBypassToken) {
      return NextResponse.json({ 
        error: 'Server configuration error: Anti-bypass token not configured',
        success: false 
      }, { status: 500 });
    }

    // Verify hash with Linkvertise API
    const verificationUrl = `https://publisher.linkvertise.com/api/v1/anti_bypassing?token=${antiBypassToken}&hash=${hash}`;
    
    const linkvertiseResponse = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const verificationResult = await linkvertiseResponse.text();
    
    if (verificationResult === 'TRUE') {
      // Hash is valid, return success
      return NextResponse.json({ 
        success: true,
        message: 'Anti-bypass verification successful'
      });
    } else if (verificationResult === 'FALSE') {
      return NextResponse.json({ 
        error: 'Anti-Bypassed Detected Invalid Request Body. Please complete the checkpoint properly',
        success: false 
      }, { status: 400 });
    } else if (verificationResult === 'Invalid token.') {
      return NextResponse.json({ 
        error: 'Server configuration error: Invalid anti-bypass token',
        success: false 
      }, { status: 500 });
    } else {
      return NextResponse.json({ 
        error: 'Anti-bypass verification failed',
        success: false 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      success: false 
    }, { status: 500 });
  }
}
