
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

export async function POST(request) {
  try {
    const { keysystemId, sessionId, sessionToken } = await request.json();

    if (!keysystemId || !sessionId || !sessionToken) {
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

    // Check if session exists and doesn't already have a token
    const existingSession = keysystem.keys?.[sessionId];
    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (existingSession.session_token) {
      return NextResponse.json({ 
        success: true, 
        token: existingSession.session_token.generated_token,
        message: 'Session token already exists'
      });
    }

    // Create new session token object
    const tokenData = {
      generated_token: sessionToken,
      created_at: Date.now()
    };

    // Update the session with the token
    const result = await collection.updateOne(
      { 
        _id: user._id,
        'keysystems.id': keysystemId
      },
      { 
        $set: {
          [`keysystems.$.keys.${sessionId}.session_token`]: tokenData
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to store session token' }, { status: 500 });
    }

    // Schedule token deletion after 8 minutes (480,000ms)
    setTimeout(async () => {
      try {
        await collection.updateOne(
          { 
            _id: user._id,
            'keysystems.id': keysystemId
          },
          { 
            $unset: {
              [`keysystems.$.keys.${sessionId}.session_token`]: ""
            }
          }
        );
        console.log(`Token expired and deleted for session ${sessionId}`);
      } catch (error) {
        console.error('Error deleting expired token:', error);
      }
    }, 8 * 60 * 1000); // 8 minutes

    return NextResponse.json({
      success: true,
      token: sessionToken,
      message: 'Session token created successfully'
    });

  } catch (error) {
    console.error('Session token creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../../lib/mongodb';

export async function POST(request) {
  try {
    const { keysystemId, sessionId, sessionToken } = await request.json();

    if (!keysystemId || !sessionId || !sessionToken) {
      return NextResponse.json({ error: 'Keysystem ID, session ID, and session token are required' }, { status: 400 });
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
    if (!keysystem.keys || !keysystem.keys[sessionId]) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Store session token with creation timestamp
    const currentTime = new Date().toISOString();
    const result = await collection.updateOne(
      { 
        _id: user._id,
        'keysystems.id': keysystemId
      },
      { 
        $set: {
          [`keysystems.$.keys.${sessionId}.session_token`]: sessionToken,
          [`keysystems.$.keys.${sessionId}.session_token_created_at`]: currentTime
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to store session token' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      token: sessionToken,
      createdAt: currentTime,
      message: 'Session token stored successfully'
    });

  } catch (error) {
    console.error('Store session token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
