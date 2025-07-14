import { NextResponse } from 'next/server';
import clientPromise from '../../../../../../../lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const keysystemId = searchParams.get('keysystemId');
    const sessionId = searchParams.get('sessionId');

    if (!keysystemId || !sessionId) {
      return NextResponse.json({ error: 'Keysystem ID and session ID are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('Cryptix');
    const collection = db.collection('customers');

    const user = await collection.findOne({
      'keysystems.id': keysystemId
    });

    if (!user) {
      return NextResponse.json({ error: 'Keysystem not found' }, { status: 404 });
    }

    const keysystem = user.keysystems.find(ks => ks.id === keysystemId);

    if (!keysystem || !keysystem.active) {
      return NextResponse.json({ error: 'Keysystem not found or not active' }, { status: 404 });
    }

    const session = keysystem.keys?.[sessionId];
    const sessionToken = session?.session_token;

    return NextResponse.json({
      success: true,
      exists: !!sessionToken,
      tokenCreatedAt: sessionToken?.created_at || null
    });

  } catch (error) {
    console.error('Check session token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}