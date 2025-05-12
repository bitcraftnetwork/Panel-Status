const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const SERVER_ID_1 = process.env.SERVER_ID_1;
const SERVER_ID_2 = process.env.SERVER_ID_2;
const UPDATE_INTERVAL = parseInt(process.env.UPDATE_INTERVAL || '10');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

async function getServerStatus(id) {
  return {
    name: id === SERVER_ID_1 ? 'Bitcraft Bungee' : 'Bitcraft Survival',
    status: 'Online',
    cpu: { usage: `${(Math.random() * 100).toFixed(2)}%` },
    memory: { current: `${(Math.random() * 8000).toFixed(2)} MB`, limit: '16 GB' },
    disk: { current: `${(Math.random() * 50000).toFixed(2)} MB`, limit: '100 GB' },
    network: {
      incoming: `${(Math.random() * 10000).toFixed(2)} MB`,
      outgoing: `${(Math.random() * 10000).toFixed(2)} MB`,
    },
    uptime: `${Math.floor(Math.random() * 86400)}`
  };
}

const formatUptime = (seconds) => {
  if (!seconds || isNaN(seconds)) return 'N/A';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${d ? `${d} day${d > 1 ? 's' : ''}, ` : ''}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
    if (!channel) return console.error('❌ Channel not found');

    const countdownMessage = await channel.send('🕒 Refreshing in...');
    const serverMessage1 = await channel.send('Fetching Bitcraft Bungee status...');
    const serverMessage2 = await channel.send('Fetching Bitcraft Survival status...');

    let countdown = UPDATE_INTERVAL;

    setInterval(async () => {
      // Update countdown
      if (countdown > 0) {
        await countdownMessage.edit(`🕒 Refreshing in ${countdown}s`);
        countdown--;
        return;
      }

      countdown = UPDATE_INTERVAL;

      // Fetch server data
      const server1 = await getServerStatus(SERVER_ID_1);
      const server2 = await getServerStatus(SERVER_ID_2);

      const embed1 = new EmbedBuilder()
        .setTitle(`🖥️ ${server1.name} (${server1.status})`)
        .setColor(server1.status === 'Online' ? 0x00ff00 : 0xff0000)
        .addFields([
          { name: '🖳 CPU', value: server1.cpu.usage, inline: false },
          { name: '💾 Memory', value: `${server1.memory.current} / ${server1.memory.limit}`, inline: false },
          { name: '💽 Disk', value: `${server1.disk.current} / ${server1.disk.limit}`, inline: false },
          { name: '🌐 Network', value: `⬇️ ${server1.network.incoming} | ⬆️ ${server1.network.outgoing}`, inline: false },
          { name: '⏱️ Uptime', value: formatUptime(parseInt(server1.uptime)), inline: false }
        ])
        .setTimestamp();

      const embed2 = new EmbedBuilder()
        .setTitle(`🖥️ ${server2.name} (${server2.status})`)
        .setColor(server2.status === 'Online' ? 0x00ff00 : 0xff0000)
        .addFields([
          { name: '🖳 CPU', value: server2.cpu.usage, inline: false },
          { name: '💾 Memory', value: `${server2.memory.current} / ${server2.memory.limit}`, inline: false },
          { name: '💽 Disk', value: `${server2.disk.current} / ${server2.disk.limit}`, inline: false },
          { name: '🌐 Network', value: `⬇️ ${server2.network.incoming} | ⬆️ ${server2.network.outgoing}`, inline: false },
          { name: '⏱️ Uptime', value: formatUptime(parseInt(server2.uptime)), inline: false }
        ])
        .setTimestamp();

      await serverMessage1.edit({ embeds: [embed1] });
      await serverMessage2.edit({ embeds: [embed2] });

    }, 1000);

  } catch (err) {
    console.error('❌ Error during setup:', err);
  }
});

client.login(DISCORD_TOKEN);
