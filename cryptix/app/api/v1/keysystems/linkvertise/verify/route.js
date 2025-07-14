
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { token, hash } = await request.json();

    if (!token || !hash) {
      return NextResponse.json({ error: 'Token and hash are required' }, { status: 400 });
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

    const linkvertiseData = await linkvertiseResponse.json();

    // Check if the response indicates the hash is valid
    if (linkvertiseData.token === 'CORRECT_TOKEN' && linkvertiseData.hash === 'CORRECT_HASH' && linkvertiseData.response === true) {
      return NextResponse.json({
        success: true,
        message: 'Hash verified successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid hash or authentication token'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Linkvertise verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
