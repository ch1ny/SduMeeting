const { contextBridge, ipcRenderer } = require('electron');
const crypto = require('crypto');

const _ipcRenderer = Object.assign(
	{
		on: (channel, cb) => {
			ipcRenderer.on(channel, cb);
		},
		once: (channel, cb) => {
			ipcRenderer.once(channel, cb);
		},
		removeListener: (channel, cb) => {
			ipcRenderer.removeListener(channel, cb);
		},
	},
	ipcRenderer
);
contextBridge.exposeInMainWorld('ipc', _ipcRenderer);
