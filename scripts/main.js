define("Main", ["$", "_", "as", "Utils", "Accordion"], function ($, _, as, Utils, Accordion) {
	"use strict";

	var Main = as.defineClass(as.View, {
		events: {
			// We define the events and which functions are called when the events are fired
			"click .mobile-menu-toggle": "toggleMobileMenu",
			"click .navigation-background": "toggleMobileMenu",
			"click .popup-toggle": "openPopup",
			"click .popup-background": "closePopup",
			"change .input-field": "validateInput",
			"change .textarea-field": "validateTextarea",
			"click .global-navigation-item": "scrollToSectionAndCloseNavigation",
			"click .action-button": "scrollToSection" 
		},
		createElement: function () { return $("body"); },
		con: function () {
			// We difeine the main elements and variables we use more than once, so that we only traverse the DOM once and then we remember their location.
			this.mobileMenu = this.$(".navigation-wrapper");
			this.mobileMenuBackground = this.$(".navigation-background");
			
			$('.slider').sss();
		},
		toggleMobileMenu: function(e) {
			this.mobileMenu.toggleClass("active");
			this.mobileMenuBackground.toggleClass("active");
		},
		openPopup: function(e) {
			var popupBox = $(e.currentTarget).attr("data-popup");
			if (this.$(popupBox)) {
				this.$(popupBox).addClass("is-active");
			}
		},
		closePopup: function(e) {
			$(e.currentTarget).closest(".popup").removeClass("is-active");
		},
		validateInput: function (e) {
			var currentField = $(e.currentTarget);
			if (!currentField[0].validity.valid) {
				currentField.closest(".form-item").addClass("validation-error");
			} else {
				currentField.closest(".form-item").removeClass("validation-error");
			}
		},
		validateTextarea: function(e) {
			var currentField = $(e.currentTarget);
			if (!currentField.val().trim().length > 0) {
				currentField.closest(".form-item").addClass("validation-error");
			} else {
				currentField.closest(".form-item").removeClass("validation-error");
			}
		},
		scrollToSectionAndCloseNavigation: function(e) {
			this.scrollToSection(e);
			this.toggleMobileMenu();
		},
		scrollToSection: function(e) {
			e.preventDefault();
			var target = $(e.currentTarget).attr("href");
			$("html, body").animate({ scrollTop: $(target).offset().top - 80 }, 600);
		}
	});

	$(function () {
		var main = new Main("body");
		main.show();
	});
});