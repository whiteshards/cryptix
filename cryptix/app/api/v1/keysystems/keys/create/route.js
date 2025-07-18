
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../../lib/mongodb';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request) {
  try {
    const { keysystemId, amount, expirationHours } = await request.json();

    if (!keysystemId || !amount) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Validate amount
    if (amount < 1 || amount > 100) {
      return NextResponse.json({ error: 'Amount must be between 1 and 100' }, { status: 400 });
    }

    // Validate expiration hours
    if (expirationHours !== null && expirationHours !== 0 && (expirationHours < 1 || expirationHours > 360)) {
      return NextResponse.json({ error: 'Expiration hours must be between 1 and 360, or 0 for permanent' }, { status: 400 });
    }

    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let userId;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('Cryptix');
    const collection = db.collection('customers');

    // Find the user and keysystem
    const user = await collection.findOne({
      _id: userId,
      'keysystems.id': keysystemId
    });

    if (!user) {
      return NextResponse.json({ error: 'Keysystem not found or access denied' }, { status: 404 });
    }

    // Find the specific keysystem
    const keysystem = user.keysystems.find(ks => ks.id === keysystemId);

    if (!keysystem || !keysystem.active) {
      return NextResponse.json({ error: 'Keysystem not found or not active' }, { status: 404 });
    }

    // Generate session ID
    const sessionId = `generated_${uuidv4().replace(/-/g, '')}`;

    // Create keys
    const createdKeys = [];
    const now = new Date();

    for (let i = 0; i < amount; i++) {
      const keyValue = generateKey();
      let expiresAt = null;

      if (expirationHours === 0) {
        // Permanent key - no expiration
        expiresAt = null;
      } else if (expirationHours) {
        // Custom expiration
        expiresAt = new Date(now.getTime() + (expirationHours * 60 * 60 * 1000));
      } else {
        // Use keysystem default
        expiresAt = new Date(now.getTime() + (keysystem.keyTimer * 60 * 60 * 1000));
      }

      const newKey = {
        value: keyValue,
        hwid: null,
        created_at: now.toISOString(),
        expires_at: expiresAt ? expiresAt.toISOString() : null,
        status: 'active'
      };

      createdKeys.push(newKey);
    }

    // Create session data
    const sessionData = {
      keys: createdKeys,
      hwid: null,
      current_checkpoint: keysystem.checkpoints ? keysystem.checkpoints.length : 0,
      cooldown_till: null,
      created_at: now.toISOString(),
      generated_by_owner: true
    };

    // Update database
    const result = await collection.updateOne(
      { 
        _id: userId,
        'keysystems.id': keysystemId
      },
      { 
        $set: {
          [`keysystems.$.keys.${sessionId}`]: sessionData
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to create keys' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      sessionId: sessionId,
      keysCreated: amount,
      keys: createdKeys,
      message: `Successfully created ${amount} key(s)`
    });

  } catch (error) {
    console.error('Create keys error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
