
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const {
      name,
      maxKeyPerPerson,
      keyTimer,
      permanentKeys,
      keyCooldown
    } = await request.json();

    // Validation
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Sanitize name - only letters and spaces, max 24 characters
    const sanitizedName = name.replace(/[^a-zA-Z\s]/g, '').trim().slice(0, 24);
    if (sanitizedName.length < 3) {
      return NextResponse.json({ error: 'Name must be at least 3 characters and contain only letters and spaces' }, { status: 400 });
    }

    // Validate numeric fields
    const maxKeys = parseInt(maxKeyPerPerson);
    if (!maxKeys || maxKeys < 1) {
      return NextResponse.json({ error: 'Max key per person must be at least 1' }, { status: 400 });
    }

    

    const timer = parseInt(keyTimer);
    if (!permanentKeys && (!timer || timer < 1 || timer > 196)) {
      return NextResponse.json({ error: 'Key timer must be between 1 and 196 hours' }, { status: 400 });
    }

    const cooldown = parseInt(keyCooldown);
    if (!cooldown || cooldown < 1 || cooldown > 180) {
      return NextResponse.json({ error: 'Key cooldown must be between 1 and 180 minutes' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('Cryptix');
    const collection = db.collection('customers');

    // Find user by token
    const user = await collection.findOne({ token: token });
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Generate unique keysystem ID (9 letters only)
    const generateId = () => {
      const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let result = '';
      for (let i = 0; i < 9; i++) {
        result += letters.charAt(Math.floor(Math.random() * letters.length));
      }
      return result;
    };
    const keysystemId = generateId();

    // Create mandatory first checkpoint
    const mandatoryCheckpoint = {
      type: 'linkvertise',
      redirect_url: 'https://rinku.pro/VanbywBb',
      callback_url: 'https://cryptixmanager.vercel.app/ads/callback/cryprixcheckpointflyinc',
      mandatory: true
    };

    // Create keysystem object
    const newKeysystem = {
      id: keysystemId,
      name: sanitizedName,
      maxKeyPerPerson: maxKeys,
      keyTimer: permanentKeys ? 0 : timer,
      permanent: permanentKeys,
      keyCooldown: cooldown,
      active: true,
      createdAt: new Date().toISOString(),
      checkpoints: [mandatoryCheckpoint]
    };

    // Add keysystem to user's keysystems array
    const result = await collection.updateOne(
      { _id: user._id },
      { 
        $push: { 
          keysystems: newKeysystem 
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to create keysystem' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      keysystem: newKeysystem,
      message: 'Keysystem created successfully'
    });

  } catch (error) {
    console.error('Create keysystem error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
