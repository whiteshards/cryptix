
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../../lib/mongodb';

export async function POST(request) {
  try {
    const { keysystemId, sessionId, checkpointIndex } = await request.json();

    if (!keysystemId || !sessionId || checkpointIndex === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('Cryptix');
    const collection = db.collection('customers');

    // Remove the session's callback token from the callback_urls dictionary
    const result = await collection.updateOne(
      { 
        'keysystems.id': keysystemId
      },
      { 
        $unset: {
          [`keysystems.$.checkpoints.${checkpointIndex}.callback_urls.${sessionId}`]: ""
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to cleanup callback URL' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'LootLabs callback cleaned up successfully'
    });

  } catch (error) {
    console.error('LootLabs cleanup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
