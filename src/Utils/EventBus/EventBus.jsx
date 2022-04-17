const EventBus = function () {
	this.events = this.events || new Object();
};

EventBus.prototype = {
	on: function (type, func) {
		if (!this.events[type]) this.events[type] = [];
		this.events[type].push({
			func,
			once: false,
		});
	},
	once: function (type, func) {
		if (!this.events[type]) this.events[type] = [];
		this.events[type].push({
			func,
			once: true,
		});
	},
	emit: function (type, ...args) {
		if (this.events[type]) {
			const cbs = this.events[type];
			const newCbs = new Array();
			while (cbs.length > 0) {
				const cb = cbs.pop();
				cb.func.apply(this, args);
				if (!cb.once) newCbs.push(cb);
			}
			if (newCbs.length === 0) delete this.events[type];
			else this.events[type] = newCbs;
		}
	},
	off: function (type, func) {
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
	},
	offAll: function (type) {
		if (this.events) {
			delete this.events[type];
		}
	},
};

Object.defineProperty(EventBus.prototype, 'constructor', {
	enumerable: false,
	value: EventBus,
});

const eventBus = new EventBus();
export default eventBus;
