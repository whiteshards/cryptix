import { NextResponse } from 'next/server';
import clientPromise from '../../../../../../lib/mongodb';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { keysystemId, type, redirect_url } = await request.json();

    // Validation
    if (!keysystemId || !type || !redirect_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['custom', 'linkvertise', 'lootlabs', 'workink'].includes(type)) {
      return NextResponse.json({ error: 'Invalid checkpoint type' }, { status: 400 });
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

    // Check if user has lootlabs integration for lootlabs checkpoints
    if (type === 'lootlabs' && !user.integrations?.lootlabs) {
      return NextResponse.json({ error: 'Lootlabs API key required in integrations' }, { status: 400 });
    }

    // Find the keysystem
    const keysystem = user.keysystems?.find(ks => ks.id === keysystemId);
    if (!keysystem) {
      return NextResponse.json({ error: 'Keysystem not found' }, { status: 404 });
    }

    // Check checkpoint limit (max 10)
    if (keysystem.checkpoints && keysystem.checkpoints.length >= 10) {
      return NextResponse.json({ error: 'Maximum checkpoints limit reached (10)' }, { status: 400 });
    }

    // Generate callback token
    const generateToken = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      let token = '';
      for (let i = 0; i < 48; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return token;
    };

    const callbackToken = generateToken();

    // Create checkpoint object based on type
    let newCheckpoint;

    if (type === 'lootlabs') {
      // LootLabs checkpoints don't need callback_token, they use callback_urls object
      newCheckpoint = {
        type: type,
        redirect_url: redirect_url,
        callback_urls: {} // This will be populated dynamically per session
      };
    } else {
      // Other checkpoint types (custom, linkvertise, workink) use callback_token
      const callbackUrl = `https://cryptixmanager.vercel.app/ads/callback/${callbackToken}`;
      newCheckpoint = {
        type: type,
        redirect_url: redirect_url,
        callback_url: callbackUrl,
        callback_token: callbackToken
      };
    }

    // Add checkpoint to keysystem
    const result = await collection.updateOne(
      { 
        _id: user._id,
        'keysystems.id': keysystemId
      },
      { 
        $push: {
          'keysystems.$.checkpoints': newCheckpoint
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to create checkpoint' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      checkpoint: newCheckpoint,
      message: 'Checkpoint created successfully'
    });

  } catch (error) {
    console.error('Create checkpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}