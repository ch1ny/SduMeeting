interface EventBusFunction {
	func: Function;
	once: boolean;
}

class EventBus {
	events: {
		[key: string]: EventBusFunction[];
	};
	handlers: {
		[key: string]: Function;
	};

	constructor() {
		this.events = {};
		this.handlers = {};
	}

	/**
	 * 为事件总线添加监听
	 * @param {string} type 添加的事件柄
	 * @param {Function} func 事件触发后执行的函数
	 */
	on(type: string, func: Function) {
		if (!this.events[type]) this.events[type] = [];
		this.events[type].push({
			func,
			once: false,
		});
	}

	/**
	 * 为事件总线添加监听，只监听一次
	 * @param {string} type 添加的事件柄
	 * @param {Function} func 事件触发后执行的函数
	 */
	once(type: string, func: Function) {
		if (!this.events[type]) this.events[type] = [];
		this.events[type].push({
			func,
			once: true,
		});
	}

	/**
	 * 触发事件
	 * @param {string} type 要触发的事件类型
	 * @param  {...any} args 传入的参数
	 */
	emit(type: string, ...args: any[]) {
		if (this.events[type]) {
			const cbs = this.events[type];
			const newCbs = new Array();
			while (cbs.length > 0) {
				const cb = cbs.pop() as EventBusFunction;
				cb.func.apply(this, args);
				if (!cb.once) newCbs.push(cb);
			}
			if (newCbs.length === 0) delete this.events[type];
			else this.events[type] = newCbs;
		}
	}

	/**
	 * 从事件总线上移除某个函数的监听
	 * @param {string} type 从哪个事件柄上移除函数
	 * @param {Function} func 需要移除的函数
	 * @returns {boolean} 是否执行了移除事件
	 */
	off(type: string, func: Function): boolean {
		if (this.events && this.events[type]) {
			const cbs = this.events[type];
			let index = -1;
			for (const cb of cbs) {
				index++;
				if (cb.func === func) {
					cbs.splice(index, 1);
					if (cbs.length === 0) delete this.events[type];
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * 从事件总线上移除某个事件的全部监听
	 * @param {string} type 需要移除的事件柄
	 */
	offAll(type: string) {
		if (this.events) {
			delete this.events[type];
		}
	}

	/**
	 * 向事件总线添加事件柄回调
	 * @param {string} type 事件柄名
	 * @param {Function} cb 回调函数
	 */
	handle(type: string, cb: Function): { ok: boolean; err?: Error } {
		if (this.handlers[type]) {
			return {
				ok: false,
				err: new Error(`Handler '${type}' has already been registered.`),
			};
		} else {
			this.handlers[type] = cb;
			return {
				ok: true,
			};
		}
	}

	/**
	 * 异步触发事件柄函数
	 * @param {string} type 要触发的事件柄
	 * @param {Array} args 传给回调函数的参数
	 * @returns {Promise} 经过 Promise 封装后的回调函数执行结果
	 */
	invoke(type: string, ...args: any[]) {
		const handler = this.handlers[type];
		if (handler) {
			return Promise.resolve(handler.apply(this, args));
		} else {
			throw Promise.resolve(new Error(`Handler '${type}' has not been registered yet.`));
		}
	}

	/**
	 * 同步触发事件柄函数
	 * @param {string} type 要触发的事件柄
	 * @param {Array} args 传给回调函数的参数
	 * @returns 回调函数执行结果
	 */
	invokeSync(type: string, ...args: any[]) {
		const handler = this.handlers[type];
		if (handler) {
			return handler.apply(this, args);
		} else {
			throw new Error(`Handler '${type}' has not been registered yet.`);
		}
	}

	/**
	 * 移除事件柄监听
	 * @param {string} type 要移除的事件柄
	 */
	removeHandler(type: string) {
		delete this.handlers[type];
	}
}

const eventBus = new EventBus();
export default eventBus;
