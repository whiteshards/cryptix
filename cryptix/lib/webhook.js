
import fetch from 'node-fetch';

// Webhook notification utility
export async function sendWebhookNotification(webhookUrl, data) {
  if (!webhookUrl || !webhookUrl.trim()) {
    return; // Skip if no webhook URL
  }

  try {
    const payload = {
      username: "Cryptix Notifications",
      avatar_url: "https://cryptixmanager.vercel.app/images/unrounded-logo.png",
      embeds: [data]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      timeout: 5000 // 5 second timeout
    });

    // Ignore any errors - just continue silently
  } catch (error) {
    // Completely ignore webhook failures and move on
    console.log('Webhook notification failed (ignored):', error.message);
  }
}

// Create checkpoint completion webhook embed
export function createCheckpointCompletionEmbed(checkpointData) {
  const {
    keysystemId,
    keysystemName,
    checkpointIndex,
    checkpointType,
    sessionId,
    ip,
    userAgent,
    browserSession
  } = checkpointData;

  return {
    title: "🎯 Checkpoint Completed",
    color: 0x00ff00, // Green color
    description: `A checkpoint has been completed in keysystem **${keysystemName}**`,
    fields: [
      {
        name: "📋 Keysystem Info",
        value: `**ID:** ${keysystemId}\n**Name:** ${keysystemName}`,
        inline: true
      },
      {
        name: "🔗 Checkpoint Details",
        value: `**Index:** ${checkpointIndex + 1}\n**Type:** ${checkpointType.toUpperCase()}`,
        inline: true
      },
      {
        name: "🔐 Session Info",
        value: sessionId ? `**Session:** ${sessionId}` : "**Session:** N/A (Linkvertise)",
        inline: true
      },
      {
        name: "🌐 Request Info",
        value: `**IP:** ${ip || 'Unknown'}\n**Browser Session:** ${browserSession || 'Unknown'}`,
        inline: false
      },
      {
        name: "🖥️ User Agent",
        value: `\`${userAgent || 'Unknown'}\``,
        inline: false
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "Cryptix Keysystem Manager",
      icon_url: "https://cryptixmanager.vercel.app/images/unrounded-logo.png"
    }
  };
}

// Create anti-bypass webhook embed
export function createAntiBypassEmbed(bypassData) {
  const {
    keysystemId,
    keysystemName,
    ip,
    userAgent,
    browserSession,
    reason
  } = bypassData;

  return {
    title: "🚨 Anti-Bypass Triggered",
    color: 0xff0000, // Red color
    description: `Anti-bypass protection has been triggered in keysystem **${keysystemName}**`,
    fields: [
      {
        name: "📋 Keysystem Info",
        value: `**ID:** ${keysystemId}\n**Name:** ${keysystemName}`,
        inline: true
      },
      {
        name: "⚠️ Trigger Reason",
        value: reason || "Bypass attempt detected",
        inline: true
      },
      {
        name: "🌐 Request Info",
        value: `**IP:** ${ip || 'Unknown'}\n**Browser Session:** ${browserSession || 'Unknown'}`,
        inline: false
      },
      {
        name: "🖥️ User Agent",
        value: `\`${userAgent || 'Unknown'}\``,
        inline: false
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "Cryptix Anti-Bypass System",
      icon_url: "https://cryptixmanager.vercel.app/images/unrounded-logo.png"
    }
  };
}
