async function updateEmbed(message) {
  try {
    const server1Status = await getServerStatus(SERVER_ID_1);
    const server2Status = await getServerStatus(SERVER_ID_2);

    const embed = new EmbedBuilder()
      .setTitle('🖥️ Server Status')
      .setColor(0x00ff00)
      .setTimestamp(new Date())
      .setFooter({ text: `Updates every ${UPDATE_INTERVAL}s` });

    const formatUptime = (seconds) => {
      if (!seconds || seconds === 'N/A' || isNaN(seconds)) return 'N/A';

      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;

      let formattedUptime = '';
      if (days > 0) {
        formattedUptime += `${days} day${days !== 1 ? 's' : ''}, `;
      }

      formattedUptime += `${hours.toString().padStart(2, '0')}:` +
                         `${minutes.toString().padStart(2, '0')}:` +
                         `${remainingSeconds.toString().padStart(2, '0')}`;

      return formattedUptime;
    };

    // Handle server 1
    embed.addFields({
      name: `🔹 ${server1Status.name} (${server1Status.status === 'Online' ? '🟢 Online' : '🔴 Offline'})`,
      value: server1Status.error
        ? `❌ Error: ${server1Status.message}`
        : `🖳 CPU:\n${server1Status.cpu.usage}\n` +
          `💾 Memory:\n${server1Status.memory.current} / ${server1Status.memory.limit}\n` +
          `💽 Disk:\n${server1Status.disk.current} / ${server1Status.disk.limit}\n` +
          `🌐 Network:\n⬇️ ${server1Status.network.incoming} | ⬆️ ${server1Status.network.outgoing}\n` +
          `⏱️ Uptime:\n${formatUptime(parseInt(server1Status.uptime.replace(/\D/g, '')))}\n\u200B`,
      inline: false,
    });

    // Handle server 2
    embed.addFields({
      name: `🔹 ${server2Status.name} (${server2Status.status === 'Online' ? '🟢 Online' : '🔴 Offline'})`,
      value: server2Status.error
        ? `❌ Error: ${server2Status.message}`
        : `🖳 CPU:\n${server2Status.cpu.usage}\n` +
          `💾 Memory:\n${server2Status.memory.current} / ${server2Status.memory.limit}\n` +
          `💽 Disk:\n${server2Status.disk.current} / ${server2Status.disk.limit}\n` +
          `🌐 Network:\n⬇️ ${server2Status.network.incoming} | ⬆️ ${server2Status.network.outgoing}\n` +
          `⏱️ Uptime:\n${formatUptime(parseInt(server2Status.uptime.replace(/\D/g, '')))}\n`,
      inline: false,
    });

    await message.edit({ embeds: [embed] });
  } catch (error) {
    console.error('Error updating embed:', error);
  }
}
