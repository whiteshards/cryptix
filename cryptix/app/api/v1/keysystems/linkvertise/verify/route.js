
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { hash } = await request.json();

    if (!hash) {
      return NextResponse.json({ error: 'hash are required' }, { status: 400 });
    }

    const linkvertiseApiToken = process.env.LINKVERTISE;
    
    if (!linkvertiseApiToken) {
      return NextResponse.json({ error: 'Linkvertise API token not configured' }, { status: 500 });
    }

    // Make request to Linkvertise API to verify the hash
    const linkvertiseResponse = await fetch('https://publisher.linkvertise.com/api/v1/anti_bypassing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: linkvertiseApiToken,
        hash: hash
      }),
    });

    // Try to parse as JSON first, fallback to text for backward compatibility
    let linkvertiseData;
    const responseText = await linkvertiseResponse.text();
    
    try {
      linkvertiseData = JSON.parse(responseText);
    } catch (e) {
      // If JSON parsing fails, treat as plain text (legacy format)
      linkvertiseData = responseText;
    }

    // Handle JSON response format
    if (typeof linkvertiseData === 'object' && linkvertiseData !== null) {
      if (linkvertiseData.status === true) {
        return NextResponse.json({
          success: true,
          message: 'Hash verified successfully'
        });
      } else if (linkvertiseData.status === false) {
        return NextResponse.json({
          success: false,
          error: 'Hash could not be found or has expired'
        }, { status: 400 });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Invalid response from Linkvertise'
        }, { status: 400 });
      }
    }
    
    // Handle legacy plain text response format
    if (linkvertiseData === 'TRUE') {
      return NextResponse.json({
        success: true,
        message: 'Hash verified successfully'
      });
    } else if (linkvertiseData === 'FALSE') {
      return NextResponse.json({
        success: false,
        error: 'Hash could not be found or has expired'
      }, { status: 400 });
    } else if (linkvertiseData === 'Invalid token.') {
      return NextResponse.json({
        success: false,
        error: 'Linkvertise authentication token is invalid'
      }, { status: 401 });
    } else {
      return NextResponse.json({
        success: false,
        error: linkvertiseData
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Linkvertise verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
