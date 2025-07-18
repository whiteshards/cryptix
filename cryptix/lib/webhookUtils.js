
import { Webhook } from 'discord-webhook';

export async function sendWebhookNotification(webhookUrl, type, data) {
  if (!webhookUrl) return;

  try {
    const webhook = new Webhook(webhookUrl);

    let embed;

    switch (type) {
      case 'checkpoint_completed':
        embed = {
          title: '✅ Checkpoint Completed',
          color: 0x00ff00,
          thumbnail: {
            url: 'https://cryptixmanager.vercel.app/images/thumbnail.gif'
          },
          fields: [
            {
              name: 'Keysystem',
              value: `\`${data.keysystemName} (${data.keysystemId})\``,
              inline: true
            },
            {
              name: 'Checkpoint',
              value: `\`${data.checkpointIndex + 1}/${data.totalCheckpoints}\``,
              inline: true
            },
            {
              name: 'Type',
              value: `\`${data.checkpointType || 'unknown'}\``,
              inline: true
            },
            {
              name: 'Session ID',
              value: `\`${data.sessionId}\``,
              inline: true
            },
            {
              name: 'IP Address',
              value: `\`${data.ip}\``,
              inline: true
            },
            {
              name: 'User Agent',
              value: `\`${data.userAgent && data.userAgent.length > 100 ? data.userAgent.substring(0, 100) + '...' : data.userAgent || 'unknown'}\``,
              inline: true
            }
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Cryptix Manager',
            icon_url: 'https://cryptixmanager.vercel.app/images/unrounded-logo.png'
          }
        };
        break;

      case 'anti_bypass_triggered':
        embed = {
          title: '🚨 Anti-Bypass Triggered',
          color: 0xff0000,
          thumbnail: {
            url: 'https://cryptixmanager.vercel.app/images/thumbnail.gif'
          },
          fields: [
            {
              name: 'Keysystem',
              value: `\`${data.keysystemName} (${data.keysystemId})\``,
              inline: true
            },
            {
              name: 'IP Address',
              value: `\`${data.ip}\``,
              inline: true
            },
            {
              name: 'User Agent',
              value: `\`${data.userAgent && data.userAgent.length > 100 ? data.userAgent.substring(0, 100) + '...' : data.userAgent || 'unknown'}\``,
              inline: true
            },
            {
              name: 'Referer',
              value: `\`${data.referer || 'Direct access'}\``,
              inline: true
            },
            {
              name: 'Session ID',
              value: `\`${data.sessionId || 'N/A'}\``,
              inline: true
            }
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Cryptix Manager',
            icon_url: 'https://cryptixmanager.vercel.app/images/unrounded-logo.png'
          }
        };
        break;

      case 'key_generated':
        embed = {
          title: '🔑 Key Generated',
          color: 0x0099ff,
          thumbnail: {
            url: 'https://cryptixmanager.vercel.app/images/thumbnail.gif'
          },
          fields: [
            {
              name: 'Keysystem',
              value: `\`${data.keysystemName} (${data.keysystemId})\``,
              inline: true
            },
            {
              name: 'Key Value',
              value: `||\`${data.keyValue}\`||`,
              inline: true
            },
            {
              name: 'Session ID',
              value: `\`${data.sessionId}\``,
              inline: true
            },
            {
              name: 'Expires At',
              value: `\`${new Date(data.expiresAt).toLocaleString()}\``,
              inline: true
            },
            {
              name: 'IP Address',
              value: `\`${data.ip}\``,
              inline: true
            },
            {
              name: 'User Agent',
              value: `\`${data.userAgent && data.userAgent.length > 100 ? data.userAgent.substring(0, 100) + '...' : data.userAgent || 'unknown'}\``,
              inline: true
            }
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Cryptix Manager',
            icon_url: 'https://cryptixmanager.vercel.app/images/unrounded-logo.png'
          }
        };
        break;

      default:
        return;
    }

    await webhook.send({
      username: 'Cryptix Notifications',
      avatar_url: 'https://cryptixmanager.vercel.app/images/unrounded-logo.png',
      embeds: [embed]
    });

  } catch (error) {
    console.error('Webhook notification failed:', error);
  }
}
