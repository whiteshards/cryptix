
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../../lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const callbackToken = searchParams.get('token');
    const sessionId = searchParams.get('sessionId');

    if (!callbackToken) {
      return NextResponse.json({ error: 'Callback token is required' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('Cryptix');
    const collection = db.collection('customers');

    // Find the user and keysystem that contains this callback token in lootlabs callback_urls
    const user = await collection.findOne({
      'keysystems.checkpoints': {
        $elemMatch: {
          type: 'lootlabs',
          $expr: {
            $in: [callbackToken, { $objectToArray: '$callback_urls' }.v]
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'LootLabs callback not found' }, { status: 404 });
    }

    // Find the specific keysystem and checkpoint
    let targetKeysystem = null;
    let targetCheckpoint = null;
    let checkpointIndex = -1;
    let foundSessionId = null;

    for (const keysystem of user.keysystems) {
      if (keysystem.checkpoints) {
        const index = keysystem.checkpoints.findIndex(cp => {
          if (cp.type === 'lootlabs' && cp.callback_urls) {
            // Check if the callback token exists in any session's callback_urls
            for (const [sid, token] of Object.entries(cp.callback_urls)) {
              if (token === callbackToken) {
                foundSessionId = sid;
                return true;
              }
            }
          }
          return false;
        });
        
        if (index !== -1) {
          targetKeysystem = keysystem;
          targetCheckpoint = keysystem.checkpoints[index];
          checkpointIndex = index;
          break;
        }
      }
    }

    if (!targetKeysystem || !targetCheckpoint) {
      return NextResponse.json({ error: 'LootLabs checkpoint not found' }, { status: 404 });
    }

    if (!targetKeysystem.active) {
      return NextResponse.json({ error: 'Keysystem is not active' }, { status: 403 });
    }

    // If sessionId was provided, verify it matches the found session
    if (sessionId && foundSessionId !== sessionId) {
      return NextResponse.json({ error: 'Session ID mismatch' }, { status: 400 });
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
      sessionId: foundSessionId,
      isLootLabs: true
    });

  } catch (error) {
    console.error('Find LootLabs callback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
