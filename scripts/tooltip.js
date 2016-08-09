define("Tooltip", ["$", "_", "as"], function ($, _, as) {
	"use strict";

	var Tooltip = as.defineClass(as.View, {
		events: {
			"mouseover": "mouseOverMove",
			"mousemove": "mouseOverMove",
			"mouseleave": "removeTooltip",
			"click": "removeTooltip"
		},
		createElement: function (el) { return el; },
		con: function() {
			this.tooltip = null;
			this.el.attr("data-tooltip", "1");
			if (this.el.attr("title")) {
				this.el.attr("data-title", this.el.attr("title"));
				this.el.attr("title", "");
			}
		},
		mouseOverMove: function (e) {
			this.clearTimeouts();
			this.mouseEvent = e;
			this.timeout = this.setTimeout(this.showTooltip, 400, this);
			e.stopPropagation();
		},
		showTooltip: function (e) {
			if (!this.tooltip && document.body.contains(this.el[0])) {
				$(".tooltip-box").remove();
				var e = this.mouseEvent,
					left = this.mouseEvent.pageX + 15;
				this.tooltip = as.html.build(".tooltip-box");
				this.tooltip.html(this.el.attr("data-title"));
				$("body").append(this.tooltip);
				this.tooltip.css({
					left: (left + this.tooltip.width() + this.el.width() > $(window).width() ? left - 15 - this.tooltip.width()  : left) + "px",
					top: this.mouseEvent.pageY + 15 + "px"
				});
			}
		},
		removeTooltip: function () {
			this.clearTimeouts();
			if (this.tooltip && this.tooltip.length) {
				this.tooltip.detach();
				this.tooltip = null;
			}
		}
	}, {
		init: function () {
			_($(".tooltip")).each(function (el) {
				el = $(el);
				if (!el.attr("data-tooltip") && el.attr("title")) {
					new Tooltip($(el));
				}
			});
		}
	});

	$(function () {
		Tooltip.init();
	});

	return Tooltip;

});