
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../../lib/mongodb';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const {
      keysystemId,
      type,
      redirect_url
    } = await request.json();

    // Validation
    if (!keysystemId || !type || !redirect_url) {
      return NextResponse.json({ error: 'Keysystem ID, type, and redirect URL are required' }, { status: 400 });
    }

    // Validate type
    const allowedTypes = ['linkvertise', 'lootlabs', 'workink', 'custom'];
    if (!allowedTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid checkpoint type' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(redirect_url);
    } catch {
      return NextResponse.json({ error: 'Invalid redirect URL format' }, { status: 400 });
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

    // Find the keysystem and verify ownership
    const keysystem = user.keysystems?.find(ks => ks.id === keysystemId);
    if (!keysystem) {
      return NextResponse.json({ error: 'Keysystem not found or access denied' }, { status: 404 });
    }

    // Check if checkpoints limit is reached (accounting for mandatory first checkpoint)
    const currentCheckpoints = keysystem.checkpoints || [];
    if (currentCheckpoints.length >= 10) {
      return NextResponse.json({ error: 'Maximum of 10 checkpoints allowed (including mandatory first checkpoint)' }, { status: 400 });
    }

    // Generate a 48-character unique token
    const generateToken = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      let token = '';
      for (let i = 0; i < 48; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return token;
    };

    const callbackToken = generateToken();

    // Create checkpoint object
    const newCheckpoint = {
      type: type,
      redirect_url: redirect_url,
      callback_url: `https://cryptixmanager.vercel.app/ads/callback/${callbackToken}`
    };

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
