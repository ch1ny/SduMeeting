const {
	app,
	BrowserWindow,
	Tray,
	Menu,
	screen,
	nativeImage,
	safeStorage,
	dialog,
	shell,
} = require('electron');
const path = require('path');
const url = require('url');
const Store = require('electron-store');
const store = new Store();
const fs = require('fs-extra');
const cp = require('child_process');
const crypto = require('crypto');

let loginWindow, mainWindow;
let tray;
let screenWidth, screenHeight, screenScale;
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
	return new Promise((resolve) => {
		loginWindow = new BrowserWindow({
			width: parseInt(screenWidth * 0.35),
			height: parseInt(screenHeight * 0.5),
			frame: false,
			transparent: true,
			show: false,
			alwaysOnTop: true,
			skipTaskbar: true,
			resizable: process.env.NODE_ENV === 'development',
			fullscreenable: false,
			webPreferences: {
				preload: path.join(DIRNAME, 'electronAssets/preload.js'),
				devTools: process.env.NODE_ENV === 'development',
			},
		});

		const contextMenu = Menu.buildFromTemplate([
			{
				label: '打开主面板',
				click: () => {
					loginWindow.show();
				},
				icon: nativeImage
					.createFromPath(
						path.join(DIRNAME, 'electronAssets/img/trayIcon/showWindow.png')
					)
					.resize({
						width: 16,
						height: 16,
						quality: 'best',
					}),
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

		tray = tray || new Tray(path.join(DIRNAME, 'electronAssets/favicon.ico'));

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

		ipc.once('USER_LOGIN', (event, userToken, userEmail) => {
			ipc.handle('GET_USER_AUTH_TOKEN_AFTER_LOGIN', () => {
				return userToken;
			});
			ipc.removeAllListeners('MINIMIZE_LOGIN_WINDOW');
			ipc.removeAllListeners('SAFE_PASSWORD');
			ipc.removeHandler('GET_LAST_PASSWORD');
			createMainWindow(userEmail).then(() => {
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
			// NOTE: 根据用户电脑的缩放比自动调整页面缩放
			loginWindow.webContents.setZoomFactor(1.25 / screenScale);
			loginWindow.show();
			resolve();
		});
	});
}

function createMainWindow(userEmail) {
	return new Promise((resolve) => {
		const windowSize = store.get('mainWindowSize');

		mainWindow = new BrowserWindow({
			width: windowSize && windowSize[0] > 0 ? windowSize[0] : parseInt(screenWidth * 0.6),
			height: windowSize && windowSize[1] > 0 ? windowSize[1] : parseInt(screenHeight * 0.8),
			minWidth: parseInt(screenWidth * 0.45),
			frame: false,
			transparent: true,
			show: false,
			fullscreenable: false,
			webPreferences: {
				preload: path.join(DIRNAME, 'electronAssets/preload.js'),
				devTools: !app.isPackaged,
			},
		});

		if (app.isPackaged) {
			mainWindow.loadURL(
				url.format({
					pathname: path.join(DIRNAME, 'main/index.html'),
					protocol: 'file:',
					slashes: true,
				})
			);
		} else {
			mainWindow.loadURL('http://localhost:9000/main');
			// mainWindow.webContents.openDevTools();
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
				icon: nativeImage
					.createFromPath(
						path.join(DIRNAME, 'electronAssets/img/trayIcon/showWindow.png')
					)
					.resize({
						width: 16,
						height: 16,
						quality: 'best',
					}),
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

		mainWindow.on('moved', () => {
			if (mainWindow.getPosition()[1] <= 0) {
				mainWindow.maximize();
			}
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

		ipc.on('MAIN_WINDOW_RESTORE', () => {
			mainWindow.show();
		});

		ipc.on('MAIN_WINDOW_FULL_SCREEN', (event, isFullScreen) => {
			mainWindow.setFullScreenable(isFullScreen);
			mainWindow.setFullScreen(isFullScreen);
			mainWindow.setResizable(!isFullScreen);

			if (!isFullScreen) {
				const mainWindowSize = store.get('mainWindowSize');
				const [mainWindowWidth, mainWindowHeight] = mainWindowSize
					? mainWindowSize
					: [parseInt(screenWidth * 0.6), parseInt(screenHeight * 0.8)];
				mainWindow.setSize(
					mainWindowWidth > 0 ? mainWindowWidth : parseInt(screenWidth * 0.6),
					mainWindowHeight > 0 ? mainWindowHeight : parseInt(screenHeight * 0.8)
				);
				mainWindow.center();
			}
		});

		ipc.on('EXCHANGE_OPEN_AFTER_START_STATUS', (evt, openAtLogin) => {
			if (app.isPackaged) {
				if (openAtLogin) {
					cp.exec(
						`REG ADD HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run /v SduMeeting /t REG_SZ /d "${process.execPath}" /f`,
						(err) => {
							console.log(err);
						}
					);
				} else {
					cp.exec(
						`REG DELETE HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run /v SduMeeting /f`,
						(err) => {
							console.log(err);
						}
					);
				}
			}
		});

		ipc.handle('GET_OPEN_AFTER_START_STATUS', () => {
			return new Promise((resolve) => {
				cp.exec(
					`REG QUERY HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run /v SduMeeting`,
					(err, stdout, stderr) => {
						if (err) {
							resolve(false);
						}
						resolve(stdout.indexOf('SduMeeting') >= 0);
					}
				);
			});
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

		ipc.handle('SET_MESSAGE_HISTORY', (evt, messages) => {
			fs.ensureDir(path.join(EXEPATH, '/data/messages')).then(() => {
				fs.outputFile(
					path.join(EXEPATH, `/data/messages/${userEmail}.smm`),
					safeStorage.encryptString(JSON.stringify(messages)),
					(err) => {
						if (err) {
							console.log('write error');
							console.log(err);
						}
					}
				);
			});
		});

		ipc.handle('GET_MESSAGE_HISTORY', () => {
			return new Promise((resolve) => {
				fs.ensureDir(path.join(EXEPATH, '/data/messages'))
					.then(() => {
						return fs.ensureFile(path.join(EXEPATH, `/data/messages/${userEmail}.smm`));
					})
					.then(() => {
						fs.readFile(
							path.join(EXEPATH, `/data/messages/${userEmail}.smm`),
							(err, data) => {
								if (err) {
									console.log('read error');
									console.log(err);
								} else {
									let messages;
									if (data) {
										messages = safeStorage.decryptString(data);
									}
									messages = messages || '{}';
									resolve(messages);
								}
							}
						);
					});
			});
		});

		ipc.handle('DOWNLOADED_UPDATE_ZIP', (evt, data) => {
			fs.writeFileSync(path.join(EXEPATH, 'resources', 'update.zip'), data, 'binary');
			return true;
		});
		ipc.once('READY_TO_UPDATE', () => {
			readyToUpdate();
		});

		ipc.once('LOG_OUT', () => {
			createLoginWindow().then(() => {
				mainWindow.close();
			});
		});

		ipc.handle('IS_MAIN_WINDOW_MINIMIZED', () => {
			return mainWindow.isMinimized();
		});

		ipc.handle('DIFFIE_HELLMAN', (evt, ...args) => {
			switch (args.length) {
				case 1:
					return diffieHellman.final(args[0]);
				case 3:
					return diffieHellman.answer(args[0], args[1], args[2]);
				default:
					return diffieHellman.offer();
			}
		});

		mainWindow.on('closed', () => {
			ipc.removeHandler('GET_USER_AUTH_TOKEN_AFTER_LOGIN');
			ipc.removeAllListeners('EXCHANGE_MAIN_WINDOW_MAXIMIZED_STATUS');
			ipc.removeAllListeners('MINIMIZE_MAIN_WINDOW');
			ipc.removeAllListeners('MAIN_WINDOW_RESTORE');
			ipc.removeAllListeners('MAIN_WINDOW_FULL_SCREEN');
			ipc.removeAllListeners('EXCHANGE_OPEN_AFTER_START_STATUS');
			ipc.removeHandler('GET_OPEN_AFTER_START_STATUS');
			ipc.removeHandler('DESKTOP_CAPTURE');
			ipc.removeHandler('SET_MESSAGE_HISTORY');
			ipc.removeHandler('GET_MESSAGE_HISTORY');
			ipc.removeHandler('DOWNLOADED_UPDATE_ZIP');
			ipc.removeAllListeners('READY_TO_UPDATE');
			ipc.removeHandler('DIFFIE_HELLMAN');
			mainWindow = null;
		});
	});
}

app.on('ready', () => {
	const screenPrimaryDisplay = screen.getPrimaryDisplay();
	screenWidth = screenPrimaryDisplay.workAreaSize.width;
	screenHeight = screenPrimaryDisplay.workAreaSize.height;
	screenScale = screenPrimaryDisplay.scaleFactor;

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

function readyToUpdate() {
	const { spawn } = cp;
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

const diffieHellmanClient = crypto.createDiffieHellman(256, 5);
const diffieHellman = {
	offer() {
		diffieHellmanClient.generateKeys();
		const clientPublicKey = diffieHellmanClient.getPublicKey();
		const global_p = diffieHellmanClient.getPrime().toString('hex');
		const global_g = diffieHellmanClient.getGenerator().toString('hex');
		return new Array(global_p, global_g, clientPublicKey.toString('hex'));
	},
	answer(global_p, global_g, clientPublicKey) {
		const global_p_buffer = Buffer.from(global_p, 'hex');
		const global_g_buffer = Buffer.from(global_g, 'hex');
		const clienPublicKeyBuffer = Buffer.from(clientPublicKey, 'hex');
		const server = crypto.createDiffieHellman(global_p_buffer, global_g_buffer);
		server.generateKeys();
		const serverPublicKey = server.getPublicKey();
		const serverSecret = server.computeSecret(clienPublicKeyBuffer);
		return new Array(serverSecret.toString('hex'), serverPublicKey.toString('hex'));
	},
	final(serverPublicKey) {
		const serverPublicKey_buffer = Buffer.from(serverPublicKey, 'hex');
		const clientSecret = diffieHellmanClient.computeSecret(serverPublicKey_buffer);
		return clientSecret.toString('hex');
	},
};
