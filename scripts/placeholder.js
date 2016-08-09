define("Placeholder", ["$", "_", "as"], function ($, _, as) {
	"use strict";

	var Placeholder = as.defineClass(as.View, {
		events: {
			"keyup": "update",
			"blur": "update"
		},
		createElement: function (el) { return el; },
		con: function () {
			if (!this.el.attr("data-placeholder") && !this.el.attr("placeholder")) { return; }
			if(this.el.attr("placeholder")) {
				this.el.attr("data-placeholder", this.el.attr("placeholder"));
				this.el.removeAttr("placeholder");
			}
			this.placeholder = as.html.build(".placeholder-replacement", as.html.text(this.el.attr("data-placeholder")));
			this.placeholder.addClass(this.el.attr("data-placeholder-class") || this.el[0].className);
			this.placeholder.insertAfter(this.el);
			this.placeholder.on("click", _.bind(this.onReplacementClick, this));

			this.interval = this.setInterval(this.updatePosition, 100);
			this.updatePosition();
		},
		updatePosition: function () {
			var dim = this.el[0].getBoundingClientRect();
			if (!dim.height || !dim.width) {
				dim = $.extend({}, dim);
				dim.height = this.el.outerHeight();
				dim.width = this.el.outerWidth();
			}
			this.placeholder.css({ left: dim.left, top: dim.top + $(window).scrollTop(), width: dim.width, height: dim.height });
		},
		update: function () {
			if (!this.placeholder) { return; }
			if (this.el.val() !== "" || this.el.text() !== "") {
				this.placeholder.hide();
				this.clearInterval(this.interval);
			} else {
				this.placeholder.show();
				this.interval = this.setInterval(this.updatePosition, 100);
			}
		},
		set: function (newPlaceholder) {
			if (this.placeholder) {
				this.placeholder.text(newPlaceholder);
			}
		},
		onReplacementClick: function () {
			this.el[0].focus();
		}
	});

	return Placeholder;

});