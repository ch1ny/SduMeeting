/**
 * 这个文件用来存放一些不好分类的全局函数
 */

/**
 * 用来返回 mainContent 模态屏遮罩层挂载DOM
 * @returns Id值为'mainContent'的DOM
 */
function getMainContent() {
	return document.getElementById('mainContent');
}

export { getMainContent };
