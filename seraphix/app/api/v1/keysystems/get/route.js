
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const keysystemId = searchParams.get('id');

    if (!keysystemId) {
      return NextResponse.json({ error: 'Keysystem ID is required' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('Cryptix');
    const collection = db.collection('customers');

    // Find the keysystem across all users
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

    return NextResponse.json({
      success: true,
      keysystem: {
        id: keysystem.id,
        name: keysystem.name,
        checkpoints: keysystem.checkpoints || [],
        checkpointCount: (keysystem.checkpoints || []).length,
        maxKeyPerPerson: keysystem.maxKeyPerPerson,
        keyTimer: keysystem.keyTimer,
        keyCooldown: keysystem.keyCooldown,
        stats: keysystem.stats || {},
        active: keysystem.active
      }
    });

  } catch (error) {
    console.error('Get keysystem error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
