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
    const keysystemId = searchParams.get('keysystemId');
    const sessionId = searchParams.get('sessionId');

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

    // Check if session exists and has a token
    const existingSession = keysystem.keys?.[sessionId];
    const hasToken = existingSession && existingSession.session_token;

    return NextResponse.json({
      success: true,
      exists: !!hasToken,
      token: hasToken ? existingSession.session_token.generated_token : null
    });

  } catch (error) {
    console.error('Check session token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import clientPromise from '../../../../../../lib/mongodb';

export async function POST(request) {
  try {
    const { keysystemId, sessionId } = await request.json();

    if (!keysystemId || !sessionId) {
      return NextResponse.json({ error: 'Keysystem ID and session ID are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('Cryptix');
    const collection = db.collection('customers');

    const user = await collection.findOne({
      'keysystems.id': keysystemId
    });

    if (!user) {
      return NextResponse.json({ error: 'Keysystem not found' }, { status: 404 });
    }

    const keysystem = user.keysystems.find(ks => ks.id === keysystemId);

    if (!keysystem || !keysystem.active) {
      return NextResponse.json({ error: 'Keysystem not found or not active' }, { status: 404 });
    }

    const session = keysystem.keys?.[sessionId];

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Generate session token
    const sessionToken = {
      token: Math.random().toString(36).substring(2) + Date.now().toString(36),
      created_at: new Date().toISOString()
    };

    // Update session with token
    const result = await collection.updateOne(
      { 
        _id: user._id,
        'keysystems.id': keysystemId
      },
      { 
        $set: {
          [`keysystems.$.keys.${sessionId}.session_token`]: sessionToken
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to create session token' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      sessionToken: sessionToken.token
    });

  } catch (error) {
    console.error('Create session token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { keysystemId, sessionId } = await request.json();

    if (!keysystemId || !sessionId) {
      return NextResponse.json({ error: 'Keysystem ID and session ID are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('Cryptix');
    const collection = db.collection('customers');

    const result = await collection.updateOne(
      { 
        'keysystems.id': keysystemId
      },
      { 
        $unset: {
          [`keysystems.$.keys.${sessionId}.session_token`]: ""
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to delete session token' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Session token deleted successfully'
    });

  } catch (error) {
    console.error('Delete session token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}