
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';

// Rate limiting storage (in production, use Redis or similar)
const rateLimitStore = new Map();

function getRateLimit(ip) {
  const now = Date.now();
  const windowStart = Math.floor(now / (60 * 60 * 1000)) * (60 * 60 * 1000); // 1-hour window
  const key = `${ip}:${windowStart}`;
  
  const current = rateLimitStore.get(key) || 0;
  
  // Clean up old entries
  for (const [storeKey] of rateLimitStore) {
    const [, timestamp] = storeKey.split(':');
    if (parseInt(timestamp) < windowStart) {
      rateLimitStore.delete(storeKey);
    }
  }
  
  return {
    count: current,
    key,
    limit: 5
  };
}

function incrementRateLimit(key) {
  const current = rateLimitStore.get(key) || 0;
  rateLimitStore.set(key, current + 1);
}

function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

export async function POST(request) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimit = getRateLimit(clientIP);
    
    if (rateLimit.count >= rateLimit.limit) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    
    incrementRateLimit(rateLimit.key);

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
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimit = getRateLimit(clientIP);
    
    if (rateLimit.count >= rateLimit.limit) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    
    incrementRateLimit(rateLimit.key);

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
