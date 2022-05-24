const { app, screen, dialog } = require('electron');
const { ipc } = require('./ipcMain');
const { createLoginWindow, loginWindow } = require('./windows/login');
const { mainWindow } = require('./windows/main');

let screenWidth, screenHeight, screenScale;

if (app.isPackaged) requestInstanceLock();

app.on('ready', () => {
	const screenPrimaryDisplay = screen.getPrimaryDisplay();
	screenWidth = screenPrimaryDisplay.workAreaSize.width;
	screenHeight = screenPrimaryDisplay.workAreaSize.height;
	screenScale = screenPrimaryDisplay.scaleFactor;

	createLoginWindow(screenWidth, screenHeight, screenScale);

	ipc.once('QUIT', () => {
		app.quit();
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
	if (loginWindow() === null) {
		createLoginWindow(screenWidth, screenHeight, screenScale);
	}
});

/**
 * 尝试获得唯一实例锁
 */
function requestInstanceLock() {
	const instanceLock = app.requestSingleInstanceLock();
	if (!instanceLock) app.quit();
	else {
		app.on('second-instance', () => {
			const existWindow = mainWindow() || loginWindow();
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
