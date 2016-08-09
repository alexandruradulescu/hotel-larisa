/*
* appstract base definition file
* Copyright appstract 2013, 2014
*/

if(typeof DEBUG === "undefined") { window.DEBUG = true; }

/*jsvalidator:skip*/
(function(root) {
	"use strict";
	var modules = {};

	if(DEBUG) {
		var onReady = function(callback) {
			var addListener = document.addEventListener || document.attachEvent,
	        eventName = document.addEventListener ? "DOMContentLoaded" : "onreadystatechange";
			addListener.call(document, eventName, callback, false);
		};

		onReady(function() {
			var missing = [], unresolved = [], n, o, i;
			for(n in modules) {
				if(!modules.hasOwnProperty(n) || !modules[n].def) { continue; } //skip undefined modules, since they have no req list anyway. we should get an error message when we get to the module that actually caused the undefined entry.
				for(i = 0; i < modules[n].req.length; ++i) {
					o = modules[modules[n].req[i]];
					if(!o || !o.def) {
						missing.push("missing module " + o.name + " is required by " + n);
					}
				}
			}
			for(n in modules) {
				if(!modules.hasOwnProperty(n)) { continue; }
				var m = modules[n];
				if(m.unresolved > 0) {
					var list = [];
					for(o in modules) {
						if(modules.hasOwnProperty(o) && modules[o].waiters && modules[o].waiters[n]) { list.push(o); }
					}
					unresolved.push(m.name + " is unresolved because of " + list.join(", "));
				}
			}
			if(missing.length > 0) {
				throw new Error("Module loader: " + missing.join(", "));
			} else if(unresolved.length > 0) {
				throw new Error("Module loader: circular dependency:\n" + unresolved.join("\n"));
			}
		});
	}

	//recursively resolve a module, and any other modules that were directly or indirectly only waiting for this module to load.
	var resolve = function(module) {
		var w;

		var map = function(arr, cb) { var i, out = []; for(i = 0; i < arr.length; ++i) { out.push(cb(arr[i])); } return out; };

		//call the module definition function and set 'self', or if def is not a function, then just use it as 'self'. if it is falsy, set it to null, to differentiate from default undefined state.
		module.self = (typeof module.def === "function" ? module.def.apply(null, map(module.req, function(r) { return modules[r].self; })) : module.def) || null;

		//resolve recursive dependencies...
		for(w in module.waiters) {
			if(!module.waiters.hasOwnProperty(w)) { continue; }
			if(--modules[w].unresolved === 0) {
				resolve(modules[w]);
			}
		}
		module.waiters = null;
	};

	var unnamedNum = 0;
	root.define = function() {
		var i, other, module, name, req = [], def, next = 0, existing;
		if(typeof arguments[next] === "string") { name = arguments[next++]; }
		if(Object.prototype.toString.call(arguments[next]) === '[object Array]') { req = arguments[next++]; }
		if(typeof arguments[next] === "function" || typeof arguments[next] === "object") { def = arguments[next++]; }
		name = name || "unnamed" + (unnamedNum++);

		if(DEBUG) {
			if(!name) { throw new Error("Module loader: Missing module name!"); }
			if(!def) { throw new Error("Module loader: module '" + name + "' has no body"); }
			if(modules[name] && modules[name].def) { throw new Error("Module loader: Duplicate definition of module: " + name); }
			existing = {};
			for(i = 0; i < req.length; ++i) {
				if(existing[req[i]]) { throw new Error("Module loader: duplicate requirement for " + req[i] + " in module " + name); }
				existing[req[i]] = true;
			}
		}

		//register the module. it might be 'registered' already if some other module required it. in that case, just augment the existing module object...
		module = modules[name] = modules[name] || { name: name, waiters: {}, unresolved: 0 };
		module.def = def;
		module.req = req;

		//count the number of unresolved dependencies and register this module as 'waiter' with the modules that it is waiting for...
		for(i = 0; i < req.length; ++i) {
			other = modules[req[i]] = modules[req[i]] || { name: req[i], waiters: {}, unresolved: 0 };
			if(!other.self) {
				if(DEBUG) {
					if(other.self === null) {
						//the it HAS been initialized, but has no self...
						throw new Error("Module loader: required module '" + other.name + "' has no self");
					}
				}
				++module.unresolved;
				other.waiters[name] = true;
			}
		}

		//if the module is not waiting for any others then resolve it now...
		if(module.unresolved === 0) { resolve(module); }
	};

	root.require = function(names, callback) {
		if(typeof names === "string") {
			if(DEBUG) { if(callback) { throw new Error("Simple require() call should have only one argument"); } }
			return (modules[names] ? modules[names].self : null);
		}
		//async loading not implemented.
	};

	root.define.amd = {};

	//special cases for convenience...
	var i, globals = ["$", "jQuery", "_"];
	for(i in globals) {
		if(window[globals[i]]) {
			root.define(globals[i], [], function() { return window[globals[i]]; });
		}
	}

}(this));


