
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const callbackToken = searchParams.get('token');

    if (!callbackToken) {
      return NextResponse.json({ error: 'Callback token is required' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('Cryptix');
    const collection = db.collection('customers');

    // Find the user and keysystem that contains this callback token
    const user = await collection.findOne({
      'keysystems.checkpoints.callback_token': callbackToken
    });

    if (!user) {
      return NextResponse.json({ error: 'Checkpoint not found' }, { status: 404 });
    }

    // Find the specific keysystem and checkpoint
    let targetKeysystem = null;
    let targetCheckpoint = null;
    let checkpointIndex = -1;

    for (const keysystem of user.keysystems) {
      if (keysystem.checkpoints) {
        const index = keysystem.checkpoints.findIndex(cp => cp.callback_token === callbackToken);
        if (index !== -1) {
          targetKeysystem = keysystem;
          targetCheckpoint = keysystem.checkpoints[index];
          checkpointIndex = index;
          break;
        }
      }
    }

    if (!targetKeysystem || !targetCheckpoint) {
      return NextResponse.json({ error: 'Checkpoint not found' }, { status: 404 });
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
      checkpointIndex: checkpointIndex
    });

  } catch (error) {
    console.error('Find checkpoint by token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
