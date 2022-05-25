const { app, BrowserWindow, safeStorage } = require('electron');
const path = require('path');
const url = require('url');
const { ipc } = require('../ipcMain');
const { DIRNAME, store } = require('../main');
const { createLoginTray } = require('../tray');
const { createMainWindow } = require('./main');

let loginWindow;

function createLoginWindow(screenWidth, screenHeight, screenScale) {
	return new Promise((resolve) => {
		loginWindow = new BrowserWindow({
			width: parseInt(screenWidth * 0.35),
			height: parseInt(screenHeight * 0.5),
			frame: false,
			transparent: true,
			show: false,
			alwaysOnTop: true,
			skipTaskbar: true,
			resizable: !app.isPackaged,
			fullscreenable: false,
			webPreferences: {
				preload: path.join(DIRNAME, 'electronAssets/preload.js'),
				devTools: !app.isPackaged,
			},
		});

		if (app.isPackaged) {
			loginWindow.loadURL(
				url.format({
					pathname: path.join(DIRNAME, 'login/index.html'),
					protocol: 'file:',
					slashes: true,
				})
			);
		} else {
			loginWindow.loadURL('http://localhost:9000/login');
			// loginWindow.webContents.openDevTools();
		}

		createLoginTray();

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
			createMainWindow(
				userEmail,
				createLoginWindow,
				screenWidth,
				screenHeight,
				screenScale
			).then(() => {
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

module.exports = {
	loginWindow: () => {
		return loginWindow;
	},
	createLoginWindow,
};
