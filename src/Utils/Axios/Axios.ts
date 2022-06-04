import axios, { AxiosInstance, AxiosRequestHeaders } from 'axios';

const instance = axios.create({
	baseURL: 'http://meeting.aiolia.top:8080/',
});
// const wsInstance = axios.create({
// 	baseURL: 'http://meeting.aiolia.top:8080/chat/',
// });
instance.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
// wsInstance.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

export const updateToken = (token: string) => {
	instance.defaults.headers.common['Authorization'] = token;
	// wsInstance.defaults.headers.common['Authorization'] = token;
};

function convertParamsToData(param: object) {
	const paramArr = [];
	for (const key in param) {
		if (Object.hasOwnProperty.call(param, key)) {
			const value = param[key as keyof typeof param];
			paramArr.push(`${encodeURI(key)}=${encodeURI(value)}`);
		}
	}
	return paramArr.length > 0 ? paramArr.join('&') : '';
}

/**
 * 根据 AxiosInstance 实例生成 Ajax 对象
 * @param {AxiosInstance} instance AxiosInstance 实例
 */
class Ajax {
	instance: AxiosInstance;

	constructor(instance: AxiosInstance) {
		this.instance = instance;
	}

	post(url: string, params?: object, headers?: AxiosRequestHeaders): Promise<any> {
		return new Promise((resolve, reject) => {
			this.instance({
				method: 'post',
				url,
				data: params ? convertParamsToData(params) : '',
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
	}

	file(url: string, params: object, headers = {}): Promise<any> {
		const param = new FormData();
		for (const key in params) {
			if (Object.hasOwnProperty.call(params, key)) {
				param.append(key, params[key as keyof typeof params]);
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
	}

	get(url: string, params?: object, headers?: AxiosRequestHeaders): Promise<any> {
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
	}
}

const ajax = new Ajax(instance);
// const wsAjax = new Ajax(wsInstance);

export default ajax;
