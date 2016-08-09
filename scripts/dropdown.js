define("Dropdown", ["as", "$", "Utils"],
function (as, $, Utils) {
	"use strict";

	var Dropdown = as.defineClass(as.View, {
		events: {
			"click": "modalBackgroundClick",
			"click .dropdown-selection": "dropdownSelection",
			"resize window": "onDimChange",
			"scroll window": "onDimChange",
			"keyup window": "onKeyup",
			"mouseover .dropdown-scroll-down": "scrollDown",
			"mouseover .dropdown-scroll-up": "scrollUp",
			"mouseout .dropdown-scroll-down": "stopScrolling",
			"mouseout .dropdown-scroll-up": "stopScrolling"
		},
		createElement: function () {
			return as.html.build(".modal-background", ".dropdown-panel");
		},
		/**
        handler: implements the following interface: {
            onDropdownSelect: optional function(view, idx, event) on selection of an item, item has to have the "dropdown-selection" class
            onDropdownToggled: optional function(view, state) on show/hide,
            onDropdownCanceled: optional function(view, state) on background click etc
        }
        options:
        {
            watchedElem: element which is watched,
            content: content of the dropdown,
            autoWidth: boolean // if true, width will be updated to watchedElem's width
            align: "left" or "right" - side of the watched element which should be the content aligned to, "left" is default
            noAutoHide: boolean // if true, dropdown will not be hidden after selection
            scroll: boolean // if false, scrolling is disabled, default is false // TODO
			cssClasses: extra css classes that will be applied to dropdown
        } */
		con: function (handler, options) {
			this.dropdownContent = this.$(".dropdown-panel");
			if (options.cssClasses) { this.dropdownContent.addClass(options.cssClasses); }
			this.handler = handler;
			this.options = options || {};
			if (options.content) { this.dropdownContent.append(options.content); }
			this.bottomScroller = as.html.build(".dropdown-scroll-down", as.html.build("span.icon.icon-scroll-down"));
			this.upperScroller = as.html.build(".dropdown-scroll-up", as.html.build("span.icon.icon-scroll-up"));
			if (this.options.scroll) { this.dropdownContent.prepend(this.upperScroller).append(this.bottomScroller); }
			this.interval = undefined;
			this.scrollDir = undefined;
			this.scrollingInterval = undefined;
			this.scrollDelay = 16;
			this.windowHeight = window.innerHeight;
		},
		show: function () {
			this.options.content.show();
			var overlay = $("body").find(".overlay");
			if (!overlay.length) {
				overlay = as.html.build(".overlay");
				$("body").append(overlay);
			}
			overlay.append(this.el);
			// Views.main.overlay.append(this.el);
			this.interval = this.setInterval(this.updatePosition, 20);
			this.updatePosition();
			this.preScroll();
			this.onDimChange();
			if (this.handler.onDropdownToggled) { this.handler.onDropdownToggled(this, true); }
			Dropdown._super.show.apply(this, arguments);
		},
		remove: function () {
			Dropdown._super.remove.apply(this, arguments);
			this.clearInterval(this.interval);
			if (this.handler.onDropdownToggled) { this.handler.onDropdownToggled(this, false); }
		},
		toggle: function (onoff) {
			if (this.isShown() && !onoff) {
				//Utils.anim(this.el, "dropdown-animate-remove", function () { fails the first time selects. disabled for now.
					this.remove(true);
				//}, this);
			} else if (onoff === undefined || onoff !== false) {
				this.show();
			}
		},
		isShown: function () {
			return this.el.is(":visible");
		},
		onKeyup: function (e) {
			if (e.which === 27) {
				if (this.handler.onDropdownCanceled) { this.handler.onDropdownCanceled(this); }
				this.remove(true);
			}
		},
		updatePosition: function () {
			var dim = this.options.watchedElem[0].getBoundingClientRect();
			if (!dim.height || !dim.width) {
				dim = $.extend({}, dim);
				dim.height = this.options.watchedElem.outerHeight();
				dim.width = this.options.watchedElem.outerWidth();
			}
			if (this.reversePosition(dim)) {
				this.dropdownContent.css({ bottom: this.windowHeight - dim.top + "px", top: "auto" });
			} else {
				if (this.options.align === "outerRight") {
					this.dropdownContent.css({ top: dim.top + "px", bottom: "auto" });
				} else {
					this.dropdownContent.css({ top: dim.top + dim.height + "px", bottom: "auto" });
				}
			}
			if (this.options.autoWidth) { this.dropdownContent.css({ width: dim.width + "px" }); }
			if (this.options.align === "right") {
				this.dropdownContent.css({ left: dim.right - this.dropdownContent.width() + "px" });
			} else if (this.options.align === "outerRight") {
				this.dropdownContent.css({ left: dim.right + "px" });
			} else {
				this.dropdownContent.css({ left: dim.left + "px" });
			}
		},
		reversePosition: function (dim) {
			if (!dim) {
				dim = this.options.watchedElem[0].getBoundingClientRect();
			}
			return this.windowHeight - dim.bottom < 220;
		},
		setOptions: function (options) {
			var key;
			for (key in options) {
				this.options[key] = options[key];
			}
		},
		modalBackgroundClick: function (e) {
			if (!as.$(e.target).hasClass("modal-background")) { return; }
			if (this.handler.onDropdownCanceled) { this.handler.onDropdownCanceled(this); }
			this.remove(true);
		},
		dropdownSelection: function (e) {
			var idx = this.$(e.currentTarget).attr("data-idx");
			if (this.handler.onDropdownSelect) { this.handler.onDropdownSelect(this, idx, e); }
			if (!this.options.noAutoHide) { this.toggle(false); }
		},
		preScroll: function () {
			if (!this.$(".dropdown-selection.selected").length || !this.options.scroll) { return; }
			var selected = this.$(".dropdown-selection.selected");
			this.dropdownContent[0].scrollTop = selected[0].offsetTop - 30;
		},
		onDimChange: function () {
			if (!this.isShown()) { return; }
			var el = this.dropdownContent;
			var windowHeight = this.windowHeight = window.innerHeight;
			var dim = el[0].getBoundingClientRect();
			var maxHeight = this.reversePosition() ? windowHeight - (windowHeight - dim.bottom) - 50 : windowHeight - dim.top - 50;
			el.css({ maxHeight: maxHeight });
			this.toggleScrollAreas(el);
		},
		toggleScrollAreas: function (el) {
			if (!this.options.scroll) { return; }
			var maxScroll = el[0].scrollHeight - el[0].clientHeight;
			var scrollTop = el[0].scrollTop;
			this.bottomScroller.toggleClass("active", maxScroll - scrollTop > 3).css({ bottom: -scrollTop });
			this.upperScroller.toggleClass("active", scrollTop > 3).css({ top: scrollTop });
		},
		scrollDown: function (e) {
			this.scrollDir = "down";
			this.scrollingInterval = this.setInterval(this.scrolling, this.scrollDelay);
		},
		scrollUp: function (e) {
			this.scrollDir = "up";
			this.scrollingInterval = this.setInterval(this.scrolling, this.scrollDelay);
		},
		resetScrollOffset: function () { //called from niceform/combobox
			this.dropdownContent.scrollTop = 0;
		},
		scrolling: function () {
			var el = this.dropdownContent;
			var distance = this.scrollDir === "down" ? 8 : -8;
			el[0].scrollTop = el[0].scrollTop + distance;
			this.toggleScrollAreas(el);
		},
		stopScrolling: function () {
			clearInterval(this.scrollingInterval);
		}
	});

	return Dropdown;
});