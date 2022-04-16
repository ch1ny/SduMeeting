class EventBus {
	constructor() {
		this.events = this.events || new Object();
	}
}

EventBus.prototype.emit = function (type, ...args) {
	if (this.events[type]) {
		const cbs = this.events[type];
		for (const cb of cbs) {
			cb.apply(this, args);
		}
	}
};

EventBus.prototype.on = function (type, func) {
	if (!this.events[type]) this.events[type] = [];
	this.events[type].push(func);
};

EventBus.prototype.off = function (type, func) {
	if (this.events && this.events[type]) {
		let index = this.events[type].indexOf(func);
		if (index === -1) return false;
		this.events[type].splice(this.events[type].indexOf(func), 1);
		return true;
	}
	return false;
};

EventBus.prototype.offAll = function (type) {
	if (this.events) {
		delete this.events[type];
	}
};

const eventBus = new EventBus();
export default eventBus;