define("as", ["$", "_"], function($, _) {
	"use strict";
	var as = {};
	var dummy = window.___as_generated && window.___as_generated(as); //weird syntax to make our validator happy - this is a special case :)

	as.pureVirtual = function() { throw new Error("Function was not implemented."); }; //marker for a function that must be implemented in a subclass.

	var freeze = Object.freeze || function() { };

	as.$ = $; //todo: remove.

	as.defineClass = function(base, obj, staticProperties) {
		var a, cons, F;

		if(!base || typeof (base) !== 'function') { //catch spelling mistakes in the base, to improve userfriendlyness -- otherwise passing undefined as first arg gives a strange error.
			throw new Error("Base class undefined.");
		}

		cons = (obj.con && function() {
			base.apply(this, arguments);
			obj.con.apply(this, arguments);
		}) || function() { base.apply(this, arguments); }; //obj.con || function() {};

		F = function() { this.constructor = cons; };
		F.prototype = base.prototype;
		cons.prototype = new F();

		var sharedProps = (base.prototype.sharedProperties || []).concat(obj['sharedProperties'] || []);
		var shared = {};
		for(a in sharedProps) {
			shared[sharedProps[a]] = true;
		}
		freeze(shared);
		freeze(sharedProps);

		for(a in obj) {
			if(obj.hasOwnProperty(a)) {
				if(typeof obj[a] !== "function" && !shared[a]) {
					throw new Error("defineClass: non-function member: " + a);
				}
				cons.prototype[a] = obj[a];
			}
		}
		cons.prototype['sharedProperties'] = sharedProps; //overwrite with the full list.

		//inherit static properties...
		for(a in base) {
			if(base.hasOwnProperty(a) && a !== "prototype") { //check for prototype as a special case, since old-school prototype-changing libraries seem to cause problems otherwise.
				cons[a] = base[a];
			}
		}
		//new static properties...
		if(staticProperties) {
			for(a in staticProperties) {
				if(staticProperties.hasOwnProperty(a)) {
					cons[a] = staticProperties[a];
				}
			}
		}

		//set 'abstract' flag on both class and instance. (needed on instance so as.Base constructor can know if it should complain or not).
		cons.abstract = cons.prototype.abstract = obj.hasOwnProperty("abstract");

		cons._super = base.prototype;
		if(cons.staticInitializer) { cons.staticInitializer(); } //todo: overriding? maybe handle like show/remove?
		freeze(cons);
		//freeze(cons.prototype);

		return cons;
	};

	//extremely simple sprintf(), for use with templates and translation strings, supporting only %o, which simply forces any argument to a string.
	as.format = function() {
		var parts = arguments[0].split("%o"), result = [], i;
		if(DEBUG) { if(arguments.length !== parts.length) { throw new Error("number of arguments does not match format string"); } }
		for(i = 0; i < parts.length; ++i) {
			result.push(parts[i], arguments[i + 1]);
		}
		result.pop(); //remove unneeded last index.
		return result.join("");
	};

	as.Base = as.defineClass(Object, {
		abstract: true,
		sharedProperties: ['sharedProperties', 'abstract'],
		con: function() {
			if(DEBUG) { if(this.abstract) { throw new Error("Instantiation of abstract class!"); } }
		},
		destroy: function() {
			delete this.eventListeners;
			this.clearTimeouts();
		},
		_getEventList: function(name, add) {
			if(typeof (name) !== "string") { throw new Error("argument mismatch. expected string."); }
			this.eventListeners = this.eventListeners || Object.create(null); //no need for the prototype.
			var list = this.eventListeners[name];
			if(!list && add) { list = this.eventListeners[name] = []; }
			return list;
		},
		_eventListFind: function(list, func, context) {
			var i;
			if(typeof (func) !== "function") { throw new Error("argument mismatch. expected function"); }
			for(i = 0; i < list.length; ++i) {
				if((!func || list[i].f === func) && (!context || list[i].obj === context)) {
					return i;
				}
			}
			return -1;
		},
		subscribe: function(name, func, context) {
			var list = this._getEventList(name, true);
			if(this._eventListFind(list, func, context) < 0) {
				list.push({ f: func, obj: context });
			}
			return this;
		},
		unsubscribe: function(name, func, context) {
			var idx, list = this._getEventList(name, false);
			if(list && (idx = this._eventListFind(list, func, context)) >= 0) {
				//we must reallocate list, so that detaches during an emit will not misbehave.
				//this is probably better than working on a copy inside emit, or trying to work around the change, since this will be less frequent.
				list = this.eventListeners[name] = list.slice(0);
				list[idx] = list[list.length - 1];
				list.length--;
				return true;
			}
			if(DEBUG) { throw new Error("unsubscribe of unregistered event: " + name); }
			return false;
		},
		//emits an event, with variable number of arguments
		//returns the number of listeners that was attached.
		emit: function(name) {
			var i, handler, list = this._getEventList(name, false);
			if(!list) { return 0; }
			var args = Array.prototype.slice.call(arguments, 1);
			for(i = 0; i < list.length; ++i) {
				handler = list[i];
				handler.f.apply(handler.obj, args);
				//we do not need to consider changes to the list during emits, since detach will reallocate the listener array.
			}
			return list.length;
		},
		setInterval: function(cb, ms) {
			//unfortunately ie8 does not support setInterval.apply, so this looks a bit silly...
			var that = this, args = Array.prototype.slice.call(arguments, 1);
			return setInterval(function() { cb.apply(that, args); }, ms);
		},
		clearInterval: function(id) { return clearInterval(id); },
		setTimeout: function(cb, ms) {
			//unfortunately ie8 does not support setTimeout.apply, so this looks a bit silly...
			var that = this, args = Array.prototype.slice.call(arguments, 1);
			var id = setTimeout(function() { delete that._registeredTimeouts[id]; cb.apply(that, args); }, ms);
			(this._registeredTimeouts = this._registeredTimeouts || {})[id] = true;
			return id;
		},
		clearTimeout: function(id) {
			if(this._registeredTimeouts) { delete this._registeredTimeouts[id]; }
			return clearTimeout(id);
		},
		clearTimeouts: function() {
			var timeouts = this._registeredTimeouts;
			if(!timeouts) { return; }
			_.each(timeouts, function(val, key) {
				clearTimeout(key);
				delete timeouts[key];
			});
		},
		eventOn: function(method) {
			_(this._events).forEach(function(info) {
				if(method === info.rawMethod) {
					if(DEBUG) { if(!info.disabled) { throw new Error("event is already on!"); } }
					if(DEBUG) { if(info.global && !this.isInDOM()) { throw new Error("View is not in DOM!"); } }
					if(info.global) { $(info.sel).on(info.name, info.method); } else { this.el.on(info.name, info.sel, info.method); }
					info.disabled = false;
				}
			}, this);
		},
		off: function(method) {
			_(this._events).forEach(function(info) {
				if(method === info.rawMethod) {
					if(DEBUG) { if(info.disabled) { throw new Error("event is already off!"); } }
					if(DEBUG) { if(info.global && !this.isInDOM()) { throw new Error("View is not in DOM!"); } }
					if(info.global) { $(info.sel).off(info.name, info.method); } else { this.el.off(info.name, info.sel, info.method); }
					info.disabled = true;
				}
			}, this);
		},
		//utility function to get an array of all overriden definitions for a specific property.
		getPropertyHierarchy: function(prop) {
			var obj = this, lists = [];
			while (obj) {
				if (obj[prop]) { lists.unshift(obj[prop]); }
				obj = obj.__protoChain;
			}
			return lists;
		},
		//only used by View and Controller.
		_delegateEvents: function (events) {
			this._events = this._events || [];
			_.each(events, function (val, key) {
				var info = { name: key, sel: "", rawMethod: val };
				if (key.charAt(0) === "!") {
					key = key.substr(1);
					info.disabled = true;
				}
				var splitidx = key.indexOf(" ");
				if (splitidx >= 0) {
					info.name = key.substr(0, splitidx);
					info.sel = key.substr(splitidx + 1);
				}

				if (info.name == "transitionend") {
					var el = document.createElement('dummy');

					var transEndEventNames = {
						'WebkitTransition': 'webkitTransitionEnd',
						'MozTransition': 'transitionend',
						'OTransition': 'oTransitionEnd otransitionend',
						'transition': 'transitionend'
					};

					for (var name in transEndEventNames) {
						if (el.style[name] !== undefined) {
							info.name = transEndEventNames[name];
							break;
						}
					}
				}

				if (info.name == "animationend") {
					var el = document.createElement('dummy');

					var animEndEventNames = {
						'WebkitAnimation': 'webkitAnimationEnd',
						'MozAnimation': 'animationend',
						'OAnimation': 'oAnimationEnd oanimationend',
						'animation': 'animationend'
					};

					for (var name in animEndEventNames) {
						if (el.style[name] !== undefined) {
							info.name = animEndEventNames[name];
							break;
						}
					}
				}

				var unboundMethod = (typeof val === "string" ? this[val] : val);
				if (DEBUG) { if (!unboundMethod) { throw new Error("Method not found: " + val); } }
				info.method = _.bind(unboundMethod, this);
				if (info.sel === "window" || info.sel === "document" || info.sel === "body") {
					if (info.sel === "document") { info.sel = document; }
					if (info.sel === "window") { info.sel = window; }
					info.global = true;
				} else if (!info.disabled) {
					this.el.on(info.name, info.sel || null, info.method);
				}
				this._events.push(info);
			}, this);
		}
	});

	var ASHtml = as.defineClass(as.Base, {
		//will return undefined if it couldn't turn the param into a single DOM element.
		text: function(text) {
			return $(document.createTextNode(text));
		},
		build: function(outer) {
			var i, j, child, arg, elem = this._makeElement(outer);
			for(i = 1; i < arguments.length; ++i) {
				arg = arguments[i];
				child = this._makeElement(arg);
				if(child) {
					elem.appendChild(child);
				} else {
					if(typeof arg.length === "number") { //asq object or array?
						for(j = 0; j < arg.length; ++j) {
							elem.appendChild(arg[j]);
						}
					} else {
						throw new Error("Unsupported argument.");
					}
				}
			}
			return $(elem);
		},
		html: function(html) {
			return $.createHTML ? $.createHTML(html) : $(html); //so it works with either asq or jQuery.
		},
		_makeElement: function(v) {
			var elem, name, classes;
			if(typeof v === "string") {
				classes = v.split(".");
				name = classes.shift() || "div";
				if(DEBUG) {
					_(classes).forEach(function(c) { if(/[^\w\-]/.test(c)) { throw new Error("class names can only contain letters, numbers and dashes"); } });
					if(/\W/.test(name)) { throw new Error("tag names must only contain letters and numbers"); }
				}
				elem = document.createElement(name);
				if(classes.length > 0) { elem.setAttribute("class", classes.join(" ")); }
			} else if(v.nodeType !== undefined) { //dom element
				elem = v;
			} else if(v instanceof $ && v.length === 1) {
				elem = v[0];
			}
			return elem;
		}
	});

	////////////////////////////////////////////////////////////////////////////////////////////////////

	as.View = as.defineClass(as.Base, {
		sharedProperties: ['tagName', 'events', 'shortcuts', 'isModal'],
		tagName: 'div',
		createElement: function() { return as.html.build(this.tagName); },
		con: function() {
			var i;

			this.el = this.createElement.apply(this, arguments);

			//recursively delegate all events defined for this view...
			_(this.getPropertyHierarchy('events')).each(this._delegateEvents, this);

			for(i = 0; i < as.View.viewPlugins.length; ++i) {
				as.View.viewPlugins[i].onClientConstructor(this);
			}
		},
		setController: function(ctrl) {
			if(typeof ctrl === "object" && ctrl instanceof as.Controller) {
				this._controller = ctrl;
			} else {
				throw "invalid controller object";
			}
			this._controller.setView(this);
		},
		getController: function() { return this._controller; },
		show: function() {
			var i;
			for(i = 0; i < as.View.viewPlugins.length; ++i) {
				as.View.viewPlugins[i].onClientShow(this);
			}

			if(this._events) {
				_(this._events).forEach(function(a) {
					if(a.global && !a.disabled) { $(a.sel).on(a.name, a.method); }
				});
			}
			if(this._controller) { this._controller.enable(); }
		},
		remove: function(detach) {
			var i;

			if (detach && this.el[0].parentNode) { this.el.detach(); } //only if element has a parent
			else if (!detach && this.el[0].parentNode) { this.el.remove(); }

			for(i = 0; i < as.View.viewPlugins.length; ++i) {
				as.View.viewPlugins[i].onClientRemove(this);
			}
			if(this._events) {
				_(this._events).forEach(function(a) {
					if(a.global && !a.disabled) { $(a.sel).off(a.name, a.method); }
				});
			}
			if(this._controller) { this._controller.disable(); }
		},
		isInDOM: function() { return as.$.contains(document.body, this.el[0]); },
		$: function(sel) { return this.el.find(sel); }
	}, {
		viewPlugins: [],
		installPlugin: function(p) {
			this.viewPlugins.push(p);
		}
	});

	if(DEBUG) {
		as.View.installPlugin({
			onClientConstructor: function(v) { v.debugIsShown = false; },
			onClientShow: function (v) { if (v.debugIsShown) { console.log("warning: view already shown", v.el); } v.debugIsShown = true; },
			onClientRemove: function(v) { if(!v.debugIsShown) { console.log("warning: view already hidden", v.el); } v.debugIsShown = false; }
		});
	}

	as.Controller = as.defineClass(as.Base, {
		sharedProperties: ['events', 'shortcuts', 'isModal'],
		con: function() {
			var i;
			for(i = 0; i < as.Controller.controllerPlugins.length; ++i) {
				as.Controller.controllerPlugins[i].onClientConstructor(this);
			}
		},
		enable: function() {
			var i;
			for(i = 0; i < as.Controller.controllerPlugins.length; ++i) {
				as.Controller.controllerPlugins[i].onClientShow(this);
			}
			if(this._events) {
				_(this._events).each(function(a) {
					if(a.global && !a.disabled) { $(a.sel).on(a.name, a.method); }
				});
			}
		},
		disable: function() {
			var i;
			for(i = 0; i < as.Controller.controllerPlugins.length; ++i) {
				as.Controller.controllerPlugins[i].onClientRemove(this);
			}
			if(this._events) {
				_(this._events).each(function(a) {
					if(a.global && !a.disabled) { $(a.sel).off(a.name, a.method); }
				});
			}
		},
		//this function should only be called once, associating the controller with a view.
		//normally it will be called form a view's setController() function.
		//v can be null, in which case the controller will work without a view.
		//controllers without views can only have global events, and must be manually enabled by calling enable().
		setView: function(v) {
			if(this.view !== undefined) { return; } //so we don't rebind events etc.

			this.view = v || null;
			this.el = v && v.el;

			//recursively delegate all events defined for this controller...
			_(this.getPropertyHierarchy('events')).each(this._delegateEvents, this);
		},
		$: function(sel) { return this.el.find(sel); }
	}, {
		controllerPlugins: [],
		installPlugin: function(p) {
			this.controllerPlugins.push(p);
		}
	});

	as.ContainerView = as.defineClass(as.View, {
		show: function() {
			this._shown = true;
			if(this.children) {
				_(this.children).each(function(v) { v.show(); });
			}
			as.ContainerView._super.show.apply(this, arguments);
		},
		remove: function() {
			this._shown = false;
			if(this.children) {
				_(this.children).each(function(v) { v.remove(); });
			}
			as.ContainerView._super.remove.apply(this, arguments);
		},
		addChild: function(v, appendTo) {
			if(DEBUG) { if(!(v instanceof as.View)) { throw new Error("not a view"); } if(!(appendTo === undefined || (appendTo instanceof $))) { throw new Error("wrong type for appendTo"); } }
			appendTo = appendTo || this.el;
			(this.children = this.children || []).push(v);
			appendTo.append(v.el);
			if(this._shown) { v.show(); }
			return v;
		},
		deleteChild: function(v) {
			var idx = this.children.indexOf(v);
			if(DEBUG) { if(idx < 0) { throw new Error("unknown child"); } }
			if(idx >= 0) {
				if(this._shown) {
					this.children[idx].remove(true);
				} else {
					this.children[idx].el.detach();
				}
				this.children.splice(idx, 1);
			}
			return v;
		},
		deleteChildren: function() {
			if(!this.children) { return; }
			_(this.children).forEach(function(c) {
				if(this._shown) {
					c.remove(true);
				} else {
					c.el.detach();
				}
			}, this);
			this.children.length = 0;
		},
		isShown: function() { return this._shown; },
		getChildren: function() { return this.children || []; },
		onElementResized: function(justShown) {
			_(this.children).forEach(function(c) { if(c.onElementResized) { c.onElementResized(justShown); } });
		}
	});

	as.SVG = as.defineClass(as.View, {
		sharedProperties: ["xlinkAttrs"],
		xlinkAttrs: { "href": "http://www.w3.org/1999/xlink" },
		createElement: function(classes, left, top, w, h) {
			var elem = as.html.html('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="' + classes + '"></svg>');
			elem[0].setAttributeNS(null, "viewBox", left + " " + top + " " + w + " " + h);
			return elem;
		},
		toSVGCoords: function(x, y) {
			var uupos = this.el[0].createSVGPoint();
			uupos.x = x;
			uupos.y = y;
			var ctm = this.el[0].getScreenCTM().inverse();
			if(ctm) {
				uupos = uupos.matrixTransform(ctm);
			}
			return uupos;
		},
		bottom: function() { return $(this.el[0].childNodes[0]); },
		top: function() { return $(this.el[0].childNodes[this.el[0].childNodes.length - 1]); },
		insertAt: function(elem, idx) {
			if(idx < this.el[0].childNodes.length) {
				elem.insertBefore($(this.el[0].childNodes[idx]));
			} else if(idx === this.el[0].childNodes.length) {
				this.el.append(elem);
			} else {
				throw new Error("invalid index");
			}
			return elem;
		},
		_create: function(kind) {
			var i, elem = document.createElementNS("http://www.w3.org/2000/svg", kind);
			for(i = 1; i < arguments.length; i += 2) {
				elem.setAttributeNS(null, arguments[i], arguments[i + 1]);
			}
			this.el[0].appendChild(elem);
			return elem;
		},
		add: function(arr) {
			arr = Array.isArray(arr) ? arr : [arr];
			var i, key, elem, elems = $();
			for(i = 0; i < arr.length; ++i) {
				elem = document.createElementNS("http://www.w3.org/2000/svg", arr[i].type);
				this.setAttributes(elem, arr[i]);
				elems.add(elem);
				this.el[0].appendChild(elem);
			}
			return elems;
		},
		//use instead of $.attr when unsure about namespace...
		attr: function(elem, key, val) {
			if(elem.nodeType === undefined) {
				elem.forEach(function(e) { this.attr(e, key, val); }, this);
			} else {
				if(val === undefined) {
					return elem.getAttributeNS(this.xlinkAttrs[key] || null, key);
				}
				elem.setAttributeNS(this.xlinkAttrs[key] || null, key, val);
				if(key === "_") {
					elem.textContent = val;
				}
			}
		},
		setAttributes: function(elem, attrs) {
			var key;
			if(elem.nodeName !== attrs.type && (elem.length !== 1 || elem[0].type !== attrs.type)) {
				throw new Error("unexpected element type");
			}
			for(key in attrs) {
				if(!attrs.hasOwnProperty(key) || key === "type") { continue; }
				this.attr(elem, key, attrs[key]);
			}
			return elem;
		},
		rect: function(x, y, width, height) {
			return $(this._create("rect", "x", x, "y", y, "width", width, "height", height));
		},
		circle: function(cx, cy, r) {
			return $(this._create("circle", "cx", cx, "cy", cy, "r", r));
		},
		line: function(x1, x2, y1, y2) {
			return $(this._create("line", "x1", x1, "y1", y1, "x2", x2, "y2", y2));
		},
		polyline: function(a) {
			if(typeof a === "number") { a = arguments; }
			return $(this._create("polyline", "points", Array.prototype.join.call(a, " ")));
		},
		polygon: function(a) {
			if(typeof a === "number") { a = arguments; }
			return $(this._create("polygon", "points", Array.prototype.join.call(a, " ")));
		},
		path: function(a) {
			if(typeof a === "number") { a = arguments; }
			return $(this._create("path", "points", Array.prototype.join.call(a, " ")));
		},
		empty: function() {
			this.el.empty();
		}
	});

	as.html = new ASHtml();
	freeze(as);
	return as;
});

