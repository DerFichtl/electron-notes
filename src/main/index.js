'use strict'

import { app, BrowserWindow, ipcMain, Menu} from 'electron'

const isMac = process.platform === 'darwin'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
    global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080`
    : `file://${__dirname}/index.html`

function createWindow () {

    mainWindow = new BrowserWindow({
        show: false,
        useContentSize: true,
        webPreferences: {
            nodeIntegration: true
        }
    })

    let webContents = mainWindow.webContents

    let handleRedirect = (e, url) => {
        if (url !== webContents.getURL()) {
            e.preventDefault()
            require('electron').shell.openExternal(url)
        }
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.maximize()
        mainWindow.show()

        // if (process.env.env === 'development') {
            mainWindow.openDevTools()
        // }

        webContents.on('will-navigate', handleRedirect)
        webContents.on('new-window', handleRedirect)
    })

    mainWindow.loadURL(winURL)

    mainWindow.on('closed', () => {
        mainWindow = null
    })


    const template = [
        {
            label: app.name,
            submenu: [
                { role: 'about' },
                { role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'pasteAndMatchStyle' },
                { role: 'delete' },
                { role: 'selectAll' },
            ]
        }
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)

}



app.on('ready', createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow()
    }
})

ipcMain.on('close-app', (evt, arg) => {
    app.quit()
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall()
})

app.on('ready', () => {
    if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
*/
