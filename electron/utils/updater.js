const { app } = require('electron');
const cp = require('child_process');
const path = require('path');
const { EXEPATH } = require('../main');
const { mainWindow } = require('../windows/main');

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
	const _mainWindow = mainWindow();
	if (_mainWindow) _mainWindow.close();
	child.unref();
	app.quit();
}

module.exports = {
	readyToUpdate,
};
