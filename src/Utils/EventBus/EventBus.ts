interface EventBusFunction {
    func: Function,
    once: boolean
}

class EventBus {
    events: {
        [key: string]: EventBusFunction[]
    };

    constructor() {
        this.events = {};
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
}

const eventBus = new EventBus();
export default eventBus;
