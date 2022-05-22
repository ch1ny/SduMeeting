const { contextBridge, ipcRenderer } = require('electron');

const _ipcRenderer = Object.assign(
	{
		on: (channel, cb) => {
			ipcRenderer.on(channel, cb);
		},
		once: (channel, cb) => {
			ipcRenderer.once(channel, cb);
		},
		removeEventListener: (channel, cb) => {
			ipcRenderer.removeListener(channel, cb);
		},
		desktopCapturer: function () {
			return new Promise((resolve) => {
				ipcRenderer.invoke('DESKTOP_CAPTURE').then((source) => {
					// console.log(source);
					navigator.mediaDevices
						.getUserMedia({
							audio: {
								mandatory: {
									chromeMediaSource: 'desktop',
									chromeMediaSourceId: source.id,
								},
							},
							video: {
								mandatory: {
									chromeMediaSource: 'desktop',
									chromeMediaSourceId: source.id,
								},
							},
						})
						.then((stream) => {
							console.log(stream);
							const video = document.createElement('video');
							// document.body.appendChild(video);
							video.srcObject = stream;
							resolve(video);
						});
				});
			});
		},
	},
	ipcRenderer
);
contextBridge.exposeInMainWorld('ipc', _ipcRenderer);

contextBridge.exposeInMainWorld('captureDesktop', function () {
	return new Promise((resolve) => {
		ipcRenderer.invoke('DESKTOP_CAPTURE').then((source) => {
			// console.log(source);
			navigator.mediaDevices
				.getUserMedia({
					audio: {
						mandatory: {
							chromeMediaSource: 'desktop',
							chromeMediaSourceId: source.id,
						},
					},
					video: {
						mandatory: {
							chromeMediaSource: 'desktop',
							chromeMediaSourceId: source.id,
						},
					},
				})
				.then((stream) => {
					let video = document.createElement('video');
					video.srcObject = stream;
					resolve(video);
					video = null;
				});
		});
	});
});
