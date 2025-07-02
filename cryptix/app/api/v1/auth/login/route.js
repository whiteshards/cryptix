
import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';
import { addUserToGuild } from '../../../../../lib/utils';

export async function POST(request) {
  try {
    const { code, redirect_uri } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 });
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri,
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.json({ error: 'Failed to exchange code for tokens' }, { status: 400 });
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token } = tokens;

    // Get user info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json({ error: 'Failed to get user information' }, { status: 400 });
    }

    const discordUser = await userResponse.json();

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('Cryptix');
    const collection = db.collection('customers');

    // Find existing user
    const existingUser = await collection.findOne({ discord_id: discordUser.id });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found. Please register first.' }, { status: 404 });
    }

    // Update user's refresh token
    await collection.updateOne(
      { discord_id: discordUser.id },
      { 
        $set: { 
          token: refresh_token,
          updatedAt: new Date()
        }
      }
    );

    // Add user to Discord guild (in case they left)
    await addUserToGuild(access_token, discordUser.id);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        discord_id: discordUser.id,
        password: existingUser.password
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
