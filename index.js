async function updateEmbed(message) {
  try {
    // Fetch status for both servers
    const server1Status = await getServerStatus(SERVER_ID_1);
    const server2Status = await getServerStatus(SERVER_ID_2);

    const embed = new EmbedBuilder()
      .setTitle('🖥️ Server Status')
      .setColor(0x00ff00)
      .setTimestamp(new Date())
      .setFooter({ text: `Updates every ${UPDATE_INTERVAL}s` });

    // Helper function to convert seconds to human readable time
    const formatUptime = (seconds) => {
      if (!seconds || seconds === 'N/A') return 'N/A';
      
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;
      
      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);
      
      return parts.join(' ');
    };

    // Process each server's status
    [server1Status, server2Status].forEach((serverStatus, index) => {
      if (serverStatus.error) {
        // Handle error case
        embed.addFields({
          name: `Server ${index + 1}`,
          value: `❌ Error: ${serverStatus.message}`,
        });
      } else {
        // Status emoji
        const statusEmoji = serverStatus.status === 'Online' ? '🟢' : '🔴';
        
        // Create detailed status field with better formatting
        embed.addFields({
          name: `${statusEmoji} ${serverStatus.name} (${serverStatus.status})`,
          value: 
            `🖳 CPU: ${serverStatus.cpu.usage}\n` +
            `💾 Memory: ${serverStatus.memory.current} / ${serverStatus.memory.limit}\n` +
            `💽 Disk: ${serverStatus.disk.current} / ${serverStatus.disk.limit}\n` +
            `🌐 Network: ⬇️ ${serverStatus.network.incoming} | ⬆️ ${serverStatus.network.outgoing}\n` + 
            `⏱️ Uptime: ${formatUptime(parseInt(serverStatus.uptime))}`,
          inline: false
        });
      }
    });

    // Edit the existing message with new embed
    await message.edit({ embeds: [embed] });
  } catch (error) {
    console.error('Error updating embed:', error);
  }
}
