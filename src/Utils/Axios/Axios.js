import axios from 'axios';
import store from 'Utils/Store/store';

const instance = axios.create({
	baseURL: 'http://meeting.aiolia.top:8080/',
});
instance.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

store.subscribe(() => {
	instance.defaults.headers.common['Authorization'] = store.getState().authToken;
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

const ajax = {
	post: function (url, params, headers) {
		return new Promise((resolve, reject) => {
			instance({
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
	get: function (url, params, headers) {},
};

export default ajax;
