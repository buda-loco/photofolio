// Electron main process. Deliberately minimal: the renderer is a plain web
// app with no Node access (sandboxed, no preload, no IPC) — SVG/PNG export
// uses the same anchor-download path as the web tool, which Electron routes
// through the OS save dialog automatically via the session's default
// will-download behaviour.
const { app, BrowserWindow, shell } = require('electron')
const path = require('node:path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1520,
    height: 940,
    minWidth: 900,
    minHeight: 600,
    // Matches the workspace's paper colour so the window never flashes
    // white while the renderer boots.
    backgroundColor: '#000000',
    title: 'PlaceWorks — Brand Asset Tool',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  // Dev: `npm run dev` sets VITE_DEV_SERVER_URL and Electron attaches to the
  // live Vite server (HMR included). Packaged/`npm start`: load the built
  // bundle from disk.
  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) {
    win.loadURL(devUrl)
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Any target="_blank"/window.open escapes to the system browser instead of
  // spawning unmanaged Electron windows.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
