const {
	app,
	BrowserWindow,
	Tray,
	Menu,
	screen,
	nativeImage,
	globalShortcut,
	safeStorage,
	dialog,
} = require('electron');
const path = require('path');
const url = require('url');
const Store = require('electron-store');
const store = new Store();
const fs = require('fs-extra');

let loginWindow, mainWindow;
let tray;
let screenWidth, screenHeight;
const ipc = require('electron').ipcMain;
const DIRNAME = process.env.NODE_ENV === 'development' ? path.join(__dirname, 'public') : __dirname;
/**
 * exe 所在的文件夹目录，
 * 例 exe 的完整路径为
 * D:/山大会议/SduMeeting.exe
 * 则 EXEPATH 的值为
 * D:/山大会议
 */
const EXEPATH = path.dirname(app.getPath('exe'));

if (process.env.NODE_ENV !== 'development') requestInstanceLock();

function createLoginWindow() {
	loginWindow = new BrowserWindow({
		width: parseInt(screenWidth * 0.35),
		height: parseInt(screenHeight * 0.5),
		frame: false,
		transparent: true,
		show: false,
		// alwaysOnTop: true,
		resizable: process.env.NODE_ENV === 'development',
		fullscreenable: false,
		webPreferences: {
			preload: path.join(DIRNAME, 'electronAssets/preload.js'),
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
		loginWindow.loadURL('http://localhost:9000/login');
		// loginWindow.webContents.openDevTools();
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
			mainWindow.show();
		}
	});

	ipc.handleOnce('GET_LAST_PASSWORD', () => {
		let userPsw;
		if (store.get('userSafePsw')) {
			userPsw = safeStorage.decryptString(Buffer.from(store.get('userSafePsw').data));
		}
		return userPsw;
	});

	ipc.once('USER_LOGIN', (event, userToken) => {
		ipc.handle('GET_USER_AUTH_TOKEN_AFTER_LOGIN', () => {
			return userToken;
		});
		ipc.removeAllListeners('MINIMIZE_LOGIN_WINDOW');
		ipc.removeAllListeners('SAFE_PASSWORD');
		ipc.removeHandler('GET_LAST_PASSWORD');
		createMainWindow().then(() => {
			loginWindow.close();
		});
		ipc.removeAllListeners('USER_LOGIN');
	});

	ipc.once('SAFE_PASSWORD', (event, shouldSave, userPsw) => {
		if (shouldSave) {
			store.set('userSafePsw', safeStorage.encryptString(userPsw));
		} else {
			store.clear('userSafePsw');
		}
	});

	ipc.on('MINIMIZE_LOGIN_WINDOW', () => {
		loginWindow.hide();
	});

	loginWindow.on('closed', () => {
		loginWindow = null;
	});

	loginWindow.on('ready-to-show', () => {
		loginWindow.show();
	});
}

function createMainWindow() {
	return new Promise((resolve) => {
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
				preload: path.join(DIRNAME, 'electronAssets/preload.js'),
			},
		});

		if (process.env.NODE_ENV === 'development') {
			mainWindow.loadURL('http://localhost:9000/main');
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
						mainWindow.hide();
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
		isMaximized = isMaximized ? isMaximized : false;

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
			resolve();
		});

		mainWindow.on('show', () => {
			mainWindow.webContents.send('MAIN_WINDOW_RESTORE');
		});

		ipc.on('EXCHANGE_MAIN_WINDOW_MAXIMIZED_STATUS', () => {
			if (mainWindow.isMaximized()) {
				mainWindow.unmaximize();
			} else {
				mainWindow.maximize();
			}
		});

		ipc.on('MINIMIZE_MAIN_WINDOW', () => {
			mainWindow.hide();
		});

		ipc.on('MAIN_WINDOW_RESTORE', () => {
			mainWindow.show();
		});

		ipc.on('MAIN_WINDOW_FULL_SCREEN', (event, isFullScreen) => {
			mainWindow.setFullScreenable(isFullScreen);
			mainWindow.setFullScreen(isFullScreen);
			if (!isFullScreen) {
				const mainWindowSize = store.get('mainWindowSize');
				const [mainWindowWidth, mainWindowHeight] = mainWindowSize
					? mainWindowSize
					: [parseInt(screenWidth * 0.6), parseInt(screenHeight * 0.8)];
				mainWindow.setSize(mainWindowWidth, mainWindowHeight);
				mainWindow.center();
			}
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
	ipc.handle('APP_VERSION', () => {
		return app.getVersion();
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

/**
 * 尝试获得唯一实例锁
 */
function requestInstanceLock() {
	const instanceLock = app.requestSingleInstanceLock();
	if (!instanceLock) app.quit();
	else {
		app.on('second-instance', () => {
			const existWindow = mainWindow || loginWindow;
			if (existWindow) {
				existWindow.show();
				dialog.showMessageBoxSync(existWindow, {
					message: '程序已经在运行中了！',
					type: 'warning',
					buttons: ['确定'],
					title: '尝试重复启动实例',
				});
			}
		});
	}
}
