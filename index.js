// index.js
require('dotenv').config({ path: '.env' });

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const http = require('http');

const requiredEnvVars = [
  'DISCORD_TOKEN',
  'DISCORD_CHANNEL_ID',
  'PTERO_API_KEY',
  'PTERO_PANEL_URL',
  'SERVER_ID_1',
  'SERVER_ID_2',
  'UPDATE_INTERVAL'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

const {
  DISCORD_TOKEN,
  DISCORD_CHANNEL_ID,
  PTERO_API_KEY,
  PTERO_PANEL_URL,
  SERVER_ID_1,
  SERVER_ID_2,
  UPDATE_INTERVAL = '60'
} = process.env;

const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Discord Bot is running!');
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const PTERO_CLIENT_API_HEADERS = {
  'Authorization': `Bearer ${PTERO_API_KEY}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

async function getServerStatus(serverId) {
  try {
    const serverResponse = await axios.get(
      `${PTERO_PANEL_URL}/api/client/servers/${serverId}`,
      { headers: PTERO_CLIENT_API_HEADERS }
    );

    const resourcesResponse = await axios.get(
      `${PTERO_PANEL_URL}/api/client/servers/${serverId}/resources`,
      { headers: PTERO_CLIENT_API_HEADERS }
    );

    const serverDetails = serverResponse.data.attributes;
    const resources = resourcesResponse.data.attributes;

    const isOnline = resources.resources.cpu_absolute !== null ||
      resources.current_state === "running";

    return {
      name: serverDetails.name,
      identifier: serverDetails.identifier,
      status: isOnline ? 'Online' : 'Offline',
      cpu: {
        usage: resources.resources.cpu_absolute !== null
          ? `${resources.resources.cpu_absolute.toFixed(2)}%`
          : 'N/A',
      },
      memory: {
        current: `${(resources.resources.memory_bytes / 1024 / 1024).toFixed(2)} MB`,
        limit: resources.resources.memory_limit_bytes
          ? `${(resources.resources.memory_limit_bytes / 1024 / 1024).toFixed(2)} MB` : 'Unlimited',
      },
      disk: {
        current: `${(resources.resources.disk_bytes / 1024 / 1024).toFixed(2)} MB`,
        limit: resources.resources.disk_limit_bytes
          ? `${(resources.resources.disk_limit_bytes / 1024 / 1024).toFixed(2)} MB` : 'Unlimited',
      },
      network: {
        incoming: `${(resources.resources.network_rx_bytes / 1024 / 1024).toFixed(2)} MB`,
        outgoing: `${(resources.resources.network_tx_bytes / 1024 / 1024).toFixed(2)} MB`,
      },
      uptime: resources.resources.uptime
        ? `${Math.floor(resources.resources.uptime / 1000)} seconds`
        : 'N/A',
    };
  } catch (error) {
    console.error('Error fetching server status:', error.response?.data || error.message);
    return {
      error: true,
      message: error.response?.data?.errors?.[0]?.detail || error.message,
    };
  }
}

async function updateEmbed(message1, message2) {
  try {
    const server1Status = await getServerStatus(SERVER_ID_1);
    const server2Status = await getServerStatus(SERVER_ID_2);

    const formatUptime = (seconds) => {
      if (!seconds || seconds === 'N/A' || isNaN(seconds)) return 'N/A';
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;

      let formattedUptime = '';
      if (days > 0) formattedUptime += `${days} day${days !== 1 ? 's' : ''}, `;
      const formattedHours = hours.toString().padStart(2, '0');
      const formattedMinutes = minutes.toString().padStart(2, '0');
      const formattedSeconds = remainingSeconds.toString().padStart(2, '0');
      formattedUptime += `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
      return formattedUptime;
    };

    const buildEmbed = (serverStatus) => {
      const statusEmoji = serverStatus.status === 'Online' ? '🟢' : '🔴';
      return new EmbedBuilder()
        .setDescription(
          `🖳 CPU: ${serverStatus.cpu.usage}\n\n` +
          `💾 Memory: ${serverStatus.memory.current} / ${serverStatus.memory.limit}\n\n` +
          `💽 Disk: ${serverStatus.disk.current} / ${serverStatus.disk.limit}\n\n` +
          `🌐 Network: ⬇️ ${serverStatus.network.incoming} | ⬆️ ${serverStatus.network.outgoing}\n\n` +
          `⏱️ Uptime: ${formatUptime(parseInt(serverStatus.uptime.replace(/\D/g, '')))}`
        )
        .setColor(serverStatus.status === 'Online' ? 0x00ff00 : 0xff0000)
        .setFooter({ text: `Updates in <:countdown:>` })
        .setTimestamp(new Date());
    };

    const channel = message1.channel;

    if (!server1Status.error) {
      const embed1 = buildEmbed(server1Status);
      const statusEmoji1 = server1Status.status === 'Online' ? '🟢' : '🔴';
      await message1.edit({
        content: `${statusEmoji1} ${server1Status.name} (${server1Status.status})`,
        embeds: [embed1]
      });
    }

    if (!server2Status.error) {
      const embed2 = buildEmbed(server2Status);
      const statusEmoji2 = server2Status.status === 'Online' ? '🟢' : '🔴';
      await message2.edit({
        content: `${statusEmoji2} ${server2Status.name} (${server2Status.status})`,
        embeds: [embed2]
      });
    }

  } catch (error) {
    console.error('Error updating embed:', error);
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  try {
    const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
    if (!channel) {
      console.error('Could not find the specified channel');
      return;
    }

    const server1Status = await getServerStatus(SERVER_ID_1);
    const server2Status = await getServerStatus(SERVER_ID_2);

    const statusEmoji1 = server1Status.status === 'Online' ? '🟢' : '🔴';
    const statusEmoji2 = server2Status.status === 'Online' ? '🟢' : '🔴';

    const msg1 = await channel.send({
      content: `${statusEmoji1} ${server1Status.name} (${server1Status.status})`
    });

    const msg2 = await channel.send({
      content: `${statusEmoji2} ${server2Status.name} (${server2Status.status})`
    });

    // Update every X seconds
    setInterval(() => updateEmbed(msg1, msg2), parseInt(UPDATE_INTERVAL) * 1000);

  } catch (error) {
    console.error('Error in ready event:', error);
  }
});

client.on('error', (error) => {
  console.error('Discord client error:', error);
});

client.login(DISCORD_TOKEN).catch(error => {
  console.error('Login error:', error);
});
