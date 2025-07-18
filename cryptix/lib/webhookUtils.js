
import { WebhookClient, EmbedBuilder } from 'discord.js';

export async function sendWebhookNotification(webhookUrl, type, data) {
  if (!webhookUrl) return;

  try {
    // Extract webhook ID and token from URL
    const webhookUrlMatch = webhookUrl.match(/https:\/\/discord\.com\/api\/webhooks\/(\d+)\/([^\/]+)/);
    if (!webhookUrlMatch) {
      console.error('Invalid Discord webhook URL format');
      return;
    }

    const [, webhookId, webhookToken] = webhookUrlMatch;
    const webhook = new WebhookClient({ id: webhookId, token: webhookToken });

    let embed;

    switch (type) {
      case 'checkpoint_completed':
        embed = new EmbedBuilder()
          .setTitle('✅ Checkpoint Completed')
          .setColor(0x00ff00)
          .setThumbnail('https://cryptixmanager.vercel.app/images/thumbnail.gif')
          .addFields(
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
          )
          .setTimestamp()
          .setFooter({
            text: 'Cryptix Manager',
            iconURL: 'https://cryptixmanager.vercel.app/images/unrounded-logo.png'
          });
        break;

      case 'anti_bypass_triggered':
        embed = new EmbedBuilder()
          .setTitle('🚨 Anti-Bypass Triggered')
          .setColor(0xff0000)
          .setThumbnail('https://cryptixmanager.vercel.app/images/thumbnail.gif')
          .addFields(
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
          )
          .setTimestamp()
          .setFooter({
            text: 'Cryptix Manager',
            iconURL: 'https://cryptixmanager.vercel.app/images/unrounded-logo.png'
          });
        break;

      case 'key_generated':
        embed = new EmbedBuilder()
          .setTitle('🔑 Key Generated')
          .setColor(0x0099ff)
          .setThumbnail('https://cryptixmanager.vercel.app/images/thumbnail.gif')
          .addFields(
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
          )
          .setTimestamp()
          .setFooter({
            text: 'Cryptix Manager',
            iconURL: 'https://cryptixmanager.vercel.app/images/unrounded-logo.png'
          });
        break;

      default:
        return;
    }

    await webhook.send({
      username: 'Cryptix Notifications',
      avatarURL: 'https://cryptixmanager.vercel.app/images/unrounded-logo.png',
      embeds: [embed]
    });

  } catch (error) {
    console.error('Webhook notification failed:', error);
  }
}
