
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../../lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const callbackToken = searchParams.get('callbackToken');
    const sessionId = searchParams.get('sessionId');

    if (!callbackToken || !sessionId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('Cryptix');
    const collection = db.collection('customers');

    // Find the keysystem that contains this callback token in callback_urls
    const user = await collection.findOne({
      'keysystems.checkpoints.callback_urls': { $exists: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let targetKeysystem = null;
    let targetCheckpoint = null;
    let checkpointIndex = -1;

    // Search through all keysystems and checkpoints
    for (const keysystem of user.keysystems) {
      if (keysystem.checkpoints) {
        for (let i = 0; i < keysystem.checkpoints.length; i++) {
          const checkpoint = keysystem.checkpoints[i];
          if (checkpoint.callback_urls && checkpoint.callback_urls[sessionId] === callbackToken) {
            targetKeysystem = keysystem;
            targetCheckpoint = checkpoint;
            checkpointIndex = i;
            break;
          }
        }
        if (targetKeysystem) break;
      }
    }

    if (!targetKeysystem || !targetCheckpoint) {
      return NextResponse.json({ error: 'Callback token not found for this session' }, { status: 404 });
    }

    if (!targetKeysystem.active) {
      return NextResponse.json({ error: 'Keysystem is not active' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      keysystem: {
        id: targetKeysystem.id,
        name: targetKeysystem.name,
        active: targetKeysystem.active
      },
      checkpoint: targetCheckpoint,
      checkpointIndex: checkpointIndex,
      validToken: true
    });

  } catch (error) {
    console.error('LootLabs callback validation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
