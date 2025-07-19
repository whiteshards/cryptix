import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';

export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const {
      keysystemId,
      maxKeyPerPerson,
      keyTimer,
      keyCooldown,
      webhookUrl,
      active
    } = await request.json();

    // Validation
    if (!keysystemId) {
      return NextResponse.json({ error: 'Keysystem ID is required' }, { status: 400 });
    }

    // Validate numeric fields
    const maxKeys = parseInt(maxKeyPerPerson);
    if (!maxKeys || maxKeys < 1) {
      return NextResponse.json({ error: 'Max key per person must be at least 1' }, { status: 400 });
    }



    const timer = parseInt(keyTimer);
    if (!timer || timer < 1 || timer > 750) {
      return NextResponse.json({ error: 'Key timer must be between 1 and 750 hours' }, { status: 400 });
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

    // Retrieve existing keysystem
     const existingUser = await collection.findOne(
      { _id: user._id },
      { projection: { keysystems: { $elemMatch: { id: keysystemId } } } }
    );

    const existingKeysystem = existingUser?.keysystems?.[0];

    // Update the specific keysystem
    const result = await collection.updateOne(
      { 
        _id: user._id,
        'keysystems.id': keysystemId
      },
      { 
        $set: {
          'keysystems.$.maxKeyPerPerson': maxKeys,
          'keysystems.$.keyTimer': timer,
          'keysystems.$.keyCooldown': cooldown,
          'keysystems.$.active': active !== undefined ? active : true,
          'keysystems.$.webhookUrl': webhookUrl && webhookUrl.trim() ? webhookUrl.trim() : null,
          'keysystems.$.maxKeyLimit': existingKeysystem?.maxKeyLimit || 5000
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Keysystem not found or failed to update' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Keysystem updated successfully'
    });

  } catch (error) {
    console.error('Update keysystem error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}