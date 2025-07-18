
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../../lib/mongodb';
import jobQueue from '../../../../../../lib/jobQueue';

// Generate random 32-character key
const generateKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export async function POST(request) {
  try {
    const { keysystemId, sessionId } = await request.json();

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

    // Check if session exists
    const session = keysystem.keys?.[sessionId];
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if user completed all checkpoints
    if (session.current_checkpoint !== keysystem.checkpoints.length) {
      return NextResponse.json({ error: 'Not all checkpoints completed' }, { status: 400 });
    }

    // Check cooldown
    if (session.cooldown_till) {
      const cooldownTime = new Date(session.cooldown_till);
      if (cooldownTime > new Date()) {
        return NextResponse.json({ 
          error: 'Still in cooldown period',
          cooldown_till: session.cooldown_till
        }, { status: 429 });
      }
    }

    // Check if user has completed all checkpoints
    const totalCheckpoints = keysystem.checkpoints ? keysystem.checkpoints.length : 0;
    const currentProgress = session.current_checkpoint || 0;

    if (currentProgress < totalCheckpoints) {
      return NextResponse.json({ 
        error: 'You must complete all checkpoints before generating a key.' 
      }, { status: 403 });
    }

    // Check if user has reached max key limit
    const currentKeys = session.keys || [];
    if (currentKeys.length >= keysystem.maxKeyPerPerson) {
      return NextResponse.json({ error: 'Maximum keys per person reached' }, { status: 400 });
    }

    // Generate new key
    const keyValue = generateKey();
    const now = new Date();
    const expiresAt = keysystem.permanent ? null : new Date(now.getTime() + (keysystem.keyTimer * 60 * 60 * 1000));
    const cooldownTill = new Date(now.getTime() + (keysystem.keyCooldown * 60 * 1000));

    const newKey = {
      value: keyValue,
      hwid: null,
      created_at: now.toISOString(),
      expires_at: expiresAt ? expiresAt.toISOString() : null,
      status: 'active'
    };

    // Update session with new key, reset progress, and set cooldown
    const result = await collection.updateOne(
      { 
        _id: user._id,
        'keysystems.id': keysystemId
      },
      { 
        $push: {
          [`keysystems.$.keys.${sessionId}.keys`]: newKey
        },
        $set: {
          [`keysystems.$.keys.${sessionId}.current_checkpoint`]: 0,
          [`keysystems.$.keys.${sessionId}.cooldown_till`]: cooldownTill.toISOString()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to generate key' }, { status: 500 });
    }

    // Schedule key expiration if not permanent
    if (!keysystem.permanent && expiresAt) {
      await jobQueue.scheduleKeyExpiration(keysystemId, sessionId, keyValue, expiresAt);
    }

    // Schedule cooldown cleanup
    jobQueue.scheduleCooldownCleanup(keysystemId, sessionId, cooldownTill);

    return NextResponse.json({
      success: true,
      key: newKey,
      cooldown_till: cooldownTill.toISOString(),
      message: 'Key generated successfully'
    });

  } catch (error) {
    console.error('Key generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}