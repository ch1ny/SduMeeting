/**
 * 重写 window.mediaDevices.getDisplayMedia() 方法
 */
function overwriteGetDisplayMedia() {
    const desktopCapturer = window.require('electron').desktopCapturer;
    window.navigator.mediaDevices.getDisplayMedia = (withAudio = false) => {
        return new Promise(async (resolve, reject) => {
            try {
                const sources = await desktopCapturer.getSources({ types: ['screen'] })
                console.log(sources);
                const stream = await window.navigator.mediaDevices.getUserMedia({
                    audio: withAudio ? {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: sources[0].id
                        }
                    } : withAudio,
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: sources[0].id
                        }
                    }
                })
                resolve(stream)
            } catch (err) {
                reject(err)
            }
        })
    }
}

/**
 * 入口函数
 */
(() => {
    overwriteGetDisplayMedia()
})()