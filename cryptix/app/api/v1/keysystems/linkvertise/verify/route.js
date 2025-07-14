
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

    const linkvertiseData = await linkvertiseResponse.text();

    // Check if the response indicates the hash is valid
    // According to Linkvertise docs: TRUE = valid, FALSE = invalid hash, "Invalid token." = invalid token
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
