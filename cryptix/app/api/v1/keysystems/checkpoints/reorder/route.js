
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../../lib/mongodb';

export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const {
      keysystemId,
      fromIndex,
      toIndex
    } = await request.json();

    // Validation
    if (!keysystemId || fromIndex === undefined || toIndex === undefined) {
      return NextResponse.json({ error: 'Keysystem ID, fromIndex, and toIndex are required' }, { status: 400 });
    }

    if (fromIndex < 0 || toIndex < 0 || !Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) {
      return NextResponse.json({ error: 'Invalid indices' }, { status: 400 });
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

    const checkpoints = keysystem.checkpoints || [];
    if (fromIndex >= checkpoints.length || toIndex >= checkpoints.length) {
      return NextResponse.json({ error: 'Index out of range' }, { status: 400 });
    }

    // Prevent reordering involving mandatory first checkpoint
    if ((fromIndex === 0 || toIndex === 0) && checkpoints[0]?.mandatory) {
      return NextResponse.json({ error: 'Cannot reorder mandatory first checkpoint' }, { status: 403 });
    }

    // Reorder checkpoints array
    const [movedCheckpoint] = checkpoints.splice(fromIndex, 1);
    checkpoints.splice(toIndex, 0, movedCheckpoint);

    // Update the keysystem with new checkpoints array
    const result = await collection.updateOne(
      { 
        _id: user._id,
        'keysystems.id': keysystemId
      },
      { 
        $set: {
          'keysystems.$.checkpoints': checkpoints
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to reorder checkpoints' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Checkpoints reordered successfully'
    });

  } catch (error) {
    console.error('Reorder checkpoints error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
