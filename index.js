const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();

// Create the bot client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// Config
const DISCORD_CHANNEL_ID = 'YOUR_CHANNEL_ID';
const SERVER_ID_1 = 'bitcraft-bungee';
const SERVER_ID_2 = 'bitcraft-survival';
const UPDATE_INTERVAL = 10; // seconds

// Dummy fetch function (replace with real server status logic)
async function getServerStatus(id) {
  return {
    name: id === SERVER_ID_1 ? 'Bitcraft Bungee' : 'Bitcraft Survival',
    status: 'Online',
    cpu: { usage: `${(Math.random() * 150).toFixed(2)}%` },
    memory: { current: `${(Math.random() * 10000).toFixed(2)} MB`, limit: 'Unlimited' },
    disk: { current: `${(Math.random() * 8000).toFixed(2)} MB`, limit: 'Unlimited' },
    network: {
      incoming: `${(Math.random() * 50000).toFixed(2)} MB`,
      outgoing: `${(Math.random() * 60000).toFixed(2)} MB`
    },
    uptime: `${Math.floor(Math.random() * 5)}d ${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m ${Math.floor(Math.random() * 60)}s`
  };
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  try {
    const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
    if (!channel) return console.error('Could not find the specified channel');

    const countdownMessage = await channel.send('🕒 Refreshing in 10s');
    const serverMessage1 = await channel.send('Fetching Bitcraft Bungee status...');
    const serverMessage2 = await channel.send('Fetching Bitcraft Survival status...');

    const formatUptime = (str) => str;

    let countdown = parseInt(UPDATE_INTERVAL);

    setInterval(async () => {
      countdown = parseInt(UPDATE_INTERVAL);

      const countdownInterval = setInterval(async () => {
        if (countdown > 0) {
          await countdownMessage.edit(`🕒 Refreshing in ${countdown}s`);
          countdown--;
        } else {
          clearInterval(countdownInterval);

          const server1 = await getServerStatus(SERVER_ID_1);
          const server2 = await getServerStatus(SERVER_ID_2);

          const embed1 = new EmbedBuilder()
            .setTitle(`🖥️ ${server1.name} (${server1.status})`)
            .setColor(server1.status === 'Online' ? 0x00ff00 : 0xff0000)
            .addFields([
              { name: '🖳 CPU', value: server1.cpu.usage, inline: true },
              { name: '💾 Memory', value: `${server1.memory.current} / ${server1.memory.limit}`, inline: true },
              { name: '💽 Disk', value: `${server1.disk.current} / ${server1.disk.limit}`, inline: true },
              { name: '🌐 Network', value: `⬇️ ${server1.network.incoming} | ⬆️ ${server1.network.outgoing}`, inline: true },
              { name: '⏱️ Uptime', value: formatUptime(server1.uptime), inline: false }
            ])
            .setTimestamp();

          const embed2 = new EmbedBuilder()
            .setTitle(`🖥️ ${server2.name} (${server2.status})`)
            .setColor(server2.status === 'Online' ? 0x00ff00 : 0xff0000)
            .addFields([
              { name: '🖳 CPU', value: server2.cpu.usage, inline: true },
              { name: '💾 Memory', value: `${server2.memory.current} / ${server2.memory.limit}`, inline: true },
              { name: '💽 Disk', value: `${server2.disk.current} / ${server2.disk.limit}`, inline: true },
              { name: '🌐 Network', value: `⬇️ ${server2.network.incoming} | ⬆️ ${server2.network.outgoing}`, inline: true },
              { name: '⏱️ Uptime', value: formatUptime(server2.uptime), inline: false }
            ])
            .setTimestamp();

          await serverMessage1.edit({ embeds: [embed1] });
          await serverMessage2.edit({ embeds: [embed2] });
          await countdownMessage.edit(`🕒 Refreshing in ${UPDATE_INTERVAL}s`);
        }
      }, 1000);
    }, UPDATE_INTERVAL * 1000);

  } catch (error) {
    console.error('Error in ready event:', error);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
