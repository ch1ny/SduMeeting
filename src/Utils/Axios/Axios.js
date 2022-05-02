import axios, { AxiosInstance } from 'axios';
import store from 'Utils/Store/store';

const instance = axios.create({
	baseURL: 'http://meeting.aiolia.top:8080/',
});
const wsInstance = axios.create({
	baseURL: 'http://meeting.aiolia.top:8005/',
});
instance.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
wsInstance.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

store.subscribe(() => {
	const token = store.getState().authToken;
	instance.defaults.headers.common['Authorization'] = token;
	wsInstance.defaults.headers.common['Authorization'] = token;
});

function convertParamsToData(param) {
	const paramArr = [];
	for (const key in param) {
		if (Object.hasOwnProperty.call(param, key)) {
			const value = param[key];
			paramArr.push(`${encodeURI(key)}=${encodeURI(value)}`);
		}
	}
	return paramArr.length > 0 ? paramArr.join('&') : '';
}

/**
 * 根据 AxiosInstance 实例生成 Ajax 对象
 * @param {AxiosInstance} instance AxiosInstance 实例
 */
function Ajax(instance) {
	this.instance = instance;
}
Ajax.prototype = {
	post: function (url, params, headers) {
		return new Promise((resolve, reject) => {
			this.instance({
				method: 'post',
				url,
				data: convertParamsToData(params),
				headers,
			})
				.then((response) => {
					resolve(response.data);
				})
				.catch((error) => {
					reject({
						error,
						ajax: true,
					});
				});
		});
	},
	file: function (url, params, headers = {}) {
		const param = new FormData();
		for (const key in params) {
			if (Object.hasOwnProperty.call(params, key)) {
				param.append(key, params[key]);
			}
		}
		return new Promise((resolve, reject) => {
			this.instance({
				method: 'post',
				url,
				data: param,
				headers: Object.assign(headers, { 'Content-Type': 'multipart/form-data' }),
			})
				.then((response) => {
					resolve(response.data);
				})
				.catch((error) => {
					reject({
						error,
						ajax: true,
					});
				});
		});
	},
	get: function (url, params, headers) {
		return new Promise((resolve, reject) => {
			this.instance({
				method: 'GET',
				url,
				headers,
				params,
			})
				.then((response) => {
					resolve(response.data);
				})
				.catch((error) => {
					reject({
						error,
						ajax: true,
					});
				});
		});
	},
};
Object.defineProperty(Ajax.prototype, 'constructor', {
	enumerable: false,
	value: Ajax,
});

const ajax = new Ajax(instance);
const wsAjax = new Ajax(wsInstance);

export { ajax, wsAjax };
