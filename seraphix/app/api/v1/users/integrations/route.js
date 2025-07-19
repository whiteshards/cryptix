
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { integration, value } = await request.json();

    if (!integration) {
      return NextResponse.json({ error: 'Integration type is required' }, { status: 400 });
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

    // Update user's integrations
    const updateData = {
      [`integrations.${integration}`]: value
    };

    const result = await collection.updateOne(
      { _id: user._id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `${integration} integration updated successfully`
    });

  } catch (error) {
    console.error('Integration update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
