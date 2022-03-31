const $fetch = {
    post: (url, params, headers) => {
        return new Promise((resolve, reject) => {
            fetch(url, {
                method: 'POST',
                headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
                body: JSON.stringify(params),
                cache: 'no-cache',
            }).then((response) => {
                if (response.status === 200 && response.ok === true) {
                    resolve(response.json())
                } else {
                    reject(response.json())
                }
            }).catch((err) => {
                reject(err)
            })
        })
    },
    get: (url, params, headers) => {
        let paramsStr = ''
        if (params) {
            for (const key in params) {
                paramsStr = (paramsStr === '' ? '?' : '&') + `${key}=${params[key]}`
            }
        }
        return new Promise((resolve, reject) => {
            fetch(`${url}${paramsStr}`, {
                method: 'GET',
                headers,
                cache: 'no-cache'
            }).then((response) => {
                if (response.status === 200 && response.ok === true) {
                    resolve(response.json())
                } else {
                    reject(response.json())
                }
            }).catch((err) => {
                reject(err)
            })
        })
    }
}

export default $fetch