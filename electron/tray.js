const { app, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { DIRNAME } = require('./main');
const { loginWindow } = require('./windows/login');

let tray;

function createLoginTray() {
	tray = tray || new Tray(path.join(DIRNAME, 'electronAssets/favicon.ico'));
	tray.setToolTip(`假装这是一个QQ\n(¯﹃¯)`);
	const contextMenu = Menu.buildFromTemplate([
		{
			label: '打开主面板',
			click: () => {
				loginWindow().show();
			},
			icon: nativeImage
				.createFromPath(path.join(DIRNAME, 'electronAssets/img/trayIcon/showWindow.png'))
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
	tray.setContextMenu(contextMenu);
	tray.on('click', () => {
		const _loginWindow = loginWindow();
		if (_loginWindow !== null) {
			_loginWindow.show();
		} else {
			mainWindow.show();
		}
	});
}

function createMainTray() {
	const contextMenu = Menu.buildFromTemplate([
		{
			label: '最小化',
			click: () => {
				const _loginWindow = loginWindow();
				if (_loginWindow !== null) {
					_loginWindow.hide();
				} else {
					mainWindow.minimize();
				}
			},
			icon: nativeImage
				.createFromPath(path.join(DIRNAME, 'electronAssets/img/trayIcon/showWindow.png'))
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
}

module.exports = {
	createLoginTray,
	createMainTray,
};
