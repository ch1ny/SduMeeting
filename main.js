const { app, BrowserWindow, Tray, Menu, screen, nativeImage, globalShortcut, safeStorage } = require('electron')
const path = require('path')
const url = require('url')
const Store = require('electron-store')
const store = new Store()

let loginWindow, mainWindow
let tray
let screenWidth, screenHeight
const ipc = require('electron').ipcMain
const DIRNAME = process.env.NODE_ENV === 'development' ? path.join(__dirname, 'public') : __dirname

function createLoginWindow() {
    loginWindow = new BrowserWindow({
        width: parseInt(screenWidth * 0.35),
        height: parseInt(screenHeight * 0.45),
        frame: false,
        transparent: true,
        show: false,
        // alwaysOnTop: true,
        resizable: false,
        fullscreenable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    })

    const contextMenu = Menu.buildFromTemplate([
        // {
        //     label: 'Login',
        //     click: () => {
        //         loginWindow.setSize(1000, 1000)
        //     }
        // },
        {
            label: '打开主面板',
            click: () => {
                loginWindow.show()
                // loginWindow.setSkipTaskbar(false)
                // loginWindow.restore()
            }
        },
        {
            label: '退出',
            click: () => {
                app.quit()
            },
            icon: nativeImage.createFromPath(path.join(DIRNAME, 'electronAssets/img/trayIcon/quit.png')).resize({
                width: 16,
                height: 16,
                quality: 'best'
            })
        }
    ])
    // loginWindow.webContents.openDevTools()

    tray = new Tray(path.join(DIRNAME, 'electronAssets/favicon.ico'))

    if (process.env.NODE_ENV === 'development') {
        loginWindow.loadURL('http://localhost:3000/login')
        // loginWindow.webContents.openDevTools()
    } else {
        loginWindow.loadURL(url.format({
            pathname: path.join(DIRNAME, 'login/index.html'),
            protocol: 'file:',
            slashes: true
        }))
    }

    tray.setToolTip(`假装这是一个QQ\n(¯﹃¯)`)
    tray.setContextMenu(contextMenu)
    tray.on('click', () => {
        if (loginWindow !== null) {
            loginWindow.show()
        } else {
            mainWindow.restore()
        }
    })

    ipc.on('login', (event, userId) => {
        createMainWindow()
        loginWindow.close();
    })

    ipc.on('safePsw', (event, shouldSaveStatus, userPsw) => {
        switch (shouldSaveStatus) {
            case 1: // 保存新密码
                store.set('userSafePsw', safeStorage.encryptString(userPsw))
                break;
            case -1: // 不保存密码
                store.clear('userSafePsw')
                break
            default: // 不需要变动密码
                break
        }
    })

    loginWindow.on('closed', () => {
        loginWindow = null
    })

    loginWindow.on('ready-to-show', () => {
        let hasUserPsw = false, userPsw
        if (store.get('userSafePsw')) {
            userPsw = safeStorage.decryptString(Buffer.from(store.get('userSafePsw').data))
            // console.log(userPsw);
            hasUserPsw = true
        }
        loginWindow.show()
        loginWindow.webContents.send('userSafePsw', hasUserPsw, userPsw)
    })
}

function createMainWindow() {
    const windowSize = store.get('mainWindowSize')

    mainWindow = new BrowserWindow({
        width: windowSize ? windowSize[0] : parseInt(screenWidth * 0.6),
        height: windowSize ? windowSize[1] : parseInt(screenHeight * 0.8),
        minWidth: 200,
        frame: false,
        transparent: true,
        show: false,
        fullscreenable: false,
        // alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(DIRNAME, 'preload/mainWindowPreload.js')
        }
    })

    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:3000/main')
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.loadURL(url.format({
            pathname: path.join(DIRNAME, 'main/index.html'),
            protocol: 'file:',
            slashes: true
        }))
    }

    const contextMenu = Menu.buildFromTemplate([
        {
            label: '最小化',
            click: () => {
                if (loginWindow !== null) {
                    loginWindow.hide()
                    // loginWindow.setSkipTaskbar(true)
                    // loginWindow.minimize()
                } else {
                    mainWindow.minimize()
                }
            }
        },
        {
            type: 'separator'
        },
        {
            label: '退出',
            click: () => {
                app.quit()
            },
            icon: nativeImage.createFromPath(path.join(DIRNAME, 'electronAssets/img/trayIcon/quit.png')).resize({
                width: 16,
                height: 16,
                quality: 'best'
            })
        }
    ])

    tray.setContextMenu(contextMenu)

    let isMaximized = store.get('isMaximized')

    mainWindow.on('resize', () => {
        const isMax = mainWindow.isMaximized()
        if (isMaximized !== isMax) {
            store.set('isMaximized', isMax)
            mainWindow.webContents.send('exchangeMax')
            isMaximized = isMax
        } else if (!isMax) {
            store.set('mainWindowSize', mainWindow.getSize())
        }
    })

    mainWindow.on('closed', () => {
        mainWindow = null
    })

    mainWindow.on('ready-to-show', () => {
        if (isMaximized) {
            mainWindow.maximize()
            mainWindow.webContents.send('exchangeMax')
        }
        mainWindow.show()
        // winPushStream()
    })

    ipc.on('maximize', () => {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize()
        } else {
            mainWindow.maximize()
        }
    })
}

app.on('ready', () => {
    screenWidth = screen.getPrimaryDisplay().workAreaSize.width;
    screenHeight = screen.getPrimaryDisplay().workAreaSize.height

    if (process.env.NODE_ENV !== 'development')
        globalShortcut.register("CommandOrControl+Shift+I", () => {
            // console.log("你想打开开发者工具？");
        })

    createLoginWindow()
    ipc.on('quit', () => {
        if (process.platform !== 'darwin') {
            app.quit()
        } else {
            loginWindow = null
            mainWindow = null
        }
    })
    ipc.on('minimize', () => {
        if (loginWindow !== null) {
            loginWindow.hide()
            // loginWindow.setSkipTaskbar(true)
            // loginWindow.minimize()
        } else {
            mainWindow.minimize()
        }
    })
})

app.on('window-all-closed', () => {
    // Mac平台下，关闭应用窗口后，应用会默认进入后台，需要用户手动终止程序
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (loginWindow === null) {
        createLoginWindow()
    }
})

app.on('will-quit', () => {
    if (process.env.NODE_ENV !== 'development')
        globalShortcut.unregisterAll()
})