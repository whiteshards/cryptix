
import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import { sendWebhookNotification, createAntiBypassEmbed } from '../../../../lib/webhook';

export async function POST(request) {
  try {
    const { keysystemId, reason, sessionId } = await request.json();

    if (!keysystemId) {
      return NextResponse.json({ error: 'Keysystem ID is required' }, { status: 400 });
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

    // Send webhook notification if webhook URL is configured
    if (keysystem.webhookUrl) {
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'Unknown';
      const userAgent = request.headers.get('user-agent') || 'Unknown';
      const browserSession = request.headers.get('x-browser-session') || sessionId || 'Unknown';

      const bypassData = {
        keysystemId: keysystem.id,
        keysystemName: keysystem.name,
        ip: ip,
        userAgent: userAgent,
        browserSession: browserSession,
        reason: reason || 'Bypass attempt detected'
      };

      const embed = createAntiBypassEmbed(bypassData);
      sendWebhookNotification(keysystem.webhookUrl, embed);
    }

    return NextResponse.json({
      success: true,
      message: 'Anti-bypass triggered and logged'
    });

  } catch (error) {
    console.error('Anti-bypass error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
