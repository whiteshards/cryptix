import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { name, maxKeyPerPerson, keyTimer, keyCooldown, webhookUrl } = await request.json();

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
    if (!timer || timer < 1 || timer > 744) {
      return NextResponse.json({ error: 'Key timer must be between 1 and 744 hours (1 month)' }, { status: 400 });
    }

    const cooldown = parseInt(keyCooldown);
    if (!cooldown || cooldown < 1 || cooldown > 180) {
      return NextResponse.json({ error: 'Key cooldown must be between 1 and 180 minutes' }, { status: 400 });
    }

    // Validate webhook URL if provided
    if (webhookUrl && webhookUrl.trim()) {
      try {
        new URL(webhookUrl.trim());
      } catch (error) {
        return NextResponse.json({ error: 'Invalid webhook URL format' }, { status: 400 });
      }
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

    // Generate callback token for mandatory checkpoint
    const generateToken = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      let token = '';
      for (let i = 0; i < 48; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return token;
    };

    const mandatoryCallbackToken = generateToken();
    const mandatoryCallbackUrl = `https://cryptixmanager.vercel.app/ads/callback/${mandatoryCallbackToken}`;

    // Create Rinku shortened link for mandatory checkpoint
    let mandatoryRedirectUrl;
    try {
      const rinkuResponse = await fetch(`https://rinku.pro/api?api=f7ef24b42f579355d9e2ae7b6af7de40cecfeeac&url=${encodeURIComponent(mandatoryCallbackUrl)}&alias=${keysystemId}_mandatory`);
      const rinkuData = await rinkuResponse.json();

      if (rinkuData.status === 'success') {
        mandatoryRedirectUrl = rinkuData.shortenedUrl;
      } else {
        throw new Error('Failed to create Rinku link');
      }
    } catch (error) {
      console.error('Rinku API error:', error);
      return NextResponse.json({ error: 'Failed to create mandatory checkpoint link' }, { status: 500 });
    }

    // Create mandatory first checkpoint
    const mandatoryCheckpoint = {
      type: 'custom',
      redirect_url: mandatoryRedirectUrl,
      callback_url: mandatoryCallbackUrl,
      callback_token: mandatoryCallbackToken,
      mandatory: true
    };

    // Create keysystem object
    const newKeysystem = {
      id: keysystemId,
      name: sanitizedName,
      maxKeyPerPerson: maxKeys,
      keyTimer: timer,
      keyCooldown: cooldown,
      webhookUrl: webhookUrl && webhookUrl.trim() ? webhookUrl.trim() : null,
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