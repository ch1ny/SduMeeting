const { useRef, useEffect } = require('react');

/**
 * 【自定义Hooks】保留数据在上一个时刻的状态
 * @param {any} value 需要保留的数据
 * @returns 数据在上一时刻的状态
 */
const usePrevious = (value) => {
	const ref = useRef();
	useEffect(() => {
		ref.current = value;
	});
	return ref.current;
};

export { usePrevious };
