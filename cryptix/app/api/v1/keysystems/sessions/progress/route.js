import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { sendWebhookNotification } from '../../../../../lib/webhookUtils';

const uri = process.env.MONGO_URI;
const options = {};

let client;
let clientPromise;

if (!process.env.MONGO_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function POST(request) {
  try {
    const { keysystemId, sessionId, checkpointIndex } = await request.json();

    if (!keysystemId || !sessionId || checkpointIndex === undefined) {
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
    const sessionExists = keysystem.keys?.[sessionId];
    if (!sessionExists) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Update the session's current checkpoint progress
    const result = await collection.updateOne(
      { 
        _id: user._id,
        'keysystems.id': keysystemId
      },
      { 
        $set: {
          [`keysystems.$.keys.${sessionId}.current_checkpoint`]: checkpointIndex
        },
        // Also remove the session token since checkpoint is completed
        $unset: {
          [`keysystems.$.keys.${sessionId}.session_token`]: ""
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
    }

    // Send webhook notification if webhook URL is configured
    if (keysystem.webhookUrl) {
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      await sendWebhookNotification(keysystem.webhookUrl, 'checkpoint_completed', {
        keysystemName: keysystem.name,
        keysystemId: keysystem.id,
        checkpointIndex: checkpointIndex,
        totalCheckpoints: keysystem.checkpoints.length,
        checkpointType: keysystem.checkpoints[checkpointIndex]?.type,
        sessionId: sessionId,
        ip: ip,
        userAgent: userAgent
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Progress updated successfully',
      newCheckpointIndex: checkpointIndex
    });

  } catch (error) {
    console.error('Update progress error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}