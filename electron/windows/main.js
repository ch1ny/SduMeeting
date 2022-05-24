const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs-extra');
const cp = require('child_process');
const { ipc } = require('../ipcMain');
const { DIRNAME, store, EXEPATH } = require('../main');
const { createMainTray } = require('../tray');
const { readyToUpdate } = require('../utils/updater');
const { createLoginWindow } = require('./login');

let mainWindow;

function createMainWindow(userEmail, screenWidth, screenHeight) {
	return new Promise((resolve) => {
		const windowSize = store.get('mainWindowSize');

		mainWindow = new BrowserWindow({
			width: windowSize ? windowSize[0] : parseInt(screenWidth * 0.6),
			height: windowSize ? windowSize[1] : parseInt(screenHeight * 0.8),
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
			mainWindow.webContents.openDevTools();
		}

		createMainTray();

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
			if (!isFullScreen) {
				const mainWindowSize = store.get('mainWindowSize');
				const [mainWindowWidth, mainWindowHeight] = mainWindowSize
					? mainWindowSize
					: [parseInt(screenWidth * 0.6), parseInt(screenHeight * 0.8)];
				mainWindow.setSize(mainWindowWidth, mainWindowHeight);
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
				fs.writeFile(
					path.join(EXEPATH, `/data/messages/${userEmail}.smm`),
					JSON.stringify(messages),
					'utf8',
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
							'utf8',
							(err, data) => {
								if (err) {
									console.log('read error');
									console.log(err);
								} else {
									resolve(data || '{}');
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
			mainWindow = null;
		});
	});
}

module.exports = {
	mainWindow: () => {
		return mainWindow;
	},
	createMainWindow,
};
