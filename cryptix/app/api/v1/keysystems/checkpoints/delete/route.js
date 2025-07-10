
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../../lib/mongodb';

export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const {
      keysystemId,
      checkpointIndex
    } = await request.json();

    // Validation
    if (!keysystemId || checkpointIndex === undefined) {
      return NextResponse.json({ error: 'Keysystem ID and checkpoint index are required' }, { status: 400 });
    }

    if (checkpointIndex < 0 || !Number.isInteger(checkpointIndex)) {
      return NextResponse.json({ error: 'Invalid checkpoint index' }, { status: 400 });
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
    if (checkpointIndex >= checkpoints.length) {
      return NextResponse.json({ error: 'Checkpoint index out of range' }, { status: 400 });
    }

    // Remove checkpoint from array
    checkpoints.splice(checkpointIndex, 1);

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
      return NextResponse.json({ error: 'Failed to delete checkpoint' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Checkpoint deleted successfully'
    });

  } catch (error) {
    console.error('Delete checkpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
