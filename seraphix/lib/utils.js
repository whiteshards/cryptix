
export function generateRandomPassword(length = 8) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

export async function addUserToGuild(accessToken, userId) {
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  try {
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: accessToken,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error adding user to guild:', error);
    return false;
  }
}

export async function getLocationFromIP(ip) {
  try {
    // Skip geolocation for localhost/private IPs
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return {
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
        ll: [0, 0]
      };
    }

    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,lat,lon`);
    const data = await response.json();
    
    if (data.status !== 'success') {
      console.error('IP-API query failed:', data.message);
      return {
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
        ll: [0, 0]
      };
    }
    
    return {
      country: data.country || 'Unknown',
      region: data.regionName || 'Unknown', 
      city: data.city || 'Unknown',
      ll: [data.lat || 0, data.lon || 0]
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
