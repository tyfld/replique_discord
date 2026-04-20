window.windowControls.onMaximizeChange((isMaximized) => {
  document.body.classList.toggle('maximized', isMaximized);
});

// Données simulées pour les serveurs, canaux et messages
const servers = [
  {
    id: "s1",
    name: "Gaming",
    channels: [
      { id: "c1", name: "general" },
      { id: "c2", name: "clips" }
    ]
  },
  {
    id: "s2",
    name: "Work",
    channels: [
      { id: "c3", name: "announcements" },
      { id: "c4", name: "dev-chat" }
    ]
  }
];

// État actuel de l'application
let activeServerId = "s1";
let activeChannelId = "c1";

// Messages simulés pour chaque canal
const messages = {
  "c1": [
    { user: "User1", text: "Hello everyone!" },
    { user: "User2", text: "Hey there!" }
  ],
  "c2": [
    { user: "User3", text: "Check out this clip!" }
  ],
  "c3": [
    { user: "User4", text: "New announcement!" }
  ],
  "c4": [
    { user: "User5", text: "Dev chat here." }
  ]
};

// Fonction pour sélectionner un serveur
function selectServer(serverId) {
  activeServerId = serverId;
  const server = servers.find(s => s.id === serverId);
  activeChannelId = server.channels[0].id;
  render();
}

// Fonction pour sélectionner un canal
function selectChannel(channelId) {
  activeChannelId = channelId;
  render(); // Update UI
}

// Fonction de rendu pour mettre à jour l'interface utilisateur
function render() {
  // Trouve le serveur et le canal actifs
  const activeServer = servers.find(s => s.id === activeServerId);
  const channels = activeServer.channels;
  const activeChannel = channels.find(c => c.id === activeChannelId);

  const serversEl = document.querySelector('.servers');
  serversEl.innerHTML = ''; 
  servers.forEach(server => {
    const serverEl = document.createElement('div');
    serverEl.className = server.id === activeServerId ? 'server active' : 'server';
    serverEl.textContent = server.name;
    serverEl.onclick = () => selectServer(server.id);
    
    serverEl.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      window.electronAPI.showContextMenu({ type: 'server', id: server.id, name: server.name });
    });
    
    serversEl.appendChild(serverEl);
  });

  const channelsEl = document.querySelector('.channel-list');
  channelsEl.innerHTML = '';
  channels.forEach(channel => {
    const channelEl = document.createElement('div');
    channelEl.className = channel.id === activeChannelId ? 'channel active' : 'channel';
    channelEl.textContent = `#${channel.name}`;
    channelEl.onclick = () => selectChannel(channel.id);
    
    channelEl.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      window.electronAPI.showContextMenu({ type: 'channel', id: channel.id, name: channel.name });
    });
    
    channelsEl.appendChild(channelEl);
  });

  const chatHeaderEl = document.querySelector('.chat-header');
  chatHeaderEl.textContent = `#${activeChannel.name}`;

  const messagesEl = document.querySelector('.messages');
  messagesEl.innerHTML = ''; 
  const channelMessages = messages[activeChannelId] || [];
  
  channelMessages.forEach((msg, index) => {
    const msgEl = document.createElement('div');
    msgEl.className = 'message';
    msgEl.innerHTML = `<strong>${msg.user}:</strong> ${msg.text}`;
    
    msgEl.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      window.electronAPI.showContextMenu({ type: 'message', id: index, user: msg.user, text: msg.text });
    });
    
    messagesEl.appendChild(msgEl);
  });
}

// Gère les actions des menus contextuels envoyées par le main process
window.electronAPI.onContextMenuAction((data) => {
  if (!data) return;

  if (data.type === 'channel' && data.action === 'copy') {
    navigator.clipboard.writeText(data.id);
    return;
  }

  if (data.type === 'message' && data.action === 'copy') {
    const channelMessages = messages[activeChannelId] || [];
    const message = channelMessages[data.id];
    if (message) navigator.clipboard.writeText(message.text);
    return;
  }

  if (data.type === 'message' && data.action === 'reply') {
    const input = document.getElementById('messageInput');
    input.value = `@${messages[activeChannelId][data.id].user} `;
    input.focus();
    return;
  }

  if (data.action === 'delete') {
    alert(`${data.type} action '${data.action}' is not implemented yet.`);
  }
});

// Gère l'envoi de messages
document.getElementById('sendButton').onclick = () => {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  
  if (text) {
    if (!messages[activeChannelId]) messages[activeChannelId] = [];
    
    messages[activeChannelId].push({ user: 'You', text });
    
    input.value = '';
    render();
  }
};

// Render initial de l'interface utilisateur
render();