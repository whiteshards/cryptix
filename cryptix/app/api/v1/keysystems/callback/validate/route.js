
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../../lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('Cryptix');
    const collection = db.collection('customers');

    // Find the keysystem and checkpoint that contains this callback token
    const user = await collection.findOne({
      'keysystems.checkpoints.callback_token': token
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid callback token' }, { status: 404 });
    }

    // Find the specific keysystem and checkpoint
    let foundKeysystem = null;
    let foundCheckpoint = null;
    let checkpointIndex = -1;

    for (const keysystem of user.keysystems) {
      const index = keysystem.checkpoints.findIndex(cp => cp.callback_token === token);
      if (index !== -1) {
        foundKeysystem = keysystem;
        foundCheckpoint = keysystem.checkpoints[index];
        checkpointIndex = index;
        break;
      }
    }

    if (!foundKeysystem || !foundCheckpoint) {
      return NextResponse.json({ error: 'Checkpoint not found' }, { status: 404 });
    }

    if (!foundKeysystem.active) {
      return NextResponse.json({ error: 'Keysystem is not active' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      keysystemId: foundKeysystem.id,
      checkpointIndex,
      checkpoint: foundCheckpoint
    });

  } catch (error) {
    console.error('Validate callback token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
