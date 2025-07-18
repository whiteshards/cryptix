import { NextResponse } from 'next/server';
import clientPromise from '../../../../../../lib/mongodb';

export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { keysystemId, keyValue } = await request.json();

    // Validation
    if (!keysystemId || !keyValue) {
      return NextResponse.json({ error: 'Keysystem ID and key value are required' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('Cryptix');
    const collection = db.collection('customers');

    // Find user by token and verify they own this keysystem
    const user = await collection.findOne({ 
      token: token,
      'keysystems.id': keysystemId
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid token or keysystem not found' }, { status: 401 });
    }

    // Find the specific keysystem
    const keysystem = user.keysystems.find(ks => ks.id === keysystemId);
    if (!keysystem) {
      return NextResponse.json({ error: 'Keysystem not found' }, { status: 404 });
    }

    // Find and remove the key by searching through all sessions
    let keyFound = false;
    let sessionToUpdate = null;

    // Check if keysystem.keys exists and is an object
    if (!keysystem.keys || typeof keysystem.keys !== 'object') {
      return NextResponse.json({ error: 'No sessions found in keysystem' }, { status: 404 });
    }

    // Search through all sessions to find the key
    for (const [sessionId, sessionData] of Object.entries(keysystem.keys)) {
      if (sessionData && sessionData.keys && Array.isArray(sessionData.keys)) {
        const keyIndex = sessionData.keys.findIndex(key => key.value === keyValue);
        if (keyIndex !== -1) {
          keyFound = true;
          sessionToUpdate = sessionId;
          break;
        }
      }
    }

    if (!keyFound) {
      return NextResponse.json({ error: 'Key not found in any session' }, { status: 404 });
    }

    // Remove the key from the found session
    const result = await collection.updateOne(
      { 
        _id: user._id,
        'keysystems.id': keysystemId
      },
      { 
        $pull: {
          [`keysystems.$.keys.${sessionToUpdate}.keys`]: { value: keyValue }
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to delete key' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Key deleted successfully'
    });

  } catch (error) {
    console.error('Delete key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}