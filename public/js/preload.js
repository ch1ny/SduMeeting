const desktopCapturer = window.require('electron').desktopCapturer;

window.navigator.mediaDevices.getDisplayMedia = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const sources = await desktopCapturer.getSources({ types: ['screen'] })
            const stream = await window.navigator.mediaDevices.getUserMedia({
                audio: false,
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