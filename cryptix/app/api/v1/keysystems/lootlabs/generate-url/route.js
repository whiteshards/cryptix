
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

    // Find the user who owns this keysystem
    const user = await collection.findOne({
      'keysystems.id': keysystemId
    });

    if (!user) {
      return NextResponse.json({ error: 'Keysystem not found' }, { status: 404 });
    }

    // Check if user has LootLabs integration
    if (!user.integrations || !user.integrations.lootlabs || user.integrations.lootlabs.trim() === '') {
      return NextResponse.json({ error: 'Misconfigured keysystem. Please add a valid LootLabs API key to the owner\'s account of the keysystem.' }, { status: 400 });
    }

    // Find the specific keysystem
    const keysystem = user.keysystems.find(ks => ks.id === keysystemId);

    if (!keysystem || !keysystem.active) {
      return NextResponse.json({ error: 'Keysystem not found or not active' }, { status: 404 });
    }

    // Get the checkpoint
    const checkpoint = keysystem.checkpoints[checkpointIndex];
    if (!checkpoint || checkpoint.type !== 'lootlabs') {
      return NextResponse.json({ error: 'Invalid checkpoint' }, { status: 400 });
    }

    // Generate callback token for this session
    const generateToken = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      let token = '';
      for (let i = 0; i < 48; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return token;
    };

    const callbackToken = generateToken();
    const callbackUrl = `https://cryptixmanager.vercel.app/ads/callback/${callbackToken}`;

    // Update callback_urls dictionary for this checkpoint
    const result = await collection.updateOne(
      { 
        _id: user._id,
        'keysystems.id': keysystemId
      },
      { 
        $set: {
          [`keysystems.$.checkpoints.${checkpointIndex}.callback_urls.${sessionId}`]: callbackToken
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to update callback URLs' }, { status: 500 });
    }

    // Get encrypted URL from LootLabs API
    try {
      console.log('Making LootLabs API request with URL:', callbackUrl);
      console.log('Using API token:', user.integrations.lootlabs ? 'Present' : 'Missing');

      const lootlabsResponse = await fetch('https://creators.lootlabs.gg/api/public/url_encryptor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination_url: callbackUrl,
          api_token: user.integrations.lootlabs
        }),
      });

      if (!lootlabsResponse.ok) {
        console.error('LootLabs API HTTP error:', lootlabsResponse.status, lootlabsResponse.statusText);
        throw new Error(`LootLabs API HTTP error: ${lootlabsResponse.status}`);
      }

      const lootlabsData = await lootlabsResponse.json();
      console.log('LootLabs API response:', lootlabsData);

      if (lootlabsData.type !== 'created' && lootlabsData.type !== 'fetched') {
        console.error('LootLabs API returned error type:', lootlabsData);
        throw new Error('LootLabs API error: ' + (lootlabsData.message || 'Unknown error'));
      }

      // Construct the final LootLabs URL
      const lootlabsUrl = `${checkpoint.redirect_url}&data=${encodeURIComponent(lootlabsData.message)}`;

      return NextResponse.json({
        success: true,
        lootlabsUrl: lootlabsUrl,
        callbackToken: callbackToken
      });

    } catch (error) {
      console.error('LootLabs API error:', error);
      return NextResponse.json({ error: 'Misconfigured keysystem. Please add a valid LootLabs API key to the owner\'s account of the keysystem.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Generate LootLabs URL error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
