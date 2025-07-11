
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../../lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Keysystem ID is required' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('Cryptix');
    const collection = db.collection('customers');

    // Find the keysystem across all users
    const user = await collection.findOne({ 
      'keysystems.id': id 
    });

    if (!user) {
      return NextResponse.json({ error: 'Keysystem not found' }, { status: 404 });
    }

    // Find the specific keysystem
    const keysystem = user.keysystems.find(ks => ks.id === id);
    
    if (!keysystem) {
      return NextResponse.json({ error: 'Keysystem not found' }, { status: 404 });
    }

    // Return only public data
    const publicKeysystem = {
      id: keysystem.id,
      name: keysystem.name,
      active: keysystem.active,
      maxKeyPerPerson: keysystem.maxKeyPerPerson,
      keyTimer: keysystem.keyTimer,
      permanent: keysystem.permanent,
      keyCooldown: keysystem.keyCooldown,
      checkpoints: keysystem.checkpoints || []
    };

    return NextResponse.json({
      success: true,
      keysystem: publicKeysystem
    });

  } catch (error) {
    console.error('Public keysystem fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
