
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export async function GET(request) {
  try {
    const uuid = randomUUID();
    
    return NextResponse.json({ 
      success: true,
      uuid: uuid
    });

  } catch (error) {
    console.error('UUID generation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      success: false 
    }, { status: 500 });
  }
}
