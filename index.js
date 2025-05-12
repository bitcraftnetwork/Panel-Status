async function updateEmbed(message) {
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
          `${statusEmoji} ${serverStatus.name} (${serverStatus.status})\n` +
          `🖳 CPU: ${serverStatus.cpu.usage}\n\n` +
          `💾 Memory: ${serverStatus.memory.current} / ${serverStatus.memory.limit}\n\n` +
          `💽 Disk: ${serverStatus.disk.current} / ${serverStatus.disk.limit}\n\n` +
          `🌐 Network: ⬇️ ${serverStatus.network.incoming} | ⬆️ ${serverStatus.network.outgoing}\n\n` +
          `⏱️ Uptime: ${formatUptime(parseInt(serverStatus.uptime.replace(/\D/g, '')))}`
        )
        .setColor(serverStatus.status === 'Online' ? 0x00ff00 : 0xff0000)
        .setFooter({ text: `Updates every ${UPDATE_INTERVAL}s` })
        .setTimestamp(new Date());
    };

    const channel = message.channel;

    if (server1Status.error) {
      await message.edit({ content: `❌ Error: ${server1Status.message}` });
    } else {
      const embed1 = buildEmbed(server1Status);
      await message.edit({ embeds: [embed1] });
    }

    if (server2Status.error) {
      await channel.send(`❌ Error: ${server2Status.message}`);
    } else {
      const embed2 = buildEmbed(server2Status);
      await channel.send({ embeds: [embed2] });
    }

  } catch (error) {
    console.error('Error updating embed:', error);
  }
}
