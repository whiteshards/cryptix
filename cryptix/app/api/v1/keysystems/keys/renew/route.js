import { NextResponse } from 'next/server';
import clientPromise from '../../../../../../lib/mongodb';
import jobQueue from '../../../../../../lib/jobQueue';

export async function POST(request) {
  try {
    const { keysystemId, sessionId, keyValue } = await request.json();

    if (!keysystemId || !sessionId || !keyValue) {
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

    // Check if user is on cooldown
    if (session.cooldown_till && new Date(session.cooldown_till) > new Date()) {
      return NextResponse.json({ 
        error: 'You are still on cooldown. Please wait before renewing keys.' 
      }, { status: 429 });
    }

    // Check if user has completed all checkpoints
    const totalCheckpoints = keysystem.checkpoints ? keysystem.checkpoints.length : 0;
    const currentProgress = session.current_checkpoint || 0;

    if (currentProgress < totalCheckpoints) {
      return NextResponse.json({ 
        error: 'You must complete all checkpoints before renewing a key.' 
      }, { status: 403 });
    }

    // Find the key to renew
    const keyIndex = session.keys?.findIndex(key => key.value === keyValue);
    if (keyIndex === -1) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 });
    }

    const now = new Date();
    const expiresAt = keysystem.permanent ? null : new Date(now.getTime() + (keysystem.keyTimer * 60 * 60 * 1000));
    const cooldownTill = new Date(now.getTime() + (keysystem.keyCooldown * 60 * 1000));

    // Update key renewal and reset progress
    const result = await collection.updateOne(
      { 
        _id: user._id,
        'keysystems.id': keysystemId
      },
      { 
        $set: {
          [`keysystems.$.keys.${sessionId}.keys.${keyIndex}.expires_at`]: expiresAt ? expiresAt.toISOString() : null,
          [`keysystems.$.keys.${sessionId}.keys.${keyIndex}.status`]: 'active',
          [`keysystems.$.keys.${sessionId}.current_checkpoint`]: 0,
          [`keysystems.$.keys.${sessionId}.cooldown_till`]: cooldownTill.toISOString()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to renew key' }, { status: 500 });
    }

    // Schedule key expiration if not permanent
    if (!keysystem.permanent && expiresAt) {
      await jobQueue.scheduleKeyExpiration(keysystemId, sessionId, keyValue, expiresAt);
    }

    // Schedule cooldown cleanup
    await jobQueue.scheduleCooldownCleanup(keysystemId, sessionId, cooldownTill);

    return NextResponse.json({
      success: true,
      expires_at: expiresAt ? expiresAt.toISOString() : null,
      cooldown_till: cooldownTill.toISOString(),
      message: 'Key renewed successfully'
    });

  } catch (error) {
    console.error('Key renewal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}