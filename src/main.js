const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

// Variables globales
let win;
let tray;
let appIsQuitting = false;

// Création de la fenêtre principale
function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    resizable: true,
    minimizable: true,
    maximizable: true,
    backgroundColor: '#00000000', // Fond transparent
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));

  // Gère la fermeture de la fenêtre
  win.on('close', (event) => {
    if (!appIsQuitting) {
      event.preventDefault();
      win.hide(); // Cache dans le tray au lieu de fermer
    }
  });
}

function getTrayIcon() {
  const svg = `
    <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="4" ry="4" fill="#5865f2" />
      <circle cx="8" cy="8" r="3" fill="#ffffff" />
    </svg>
  `;

  const icon = nativeImage.createFromDataURL(
    `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  );

  return icon.resize({ width: 16, height: 16 });
}

// Crée le tray avec un menu contextuel
function createTray() {
  const icon = getTrayIcon();

  tray = new Tray(icon);
  
  // Menu contextuel du tray
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Restore',
      click: () => {
        if (win) {
          win.show();
          win.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => {
        appIsQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Discord Replique');
  tray.setContextMenu(contextMenu);
  
  // Affiche la fenêtre au clic sur l'icône du tray
  tray.on('click', () => {
    if (win) {
      win.show();
      win.focus();
    }
  });
  
  // Affiche la fenêtre au double-clic sur l'icône du tray
  tray.on('double-click', () => {
    if (win) {
      win.show();
      win.focus();
    }
  });
}

app.once('ready', () => {
  createWindow();
  createTray();
});

app.on('before-quit', () => {
  appIsQuitting = true;
});

app.on('activate', () => {
  if (!BrowserWindow.getAllWindows().length) {
    createWindow();
  } else if (win) {
    win.show();
  }
});

// Minimise la fenêtre
ipcMain.on('window:minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;

  win.minimize();
});

// Maximise ou restaure la fenêtre
ipcMain.on('window:maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;

  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.setBounds(win.getNormalBounds());
    win.maximize();
  }
});

// Ferme la fenêtre
ipcMain.on('window:close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  win.close();
});

// Gère les demandes de menu contextuel du renderer
ipcMain.handle('show-context-menu', (event, params) => {
  const { type, id, name, user } = params || {};
  let template = [];

  // Menu pour les serveurs
  if (type === 'server') {
    template = [
      { label: `Open server ${name}`, click: () => event.sender.send('context-menu-action', { type, id, action: 'open' }) },
      { label: 'Manage server', click: () => event.sender.send('context-menu-action', { type, id, action: 'manage' }) },
      { label: 'Leave server', click: () => event.sender.send('context-menu-action', { type, id, action: 'leave' }) }
    ];
  } else if (type === 'channel') {
    template = [
      { label: `Open channel ${name}`, click: () => event.sender.send('context-menu-action', { type, id, action: 'open' }) },
      { label: 'Copy channel name', click: () => event.sender.send('context-menu-action', { type, id, action: 'copy' }) },
      { label: 'Delete channel', click: () => event.sender.send('context-menu-action', { type, id, action: 'delete' }) }
    ];
  } else if (type === 'message') {
    template = [
      { label: `Copy message from ${user}`, click: () => event.sender.send('context-menu-action', { type, action: 'copy', id }) },
      { label: 'Reply', click: () => event.sender.send('context-menu-action', { type, action: 'reply', id }) },
      { label: 'Delete message', click: () => event.sender.send('context-menu-action', { type, action: 'delete', id }) }
    ];
  } else {
    // Menu générique pour le tray ou autres éléments
    template = [
      { label: 'Restore', click: () => { if (win) { win.show(); win.focus(); } } },
      { label: 'Exit', click: () => { appIsQuitting = true; app.quit(); } }
    ];
  }

  // Affiche le menu contextuel à la position du clic
  const menu = Menu.buildFromTemplate(template);
  menu.popup({ window: BrowserWindow.fromWebContents(event.sender) });
});