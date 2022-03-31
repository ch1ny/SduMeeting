const {
	app,
	BrowserWindow,
	Tray,
	Menu,
	screen,
	nativeImage,
	globalShortcut,
	safeStorage,
} = require('electron');
const path = require('path');
const url = require('url');
const Store = require('electron-store');
const store = new Store();

let loginWindow, mainWindow, meetingWindow;
let tray;
let screenWidth, screenHeight;
const ipc = require('electron').ipcMain;
const DIRNAME = process.env.NODE_ENV === 'development' ? path.join(__dirname, 'public') : __dirname;
const EXEPATH = path.dirname(app.getPath('exe'));

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
		},
	});

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
				loginWindow.show();
				// loginWindow.setSkipTaskbar(false)
				// loginWindow.restore()
			},
		},
		{
			label: '退出',
			click: () => {
				app.quit();
			},
			icon: nativeImage
				.createFromPath(path.join(DIRNAME, 'electronAssets/img/trayIcon/quit.png'))
				.resize({
					width: 16,
					height: 16,
					quality: 'best',
				}),
		},
	]);
	// loginWindow.webContents.openDevTools()

	tray = new Tray(path.join(DIRNAME, 'electronAssets/favicon.ico'));

	if (process.env.NODE_ENV === 'development') {
		loginWindow.loadURL('http://localhost:3000/login');
		// loginWindow.webContents.openDevTools()
	} else {
		loginWindow.loadURL(
			url.format({
				pathname: path.join(DIRNAME, 'login/index.html'),
				protocol: 'file:',
				slashes: true,
			})
		);
	}

	tray.setToolTip(`假装这是一个QQ\n(¯﹃¯)`);
	tray.setContextMenu(contextMenu);
	tray.on('click', () => {
		if (loginWindow !== null) {
			loginWindow.show();
		} else {
			mainWindow.restore();
		}
	});

	ipc.once('USER_LOGIN', (event, userId) => {
		ipc.removeAllListeners('MINIMIZE_LOGIN_WINDOW');
		createMainWindow();
		loginWindow.close();
	});

	ipc.once('SAFE_PASSWORD', (event, shouldSaveStatus, userPsw) => {
		switch (shouldSaveStatus) {
			case 1: // 保存新密码
				store.set('userSafePsw', safeStorage.encryptString(userPsw));
				break;
			case -1: // 不保存密码
				store.clear('userSafePsw');
				break;
			default:
				// 不需要变动密码
				break;
		}
	});

	ipc.on('MINIMIZE_LOGIN_WINDOW', () => {
		loginWindow.hide();
	});

	loginWindow.on('closed', () => {
		loginWindow = null;
	});

	loginWindow.on('ready-to-show', () => {
		let hasUserPsw = false,
			userPsw;
		if (store.get('userSafePsw')) {
			userPsw = safeStorage.decryptString(Buffer.from(store.get('userSafePsw').data));
			// console.log(userPsw);
			hasUserPsw = true;
		}
		loginWindow.show();
		loginWindow.webContents.send('USER_SAFE_PASSWORD', hasUserPsw, userPsw);
	});
}

function createMainWindow() {
	const windowSize = store.get('mainWindowSize');

	mainWindow = new BrowserWindow({
		width: windowSize ? windowSize[0] : parseInt(screenWidth * 0.6),
		height: windowSize ? windowSize[1] : parseInt(screenHeight * 0.8),
		minWidth: 350,
		frame: false,
		transparent: true,
		show: false,
		fullscreenable: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	if (process.env.NODE_ENV === 'development') {
		mainWindow.loadURL('http://localhost:3000/main');
		mainWindow.webContents.openDevTools();
	} else {
		mainWindow.loadURL(
			url.format({
				pathname: path.join(DIRNAME, 'main/index.html'),
				protocol: 'file:',
				slashes: true,
			})
		);
	}

	const contextMenu = Menu.buildFromTemplate([
		{
			label: '最小化',
			click: () => {
				if (loginWindow !== null) {
					loginWindow.hide();
					// loginWindow.setSkipTaskbar(true)
					// loginWindow.minimize()
				} else {
					mainWindow.minimize();
				}
			},
		},
		{
			type: 'separator',
		},
		{
			label: '退出',
			click: () => {
				app.quit();
			},
			icon: nativeImage
				.createFromPath(path.join(DIRNAME, 'electronAssets/img/trayIcon/quit.png'))
				.resize({
					width: 16,
					height: 16,
					quality: 'best',
				}),
		},
	]);

	tray.setContextMenu(contextMenu);

	let isMaximized = store.get('isMainWindowMaximized');

	mainWindow.on('resize', () => {
		const isMax = mainWindow.isMaximized();
		if (isMaximized !== isMax) {
			store.set('isMainWindowMaximized', isMax);
			mainWindow.webContents.send('EXCHANGE_MAIN_WINDOW_MAXIMIZED_STATUS');
			isMaximized = isMax;
		} else if (!isMax) {
			store.set('mainWindowSize', mainWindow.getSize());
		}
	});

	mainWindow.on('closed', () => {
		mainWindow = null;
	});

	mainWindow.on('ready-to-show', () => {
		if (isMaximized) {
			mainWindow.maximize();
			mainWindow.webContents.send('EXCHANGE_MAIN_WINDOW_MAXIMIZED_STATUS');
		}
		mainWindow.show();
		// winPushStream()
	});

	ipc.on('EXCHANGE_MAIN_WINDOW_MAXIMIZED_STATUS', () => {
		if (mainWindow.isMaximized()) {
			mainWindow.unmaximize();
		} else {
			mainWindow.maximize();
		}
	});

	ipc.on('MINIMIZE_MAIN_WINDOW', () => {
		mainWindow.minimize();
	});

	const { desktopCapturer } = require('electron');
	ipc.handle('DESKTOP_CAPTURE', () => {
		return new Promise(async (resolve, reject) => {
			try {
				const sources = await desktopCapturer.getSources({ types: ['screen'] });
				resolve(sources[0]);
			} catch (err) {
				reject(err);
			}
		});
	});

	ipc.once('READY_TO_UPDATE', () => {
		readyToUpdate();
	});
}

app.on('ready', () => {
	screenWidth = screen.getPrimaryDisplay().workAreaSize.width;
	screenHeight = screen.getPrimaryDisplay().workAreaSize.height;

	if (process.env.NODE_ENV !== 'development')
		globalShortcut.register('CommandOrControl+Shift+I', () => {
			// console.log("你想打开开发者工具？");
		});

	createLoginWindow();
	ipc.once('QUIT', () => {
		if (process.platform !== 'darwin') {
			app.quit();
		} else {
			loginWindow = null;
			mainWindow = null;
		}
	});
});

app.on('window-all-closed', () => {
	// Mac平台下，关闭应用窗口后，应用会默认进入后台，需要用户手动终止程序
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (loginWindow === null) {
		createLoginWindow();
	}
});

app.on('will-quit', () => {
	if (process.env.NODE_ENV !== 'development') globalShortcut.unregisterAll();
});

function readyToUpdate() {
	const { spawn } = require('child_process');
	const child = spawn(
		path.join(EXEPATH, 'resources/ReadyUpdater.exe'),
		['YES_I_WANNA_UPDATE_ASAR'],
		{
			detached: true,
			shell: true,
		}
	);
	if (mainWindow) mainWindow.close();
	child.unref();
	app.quit();
}
