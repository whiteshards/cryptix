
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';

export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { keysystemId } = await request.json();

    // Validation
    if (!keysystemId) {
      return NextResponse.json({ error: 'Keysystem ID is required' }, { status: 400 });
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

    // Remove the keysystem from the user's keysystems array
    const result = await collection.updateOne(
      { _id: user._id },
      { 
        $pull: { 
          keysystems: { id: keysystemId } 
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Keysystem not found or failed to delete' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Keysystem deleted successfully'
    });

  } catch (error) {
    console.error('Delete keysystem error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
