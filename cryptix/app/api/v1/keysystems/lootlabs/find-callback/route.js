import { NextResponse } from 'next/server';
import clientPromise from '../../../../../../lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const callbackToken = searchParams.get('token');
    const sessionId = searchParams.get('sessionId');

    console.log('LootLabs find-callback called with:', { callbackToken, sessionId });

    if (!callbackToken) {
      return NextResponse.json({ error: 'Callback token is required' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('Cryptix');
    const collection = db.collection('customers');

    // Search for the callback token in all LootLabs checkpoints
    let targetKeysystem = null;
    let targetCheckpoint = null;
    let checkpointIndex = -1;
    let foundSessionId = null;

    const users = await collection.find({}).toArray();
    console.log(`Searching through ${users.length} users`);

    for (const user of users) {
      if (!user.keysystems) continue;

      for (const keysystem of user.keysystems) {
        if (keysystem.checkpoints) {
          console.log(`Checking keysystem ${keysystem.id} with ${keysystem.checkpoints.length} checkpoints`);

          const index = keysystem.checkpoints.findIndex(cp => {
            console.log(`Checking checkpoint type: ${cp.type}, has callback_urls: ${!!cp.callback_urls}`);

            if (cp.type === 'lootlabs' && cp.callback_urls) {
              console.log('LootLabs checkpoint callback_urls:', cp.callback_urls);

              // Check if the callback token exists in any session's callback_urls
              for (const [sid, token] of Object.entries(cp.callback_urls)) {
                console.log(`Comparing session ${sid}: ${token} === ${callbackToken}`);
                if (token === callbackToken) {
                  foundSessionId = sid;
                  console.log(`Found matching token for session: ${sid}`);
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
            console.log(`Found target keysystem: ${keysystem.id}, checkpoint index: ${index}`);
            break;
          }
        }
      }
      if (targetKeysystem) break;
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