import { NextResponse } from 'next/server';
import clientPromise from '../../../../../../lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const keysystemId = searchParams.get('keysystemId');
    const sessionId = searchParams.get('sessionId');

    if (!keysystemId || !sessionId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
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

    // Check if session exists and has a token
    const existingSession = keysystem.keys?.[sessionId];
    const hasToken = existingSession && existingSession.session_token;

    return NextResponse.json({
      success: true,
      exists: !!hasToken,
      token: hasToken ? existingSession.session_token.generated_token : null
    });

  } catch (error) {
    console.error('Check session token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}