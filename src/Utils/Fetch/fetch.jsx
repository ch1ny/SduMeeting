const $fetch = {
    baseURL: '',
    post: function (url, params, headers) {
        return new Promise((resolve, reject) => {
            fetch(`${this.baseURL}${url}`, {
                method: 'POST',
                headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
                body: JSON.stringify(params)
            }).then((res) => {
                res.json()
            }).then((data) => {
                resolve(data)
            }).catch((err) => {
                reject(err)
            })
        })
    },
    get: function (url, params, headers) {
        let paramsStr = ''
        if (params) {
            for (const key in params) {
                paramsStr = (paramsStr === '' ? '?' : '&') + `${key}=${params[key]}`
            }
        }
        return new Promise((resolve, reject) => {
            fetch(`${this.baseURL}${url}${paramsStr}`, {
                method: 'GET',
                headers
            }).then((res) => {
                res.json()
            }).then((data) => {
                resolve(data)
            }).catch((err) => {
                reject(err)
            })
        })
    }
}

export default $fetch