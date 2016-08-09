define("Main", ["$", "_", "as", "Utils", "Accordion"], function ($, _, as, Utils, Accordion) {
	"use strict";

	var Main = as.defineClass(as.View, {
		events: {
			// We define the events and which functions are called when the events are fired
			"click .mobile-menu-toggle": "toggleMobileMenu",
			"click .navigation-background": "toggleMobileMenu",
			"keyup .mobile-menu-toggle": "toggleMobileMenu",
			"keyup .navigation-background": "toggleMobileMenu"
		},
		createElement: function () { return $("body"); },
		con: function () {
			// We difeine the main elements and variables we use more than once, so that we only traverse the DOM once and then we remember their location.
			this.mobileMenu = this.$(".navigation-wrapper");
			this.mobileMenuBackground = this.$(".navigation-background");
		},
		toggleMobileMenu: function(e) {
			// Check if the event fired is a click or the "enter" ke
			if ((e.type !== "click") && (!this.isEnterKey(e))) {
				return;
			}
			this.mobileMenu.toggleClass("active");
			this.mobileMenuBackground.toggleClass("active");
		},
		isEnterKey: function(e) {
			var key=e.keyCode || e.which;
			if (key==13){
				return true;
			}
			return false;
		}
	});

	$(function () {
		var main = new Main();
		main.show();
	});
});