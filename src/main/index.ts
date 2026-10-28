import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import * as net from 'net'

let mainWindowRef: BrowserWindow | null = null

function startFishSocketServer(port = 7777): void {
  const server = net.createServer((socket) => {
    socket.setEncoding('utf8')
    socket.on('data', (data) => {
      try {
        const raw = data.toString().trim()
        if (!raw) return
        let payload: any = null
        if (raw.startsWith('{')) {
          try {
            payload = JSON.parse(raw)
          } catch (e) {
            payload = null
          }
        }
        if (!payload) {
          const normalized = raw.replace(/,/g, ' ')
          const parts = normalized.split(/\s+/)
          if (parts.length === 0) return
          const cmd = parts[0].toLowerCase()
          if (cmd === 'spawn' || cmd === 'add' || cmd === 'fish' || cmd === 'create') {
            if (parts.length >= 3) {
              payload = { fishType: parts[1], scale: parts[2] }
            } else if (parts.length === 2) {
              payload = { fishType: parts[1], scale: 0 }
            }
          } else if (parts.length >= 2) {
            payload = { fishType: parts[0], scale: parts[1] }
          } else if (parts.length === 1) {
            payload = { fishType: parts[0], scale: 0 }
          }
        }
        if (payload && mainWindowRef && !mainWindowRef.isDestroyed()) {
          mainWindowRef.webContents.send('spawn-fish', payload)
        }
      } catch (e) {
        console.error('Error handling socket data:', e)
      }
    })
    socket.on('error', (err) => {
      console.error('Socket client error:', err)
    })
  })
  server.listen(port, '127.0.0.1', () => {
    console.log(`Fish spawn socket server listening on 127.0.0.1:${port}`)
  })
  server.on('error', (err) => {
    console.error('Fish spawn socket server error:', err)
  })
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  mainWindowRef = mainWindow

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  startFishSocketServer(7777)

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
