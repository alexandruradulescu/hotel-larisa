define("MonthPicker", ["as", "$", "Dropdown", "_", "Utils"], function (as, $, Dropdown,  _, Utils) {
	"use strict";

	var shortMonthNames = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
	var fullMonthNames = ["Januar", "Februar", "Marts", "April", "Maj", "Juni", "Juli", "August", "September", "Oktober", "November", "December"];

	var PickerPopup = as.defineClass(as.View, {
		events: {
			"click .monthpicker-month": "monthClicked",
			"keypress .monthpicker-month": "monthKeypress",
			"click .monthpicker-next": "nextClicked",
			"click .monthpicker-prev": "prevClicked",
			"keypress .monthpicker-next": "nextKeypress",
			"keypress .monthpicker-prev": "prevKeypress"
		},
		createElement: function() { return as.html.build(".monthpicker-popup"); },
		con: function(dateString, handler, options) {
			this.handler = handler;
			this.options = options || {};
			this.selectedElement = null;
			this.setDate(dateString);
		},
		setDate: function (dateString) {
			this.selectedDate = Utils.getDateFromISOString(dateString);
			this.displayYear = this.selectedDate.getFullYear();
			this.buildCalendar();
		},
		buildCalendar: function() {
			var header = as.html.build(".monthpicker-header", as.html.text(this.displayYear), as.html.build(".monthpicker-navigation.monthpicker-prev", "span.icon.icon-arrow-prev").attr("tabindex", 0), as.html.build(".monthpicker-navigation.monthpicker-next", "span.icon.icon-arrow-next").attr("tabindex", 0));
			var monthsElem = as.html.build(".monthpicker-months");
			this.selectedElement = null;

			for (var m = 0; m < 12; ++m) {
				var el = as.html.build("a.monthpicker-month", as.html.text(this.options.monthNames[m])).attr("data-date", this.displayYear + "-" + (m+1) + "-1").attr("tabindex", 0);
				var tooSoon = (this.options.min && (this.options.min.getFullYear() > this.displayYear || (this.options.min.getFullYear() == this.displayYear && this.options.min.getMonth() > m)));
				var tooLate = (this.options.max && (this.options.max.getFullYear() < this.displayYear || (this.options.max.getFullYear() == this.displayYear && this.options.max.getMonth() < m)));
				if (tooSoon || tooLate) {
					el.addClass("disabled");
				} else if (this.selectedDate.getFullYear() === this.displayYear && this.selectedDate.getMonth() === m) {
					el.addClass("selected");
					this.selectedElement = el;
				}
				monthsElem.append(el);
			}

			if (this.options.min && this.options.min.getFullYear() >= this.displayYear) {
				header.find(".monthpicker-prev").addClass("hidden");
			}
			if (this.options.max && this.options.max.getFullYear() <= this.displayYear) {
				header.find(".monthpicker-next").addClass("hidden");
			}
			
			this.el.html(header).append(monthsElem);
		},
		takeFocus: function () {
			if (this.selectedElement) { this.selectedElement.focus(); return true; }
			return false;
		},
		monthClicked: function (e) {
			var monthElement = $(e.currentTarget);
			if (monthElement.hasClass("disabled")) { return; }
			this.selectDate(Utils.getDateFromISOString(monthElement.attr("data-date")));
		},
		monthKeypress: function(e) {
			if(e.which === 13) { this.monthClicked(e); }
		},
		selectDate: function(date) {
			this.$(".monthpicker-month").removeClass("selected");
			this.$(".monthpicker-month[data-date='"+ date.getFullYear() + "-" + (date.getMonth()+1) + "-1']").addClass("selected");
			this.handler.setDate(date);
		},
		nextClicked: function (e) {
			$(e.currentTarget).removeClass("hidden");
			++this.displayYear;
			this.buildCalendar();
		},
		prevClicked: function (e) {
			$(e.currentTarget).removeClass("hidden");
			--this.displayYear;
			this.buildCalendar();
		},
		nextKeypress: function (e) {
			if (e.which === 13) {
				this.nextClicked(e);
				this.$(".monthpicker-month").not(".disabled").first().focus();
			}
		},
		prevKeypress: function(e) {
			if (e.which === 13) {
				this.prevClicked(e);
				this.$(".monthpicker-month").not(".disabled").first().focus();
			}
		}
	});

	/*
	options: {
		selectedDay: string or Date object
		monthNames: []; names of months
		date: DateTime
		min: optional Date
		max: optional Date
	}
	*/
	var MonthPicker = as.defineClass(as.View, {
		events: {
			"click": "toggle",
			"keydown": "onKeyDown",
			"blur": "onBlur"
		},
		createElement: function (elem) { return elem; },
		con: function (elem, handler, options) {
			this.options = options || {};
			this.picker = null;
			this.dropdown = null;
			this.handler = handler || {};
			this.selectedDate = Utils.getDateFromISOString(this.options.date || new Date());
			this.options.monthNames = this.options.monthNames || shortMonthNames;
			this.options.fullMonthNames = this.options.fullMonthNames || fullMonthNames;

			if (!this.el.attr("tabindex")) { this.el.attr("tabindex", 0); }

			this.updateLabel();
		},
		//if onoff is undefined we simply switch state.
		toggle: function(onoff) {
			if (onoff === undefined) { onoff = this.dropdown ? !this.dropdown.isShown() : true; }
			if (!onoff && !this.picker) { return; } //no need to create picker in this scenario.
			if(!this.picker && !this.dropdown) {
				this.picker = new PickerPopup(this.selectedDate, this, this.options);
				var align = this.el.attr("data-month-picker-align") || "below";
				var relativeAncestorIndex = this.el.attr("data-date-picker-align-to-ancestor-level");
				relativeAncestorIndex = (relativeAncestorIndex === undefined) ? 2 : parseInt(relativeAncestorIndex);
				var relativeTo = this.el.parents().add(this.el).eq(-1 - relativeAncestorIndex); //add() function retardedly sorts the elements, so we have to use negative indices, starting from -1.
				this.dropdown = new Dropdown(this, { watchedElem: relativeTo, content: this.picker.el, align: align, cssClasses: this.options.cssClasses });
			}
			this.dropdown.toggle(onoff);
			if (this.dropdown.isShown()) {
				this.picker.setDate(this.selectedDate); //resets picker, in case date or limits changed etc.
				if (!this.picker.takeFocus()) { this.el.focus(); }
			} else {
				if (this.handler.onMonthPickerClosed) { this.handler.onMonthPickerClosed(this); }
				this.el.focus();
			}
		},
		takeFocus: function() {
			this.el.focus();
		},
		setDate: function (date) {
			this.selectedDate = Utils.getDateFromISOString(date || new Date());
			this.updateLabel();
			this.toggle(false);
			this.el.trigger("monthchanged", this);
		},
		updateLabel: function () {
			this.el.html(this.options.fullMonthNames[this.selectedDate.getMonth()] + " " + this.selectedDate.getFullYear());
		},
		onKeyDown: function(e) {
			if(e.keyCode === 9) {
				this.toggle(false);
			} else if (e.keyCode === 13) {
				//will not blur, and can toggle dropdown either on or off
				this.toggle();
				e.preventDefault(); //prevent submit if inside form
			}
		},
		onBlur: function(e) {
		},
		getDate: function() {
			return this.el.val();
		}
	});

	return MonthPicker;
});