
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../../lib/mongodb';

export async function POST(request) {
  try {
    const { keysystemId, sessionId } = await request.json();

    if (!keysystemId || !sessionId) {
      return NextResponse.json({ error: 'Keysystem ID and session ID are required' }, { status: 400 });
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

    if (!keysystem) {
      return NextResponse.json({ error: 'Keysystem not found' }, { status: 404 });
    }

    // Check if session exists
    if (!keysystem.keys || !keysystem.keys[sessionId]) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Remove the session from the database
    const result = await collection.updateOne(
      { 
        _id: user._id,
        'keysystems.id': keysystemId
      },
      { 
        $unset: {
          [`keysystems.$.keys.${sessionId}`]: ""
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to destroy session' }, { status: 500 });
    }

    // Also clean up any callback URLs for this session across all checkpoints
    const cleanupResult = await collection.updateOne(
      { 
        _id: user._id,
        'keysystems.id': keysystemId
      },
      { 
        $unset: {
          [`keysystems.$.checkpoints.$[].callback_urls.${sessionId}`]: ""
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Session destroyed successfully'
    });

  } catch (error) {
    console.error('Session destruction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
