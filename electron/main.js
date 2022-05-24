const { app } = require('electron');
const path = require('path');
const Store = require('electron-store');
const store = new Store();

module.exports = {
	DIRNAME: path.join(__dirname, '..', app.isPackaged ? '.' : 'public'),
	/**
	 * exe 所在的文件夹目录，
	 * 例 exe 的完整路径为
	 * D:/山大会议/SduMeeting.exe
	 * 则 EXEPATH 的值为
	 * D:/山大会议
	 */
	EXEPATH: path.dirname(app.getPath('exe')),
	store,
};
