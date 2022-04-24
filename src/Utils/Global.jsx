/**
 * 这个文件用来存放一些不好分类的全局函数
 */

import jwtDecode from "jwt-decode";

/**
 * 用来返回 mainContent 模态屏遮罩层挂载DOM
 * @returns Id值为'mainContent'的DOM
 */
function getMainContent() {
	return document.getElementById('mainContent');
}

/**
 * 由于直接使用 jwtDecode 解析非法 token 会报错，因此进行封装
 * @param {String} token 
 * @returns 解析后的 token
 */
function decodeJWT(token) {
	try {
		return jwtDecode(token)
	} catch (error) {
		if (error.message === 'Invalid token specified') return undefined
		console.log(error);
	}
}

export { decodeJWT, getMainContent };
