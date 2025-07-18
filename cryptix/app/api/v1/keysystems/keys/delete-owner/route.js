import { NextResponse } from 'next/server';
import clientPromise from '../../../../../../lib/mongodb';

export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { keysystemId, keyValue } = await request.json();

    // Validation
    if (!keysystemId || !keyValue) {
      return NextResponse.json({ error: 'Keysystem ID and key value are required' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('Cryptix');
    const collection = db.collection('customers');

    // Find user by token and verify they own the keysystem
    const user = await collection.findOne({ 
      token: token,
      'keysystems.id': keysystemId
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid token or keysystem not found' }, { status: 401 });
    }

    // Find the keysystem
    const keysystem = user.keysystems.find(ks => ks.id === keysystemId);
    if (!keysystem) {
      return NextResponse.json({ error: 'Keysystem not found' }, { status: 404 });
    }

    // Remove the key from sessions collection
    const sessionsCollection = db.collection('sessions');
    const result = await sessionsCollection.updateMany(
      { 
        keysystem_id: keysystemId,
        'keys.value': keyValue
      },
      { 
        $pull: { 
          keys: { value: keyValue } 
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Key deleted successfully'
    });

  } catch (error) {
    console.error('Delete key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../../lib/mongodb';

export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { keysystemId, keyValue } = await request.json();

    // Validation
    if (!keysystemId || !keyValue) {
      return NextResponse.json({ error: 'Keysystem ID and key value are required' }, { status: 400 });
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

    // Find the keysystem and remove the specific key
    const result = await collection.updateOne(
      { 
        _id: user._id,
        'keysystems.id': keysystemId
      },
      { 
        $pull: { 
          'keysystems.$.keys': { value: keyValue }
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Key not found or failed to delete' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Key deleted successfully'
    });

  } catch (error) {
    console.error('Delete key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
