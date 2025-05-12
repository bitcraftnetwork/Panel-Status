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

    [server1Status, server2Status].forEach((serverStatus, index) => {
      if (serverStatus.error) {
        embed.addFields({
          name: `Server ${index + 1}`,
          value: `❌ Error: ${serverStatus.message}`,
        });
      } else {
        const statusEmoji = serverStatus.status === 'Online' ? '🟢' : '🔴';

        embed.addFields({
          name: `${statusEmoji} ${serverStatus.name} (${serverStatus.status})`,
          value:
            `🖳 CPU:\n${serverStatus.cpu.usage}\n` +
            `💾 Memory:\n${serverStatus.memory.current} / ${serverStatus.memory.limit}\n` +
            `💽 Disk:\n${serverStatus.disk.current} / ${serverStatus.disk.limit}\n` +
            `🌐 Network:\n⬇️ ${serverStatus.network.incoming} | ⬆️ ${serverStatus.network.outgoing}\n` +
            `⏱️ Uptime:\n${formatUptime(parseInt(serverStatus.uptime.replace(/\D/g, '')))}\n` +
            (index === 0 ? '\u200B' : ''), // adds a line break after first server
          inline: false
        });
      }
    });

    await message.edit({ embeds: [embed] });
  } catch (error) {
    console.error('Error updating embed:', error);
  }
}
