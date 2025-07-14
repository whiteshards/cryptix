
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../../lib/mongodb';

export async function POST(request) {
  try {
    const {
      keysystemId,
      sessionId,
      checkpointIndex,
      sessionToken,
      callbackToken
    } = await request.json();

    if (!keysystemId || !sessionId || checkpointIndex === undefined || !sessionToken || !callbackToken) {
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

    // Verify the callback token belongs to the correct checkpoint
    const checkpoint = keysystem.checkpoints[checkpointIndex];
    if (!checkpoint || checkpoint.callback_token !== callbackToken) {
      return NextResponse.json({ error: 'Invalid checkpoint or callback token' }, { status: 400 });
    }

    // Get user's session
    const session = keysystem.keys?.[sessionId];
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if user has already completed this checkpoint or skipped previous ones
    const currentProgress = session.current_checkpoint || 0;
    
    if (checkpointIndex !== currentProgress) {
      return NextResponse.json({ error: 'Skipped or Re-did the same checkpoint' }, { status: 400 });
    }

    // Verify session token exists and timing
    if (!session.session_token || session.session_token.generated_token !== sessionToken) {
      return NextResponse.json({ error: 'Session Token Expired/Not Found' }, { status: 400 });
    }

    // Check if session token was created less than 30 seconds ago (anti-bypass)
    const tokenCreatedAt = new Date(session.session_token.created_at);
    const now = new Date();
    const timeDiff = (now - tokenCreatedAt) / 1000; // in seconds

    if (timeDiff < 30) {
      return NextResponse.json({ error: 'Anti-bypass Triggered' }, { status: 400 });
    }

    // All checks passed - update progress and remove session token
    const updateResult = await collection.updateOne(
      { 
        _id: user._id,
        'keysystems.id': keysystemId
      },
      { 
        $inc: {
          [`keysystems.$.keys.${sessionId}.current_checkpoint`]: 1
        },
        $unset: {
          [`keysystems.$.keys.${sessionId}.session_token`]: ""
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to update checkpoint progress' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Checkpoint completed successfully',
      newProgress: currentProgress + 1
    });

  } catch (error) {
    console.error('Process callback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
