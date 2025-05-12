// Configuration for Pterodactyl Client API
const PTERO_CLIENT_API_HEADERS = {
  'Authorization': `Bearer ${PTERO_API_KEY}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

async function getServerStatus(serverId) {
  try {
    // Fetch server status and resources
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

    return {
      name: serverDetails.name,
      identifier: serverDetails.identifier,
      // Server state
      status: serverDetails.status ? 'Online' : 'Offline',
      
      // Resource details
      cpu: {
        usage: resources.resources.cpu_absolute !== null 
          ? `${resources.resources.cpu_absolute.toFixed(2)}%` 
          : 'N/A',
      },
      memory: {
        current: `${(resources.resources.memory_bytes / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(resources.resources.memory_limit_bytes / 1024 / 1024).toFixed(2)} MB`,
      },
      disk: {
        current: `${(resources.resources.disk_bytes / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(resources.resources.disk_limit_bytes / 1024 / 1024).toFixed(2)} MB`,
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

    // Process each server's status
    [server1Status, server2Status].forEach((serverStatus, index) => {
      if (serverStatus.error) {
        // Handle error case
        embed.addFields({
          name: `Server ${index + 1}`,
          value: `❌ Error: ${serverStatus.message}`,
        });
      } else {
        // Create detailed status field
        embed.addFields({
          name: `${serverStatus.name} - ${serverStatus.status}`,
          value: 
            `🖳 CPU Usage: ${serverStatus.cpu.usage}\n` +
            `💾 Memory: ${serverStatus.memory.current} / ${serverStatus.memory.limit}\n` +
            `💽 Disk: ${serverStatus.disk.current} / ${serverStatus.disk.limit}\n` +
            `🌐 Network (RX/TX): ${serverStatus.network.incoming} / ${serverStatus.network.outgoing}\n` +
            `⏱️ Uptime: ${serverStatus.uptime}`,
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
