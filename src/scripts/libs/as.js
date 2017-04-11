import $ from "./jquery";
class Base {
	constructor() {
		this.listeners = {};
	}
	subscribe(eventName, listener, context) {
		(this.listeners[eventName] = this.listeners[eventName] || []).push({
			func: listener,
			context: context
		});
	}
	emit(eventName, ...arg) {
		for(let listener of (this.listeners[eventName] || [])) {
			listener.func.apply(listener.context, arg);
		}
	}
}
class View extends Base {
	constructor(...args) {
		super();
		if(args[0].constructor === Array) { args = args[0]; }
		if(args[0].constructor == $) { args[0] = args[0][0]; }
		this.el = $(typeof(args[0])==="string" ? this.makeElement.apply(this, arguments) : args[0]);
	}
	makeElement(name, ...attribs) {
		const elem = document.createElement(name);
		for(let i = 0; i < attribs.length; ++i) {
			if(attribs[i] && typeof(attribs[i])==="string") {
				elem.classList.add(attribs[i]);
			} else if(attribs[i] && typeof(attribs[i])==="object") {
				for(const k in attribs[i]) {
					elem[k] = attribs[i][k];
				}
			}
		}
		return $(elem);
	}
	$(query) {
		return this.el.find(query);
	}
	addListener(type, match, method) {
		if(type.split(" ").length > 1) {
			type.split(" ").forEach(t => this.addListener(t, match, method));
		} else {
			type = this._normalizeEventTypeName(type);
			let elem = this.el;
			if(typeof(match) === "function") {
				method = match;
				match = null;
			} else if(match === document || match == window || match === "body" ) {
				elem = $(match);
				match = null;
			} else if(match === "window") {
				elem = $(window);
				match = null;
			}
			match ? elem.on(type, match, method.bind(this)) : elem.on(type, method.bind(this));
		}
	}
	_normalizeEventTypeName(type) {
		var el, transEndEventNames, name;
		if (type == "transitionend") {
			el = document.createElement('dummy');
			transEndEventNames = {
				'WebkitTransition': 'webkitTransitionEnd',
				'MozTransition': 'transitionend',
				'OTransition': 'oTransitionEnd otransitionend',
				'transition': 'transitionend'
			};
			for (name in transEndEventNames) {
				if (el.style[name] !== undefined) {
					type = transEndEventNames[name];
					break;
				}
			}
		} else if (type == "animationend") {
			el = document.createElement('dummy');
			transEndEventNames = {
				'WebkitAnimation': 'webkitAnimationEnd',
				'MozAnimation': 'animationend',
				'OAnimation': 'oAnimationEnd oanimationend',
				'animation': 'animationend'
			};
			for (name in transEndEventNames) {
				if (el.style[name] !== undefined) {
					type = transEndEventNames[name];
					break;
				}
			}
		}
		return type;
	}
	remove(detach) {
		if(detach) {
			this.el.detach();
		} else {
			this.el.remove();
		}
	}
}
export default { Base, View };
