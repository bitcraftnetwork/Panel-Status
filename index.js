// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const express = require('express');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const {
  DISCORD_TOKEN,
  DISCORD_CHANNEL_ID,
  PTERO_API_KEY,
  PTERO_PANEL_URL,
  SERVER_ID_1,
  SERVER_ID_2,
  UPDATE_INTERVAL
} = process.env;

const headers = {
  Authorization: `Bearer ${PTERO_API_KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

async function getServerStats(serverId) {
  try {
    const response = await axios.get(
      `${PTERO_PANEL_URL}/api/application/servers/${serverId}/resources`,
      { headers }
    );
    const data = response.data.attributes;
    return {
      name: data.name,
      cpu: data.resources.cpu_absolute,
      memory: `${(data.resources.memory_bytes / 1024 / 1024).toFixed(2)} MB`,
      disk: `${(data.resources.disk_bytes / 1024 / 1024).toFixed(2)} MB`,
      uptime: `${Math.floor(data.resources.uptime / 1000)}s`,
      state: data.current_state,
    };
  } catch (err) {
    return { name: `Server ${serverId}`, error: true, message: err.message };
  }
}

async function updateEmbed(message) {
  const stats1 = await getServerStats(SERVER_ID_1);
  const stats2 = await getServerStats(SERVER_ID_2);

  const embed = new EmbedBuilder()
    .setTitle('🖥️ Server Status')
    .setColor(0x00ff00)
    .setTimestamp(new Date())
    .setFooter({ text: `Updates every ${UPDATE_INTERVAL}s` });

  [stats1, stats2].forEach((stat, i) => {
    if (stat.error) {
      embed.addFields({
        name: `Server ${i + 1}`,
        value: `❌ Error: ${stat.message}`,
      });
    } else {
      embed.addFields({
        name: `${stat.name} (${stat.state.toUpperCase()})`,
        value:
          `CPU: ${stat.cpu}%\n` +
          `Memory: ${stat.memory}\n` +
          `Disk: ${stat.disk}\n` +
          `Uptime: ${stat.uptime}`,
        inline: false,
      });
    }
  });

  await message.edit({ embeds: [embed] });
}

client.once('ready', async () => {
  const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
  const sent = await channel.send({ content: 'Starting server monitor...' });
  setInterval(() => updateEmbed(sent), UPDATE_INTERVAL * 1000);
});

client.login(DISCORD_TOKEN);

// Web server for Render
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (_req, res) => {
  res.send('Pterodactyl Discord Bot is running.');
});

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});
