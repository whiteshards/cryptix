
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';
import crypto from 'crypto';

// Generate a cryptographically secure API token
function generateApiToken() {
  // Generate 32 bytes of random data and encode as base64url
  const randomBytes = crypto.randomBytes(32);
  return randomBytes.toString('base64url');
}

// Hash the API token for storage
function hashApiToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('Cryptix');
    const collection = db.collection('customers');

    // Find user by token
    const user = await collection.findOne({ token: token });
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Generate new API token
    const apiToken = generateApiToken();
    const hashedToken = hashApiToken(apiToken);

    // Update user with new API token
    const updateResult = await collection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          api_token: hashedToken,
          api_token_created_at: new Date(),
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to generate API token' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      api_token: apiToken,
      message: 'API token generated successfully'
    });

  } catch (error) {
    console.error('API token generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('Cryptix');
    const collection = db.collection('customers');

    // Find user by token
    const user = await collection.findOne({ token: token });
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Remove API token
    const updateResult = await collection.updateOne(
      { _id: user._id },
      { 
        $unset: { 
          api_token: "",
          api_token_created_at: ""
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to revoke API token' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'API token revoked successfully'
    });

  } catch (error) {
    console.error('API token revocation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
