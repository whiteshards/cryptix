
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';
import rateLimit from 'express-rate-limit';

// Rate limiter for session creation - 5 requests per hour
const sessionCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many session creation requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper function to run middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export async function POST(request) {
  try {
    // Apply rate limiting
    const res = new Response();
    await runMiddleware(request, res, sessionCreateLimiter);
    
    const { keysystemId, sessionId } = await request.json();

    if (!keysystemId || !sessionId) {
      return NextResponse.json({ error: 'Keysystem ID and session ID are required' }, { status: 400 });
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

    if (!keysystem) {
      return NextResponse.json({ error: 'Keysystem not found' }, { status: 404 });
    }

    if (!keysystem.active) {
      return NextResponse.json({ error: 'Keysystem is not active' }, { status: 403 });
    }

    // Initialize keys object if it doesn't exist
    if (!keysystem.keys) {
      keysystem.keys = {};
    }

    // Check if session already exists
    if (keysystem.keys[sessionId]) {
      return NextResponse.json({
        success: true,
        session: keysystem.keys[sessionId],
        message: 'Session already exists'
      });
    }

    // Create new session
    const newSession = {
      keys: [],
      current_checkpoint: 0,
      created_at: new Date().toISOString()
    };

    // Update the keysystem with new session
    const result = await collection.updateOne(
      { 
        _id: user._id,
        'keysystems.id': keysystemId
      },
      { 
        $set: {
          [`keysystems.$.keys.${sessionId}`]: newSession
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      session: newSession,
      message: 'Session created successfully'
    });

  } catch (error) {
    console.error('Session management error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const keysystemId = searchParams.get('keysystemId');
    const sessionId = searchParams.get('sessionId');

    if (!keysystemId || !sessionId) {
      return NextResponse.json({ error: 'Keysystem ID and session ID are required' }, { status: 400 });
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

    return NextResponse.json({
      success: true,
      session: session || null,
      exists: !!session
    });

  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
