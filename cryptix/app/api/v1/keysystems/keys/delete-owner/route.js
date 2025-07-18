import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import clientPromise from '../../../../../../lib/mongodb';

export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { keysystemId, keyValue } = await request.json();

    if (!keysystemId || !keyValue) {
      return NextResponse.json({ error: 'Missing keysystemId or keyValue' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('cryptix');

    // Verify the keysystem belongs to the user
    const keysystem = await db.collection('keysystems').findOne({
      id: keysystemId,
      owner: decoded.userId
    });

    if (!keysystem) {
      return NextResponse.json({ error: 'Keysystem not found or access denied' }, { status: 404 });
    }

    // Find and delete the key
    const result = await db.collection('keys').deleteOne({
      keysystem_id: keysystemId,
      value: keyValue
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Key deleted successfully' 
    }, { status: 200 });

  } catch (error) {
    console.error('Delete key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}