import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
const options = {};

let client;
let clientPromise;

if (!process.env.MONGO_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function POST(request) {
  try {
    const { keysystemId, sessionId, checkpointIndex } = await request.json();

    if (!keysystemId || !sessionId || checkpointIndex === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
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

    // Find the specific keysystem
    const keysystem = user.keysystems.find(ks => ks.id === keysystemId);

    if (!keysystem || !keysystem.active) {
      return NextResponse.json({ error: 'Keysystem not found or not active' }, { status: 404 });
    }

    // Check if session exists
    const sessionExists = keysystem.keys?.[sessionId];
    if (!sessionExists) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Prepare stats update - initialize stats object if it doesn't exist
    const statsUpdate = {};

    // Log checkpoint completion in stats
    const checkpointStat = {
      date: new Date().toISOString(),
      type: checkpointType || 'unknown'
      // Note: This will be used for graphical representation later
    };

    // Update session progress and stats
    const result = await collection.updateOne(
      { 
        _id: user._id,
        'keysystems.id': keysystemId
      },
      { 
        $set: {
          [`keysystems.$.keys.${sessionId}.current_checkpoint`]: checkpointIndex
        },
        $push: {
          'keysystems.$.stats.checkpoints': checkpointStat
        },
        // Also remove the session token since checkpoint is completed
        $unset: {
          [`keysystems.$.keys.${sessionId}.session_token`]: ""
        }
      }
    );

    // If the stats field doesn't exist yet, initialize it and try again
    if (result.modifiedCount === 0) {
      // First try to initialize the stats object
      await collection.updateOne(
        { 
          _id: user._id,
          'keysystems.id': keysystemId
        },
        { 
          $set: {
            'keysystems.$.stats': {
              checkpoints: []
            }
          }
        }
      );

      // Then update with both progress and stats
      const retryResult = await collection.updateOne(
        { 
          _id: user._id,
          'keysystems.id': keysystemId
        },
        { 
          $set: {
            [`keysystems.$.keys.${sessionId}.current_checkpoint`]: checkpointIndex
          },
          $push: {
            'keysystems.$.stats.checkpoints': checkpointStat
          },
          // Also remove the session token since checkpoint is completed
          $unset: {
            [`keysystems.$.keys.${sessionId}.session_token`]: ""
          }
        }
      );

      if (retryResult.modifiedCount === 0) {
        return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
      }
    }

    // Send webhook notification for checkpoint completion
    if (keysystem.webhookUrl) {
      try {
        const checkpoint = keysystem.checkpoints[checkpointIndex - 1]; // Previous checkpoint that was just completed
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
        
        // Get geolocation data using external API
        const location = await getLocationFromIP(ip);

        const embed = {
          title: 'Checkpoint Completed',
          color: 0x00ff00,
          thumbnail: {
            url: 'https://seraphix.vercel.app/images/thumbnail.gif'
          },
          fields: [
            {
              name: 'Keysystem',
              value: `\`${keysystem.name} (${keysystem.id})\``,
              inline: true
            },
            {
              name: 'Checkpoint',
              value: `\`${checkpointIndex}/${keysystem.checkpoints.length}\``,
              inline: true
            },
            {
              name: 'Type',
              value: `\`${checkpoint?.type || 'unknown'}\``,
              inline: true
            },
            {
              name: 'Session ID',
              value: `\`${sessionId}\``,
              inline: true
            },
            {
              name: 'IP Address',
              value: `\`${ip}\``,
              inline: true
            },
            {
              name: 'Country',
              value: `\`${location.country}\``,
              inline: true
            },
            {
              name: 'User Agent',
              value: `\`${request.headers.get('user-agent')?.substring(0, 100) + '...' || 'unknown'}\``,
              inline: true
            }
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: 'seraphix.app',
            icon_url: 'https://seraphix.vercel.app/images/unrounded-logo.png'
          }
        };

        const webhookPayload = {
          username: 'seraphix.app',
          avatar_url: 'https://seraphix.vercel.app/images/unrounded-logo.png',
          embeds: [embed]
        };

        await fetch(keysystem.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload)
        });

      } catch (error) {
        console.error('Webhook notification failed:', error);
        // Don't fail the request if webhook fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Progress updated successfully',
      newCheckpointIndex: checkpointIndex
    });

  } catch (error) {
    console.error('Update progress error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getLocationFromIP(ip) {
  try {
    const response = await fetch(`https://api.iplocation.net/json/${ip}`);
    const data = await response.json();
    return {
      country: data.country_name || 'Unknown',
      region: data.region_name || 'Unknown',
      city: data.city || 'Unknown',
      ll: [data.latitude || 0, data.longitude || 0]
    };
  } catch (error) {
    console.error('Error getting location from IP:', error);
    return {
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
      ll: [0, 0]
    };
  }
}