
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../../../lib/mongodb';

export async function POST(request) {
  try {
    const { keysystemId, sessionId, sessionToken } = await request.json();

    if (!keysystemId || !sessionId || !sessionToken) {
      return NextResponse.json({ error: 'Keysystem ID, session ID, and session token are required' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('Cryptix');
    const collection = db.collection('customers');

    // Find the user who owns this keysystem
    const user = await collection.findOne({
      'keysystems.id': keysystemId
    });

    if (!user) {
      return NextResponse.json({ error: 'Keysystem not found' }, { status: 404 });
    }

    // Find the specific keysystem
    const keysystem = user.keysystems.find(ks => ks.id === keysystemId);

    if (!keysystem || !keysystem.active) {
      return NextResponse.json({ error: 'Keysystem not found or not active' }, { status: 404 });
    }

    // Check if session exists
    const session = keysystem.keys?.[sessionId];
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if session token matches and exists
    if (!session.session_token || session.session_token !== sessionToken) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
    }

    // Check if token creation time exists
    if (!session.session_token_created_at) {
      return NextResponse.json({ error: 'Session token creation time not found' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      tokenCreatedAt: session.session_token_created_at,
      message: 'Session token validated successfully'
    });

  } catch (error) {
    console.error('Validate session token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
