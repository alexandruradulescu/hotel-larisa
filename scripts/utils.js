define("Utils", ["as", "_"], function(as, _) {
	var Utils = as.defineClass(as.Base, {
		//no non-static members.
	}, {
		getCookie: function(name)  {
			var nameEQ = name + "=";
			var ca = document.cookie.split(';');
			for(var i=0;i < ca.length;i++) {
				var c = ca[i];
				while (c.charAt(0)==' ') c = c.substring(1,c.length);
				if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
			}
			return null;
		},
		setCookie: function(name, days, value) {
			if (days) {
				var date = new Date();
				date.setTime(date.getTime()+(days*24*60*60*1000));
				var expires = "; expires="+date.toGMTString();
			} else {
				var expires = "";
			}
			document.cookie = name+"="+value+expires+"; path=/";
		},
		clearCookie: function(name)  {
			el.setCookie(name, -1, "");
		},
		browser: function() {
			return {
				tablet: document.body.clientWidth > 640 && document.body.clientWidth <= 940,
				mobile: document.body.clientWidth <= 640,
				touchDevice: 'ontouchstart' in window // works on most browsers
			};
		},
		updateQueryString: function(key, value, url) {
			var queryStart = url.indexOf("?");
			if (queryStart === -1 && (url.indexOf("http://") === 0 || url.indexOf("https://") === 0)) {
				url = url + "?";
				queryStart = url.length - 1;
			}
			var query = url.substr(queryStart >= 0 ? queryStart + 1 : 0);
			var result = [], parts, found = false, queryList = query.split("&");
			for (var i in queryList) {
				parts = queryList[i].split("=");
				if (parts[0] === key) { parts[1] = value; found = true; }
				if (parts[0] !== "" && parts[1] !== "" && parts[1] !== undefined) { result.push(parts[0] + "=" + parts[1]); }
			}
			if (!found && value !== "" && value !== undefined) {
				result.push(key + "=" + value);
			}

			return url.substr(0, queryStart >= 0 ? queryStart + 1 : 0) + result.join("&");
		},
		getParameterByName: function(name, url) {
			/*TODO:Martin*/
			var url = url || window.location.search;
			var name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
			var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
			results = regex.exec(url);
			return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
		},
		queryStringToMap: function (query) {
			query = query || window.location.search;
			if(query.charAt(0) == "?") { query = query.substr(1); }
			return _.reduce(query.split("&"), function (obj, elem) { var parts = elem.split("="); if (parts.length === 2) { obj[parts[0]] = parts[1]; } return obj; }, {});
		},
		mapToQueryString: function (map) {
			var n, arr = [];
			for (n in map) { if (map.hasOwnProperty(n)) { arr.push(n + "=" + map[n]); } }
			return arr.join("&");
		},
		supports: function(prop) {
			var cache = {};
			return (function() {
				prop = prop.toLowerCase();
				if(cache.hasOwnProperty(prop)) { return cache[prop]; }
				var result = false;
				var div = document.createElement('div');
				if(prop in div.style) { result = true; }
				if(!result) {
					var vendors = [ 'Khtml', 'Ms', 'O', 'Moz', 'Webkit' ];
					prop = prop.charAt(0).toUpperCase() + prop.substr(1);
					for(var i = 0; i < vendors.length; ++i) {
						if(vendors[i] + prop in div.style) {
							result = true;
							break;
						}
					}
				}
				cache[prop] = result;
				return result;
			})(prop);
		},
		formatPrice: function(n, numDecimals, decimalSep, thousandsSep) {
			numDecimals = isNaN(numDecimals) ? 0 : Math.abs(numDecimals);
			decimalSep = decimalSep || ','; //if no decimal separator is passed we use the comma (EUROPEAN) as default decimal separator.
			thousandsSep = (typeof thousandsSep === 'undefined') ? '.' : thousandsSep; //if you don't want to use a thousands separator you can pass empty string as thousands_sep value. default is european format.
			var sign = (n < 0) ? '-' : '',

			//extract the absolute value of the integer part of the number and convert to string
			i = parseInt(n = Math.abs(n).toFixed(numDecimals)) + '',
			j = ((j = i.length) > 3) ? j % 3 : 0;

			return sign + (j ? i.substr(0, j) + thousandsSep : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousandsSep) + (numDecimals ? decimalSep + Math.abs(n - i).toFixed(numDecimals).slice(2) : '');
		},
		//convert user-input into a proper number, if possible. tries to parse both european and american format - however, does not work well with more than 2 decimals.
		parseNumberString: function (value) {
			//generate the two possible splits for testing - european and american notation...
			var a = value.split(".");
			var b = value.split(",");

			if ((a.length === 2 && a[1].length < 3) || (a.length === 1 && b.length >= 2 && b[b.length - 1].length === 3)) { //'.' used as decimal separator OR no decimal separator and format is like e.g. "123,456,789" meaning "123456789"
				if (/^[1-9][0-9]{0,2}(\,([0-9]{3}))*$/.test(a[0])) { //if first part has valid thousand sep format...
					a[0] = a[0].split(",").join(""); //remove american thousand seps.
				}
				value = a.join("."); //rejoin a into 'machine' notation
			} else if ((b.length === 2 && b[1].length < 3) || (b.length === 1 && a.length >= 2 && a[a.length - 1].length === 3)) { //',' used as decimal separator OR no decimal separator and format is like e.g. "123.456.789" meaning "123456789"
				if (/^[1-9][0-9]{0,2}(\.([0-9]{3}))*$/.test(b[0])) { //if first part has valid thousand sep format...
					b[0] = b[0].split(".").join(""); //remove european thousand seps.
				}
				value = b.join("."); //rejoin b into 'machine' notation
			}
			//now value is either in 'machine' notation without thousand seps, OR it is invalid...
			if (/^[0-9]+(\.[0-9]+)?$/.test(value)) {
				return parseFloat(value);
			}
			return 0;
		},
		getIOSDateString: function (date) {
			return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
		},
		getDateFromISOString: function (val) {
			if (val instanceof Date) { return val; }
			var parts = val.split("-");
			//Date constructor with string-arg in IE does not support e.g. "2015-1-1" but only eg "2015-01-01", and besides there are never any guarantees in the standard.
			return new Date(parts[0] | 0, (parts[1] | 0)-1, parts[2] | 0);
		},
		addMonths: function (date, n) {
			var ndate = new Date(date);
			ndate.setMonth(ndate.getMonth() + n);
			return ndate;
		},
		templ: (function() {
			var cache = {};
			return function(tag, data) {
				var arg, str = cache[tag];
				if(!str) {
					str = cache[tag] = $(tag).html();
				}
				for(arg in data) {
					str = str.replace(new RegExp("\\{\\{" + arg + "\\}\\}", "g"), data[arg]); //replace all.
				}
				return str;
			}
		})(),
		buildUrl: function(base, search) {
			var a, args = [];
			for(a in search) {
				if(search.hasOwnProperty(a)) {
					args.push(a + "=" + search[a]);
				}
			}
			return base + ((base.indexOf("?") >= 0) ? "&" : "?") + args.join("&");
		},
		getLocationSearchArgument: function(arg) {
			var find = arg + "=";
			var result = _(location.search.substr(1).split("&")).find(function(a) { return a.indexOf(find) === 0; }) || "";
			return result.substr(find.length);
		},
		uniqueNumber: (function() {
			var next = 1;
			return function() {
				return next++;
			}
		})(),
		normalizeAnimationEventName: function(animName) {
			var name, el = document.createElement('dummy'),
				animEndEventNames = {
				'WebkitAnimation': 'webkitAnimationEnd',
				'MozAnimation': 'animationend',
				'OAnimation': 'oAnimationEnd oanimationend',
				'animation': 'animationend'
			};

			for (name in animEndEventNames) {
				if (el.style[name] !== undefined) {
					return animEndEventNames[name];
				}
			}
		},
		anim: function (el, animClass, cb, context) {
			if (el.length !== 1) { throw new Error("you can animate only single element"); }
			if (!this.supports("animation")) {
				if (cb) {
					setTimeout(function () {
						cb.call(context)
					}, 0);
				}
				return;
			}
			if (el[0].dataAnimClassOnEnd) {
				el[0].dataAnimClassOnEnd.call(el[0], { target: el[0], currentTarget: el[0], eventPhase: Event.AT_TARGET, canceled: true });
			}
			var onEnd = _.bind(function (e) {
				if (e.eventPhase !== Event.AT_TARGET) { return; }
				el.off(this.normalizeAnimationEventName("animationEnd"), onEnd);
				el.removeClass(animClass);
				el.dataAnimClassOnEnd = null;
				if (cb) { cb.call(context, e); }
			}, this);
			el.on(this.normalizeAnimationEventName("animationEnd"), onEnd);
			el.addClass(animClass);
			el[0].dataAnimClassOnEnd = onEnd;

			return el;
		},
		//trim is not suported in ie8, so use this function instead.
		trim: function(s) {
			return s.replace(/^[\s\uFEFF]+|[\s\uFEFF]+$/g, '');
		}
	});

	return Utils;
});