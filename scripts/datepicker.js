define("DatePicker", [ "as", "$", "Dropdown", "DateUtils", "_" ], function(as, $, Dropdown, DateUtils, _) {
	"use strict";
	var Picker = as.defineClass(as.View, {
		events: {
			"click .datepicker-day": "dayClicked",
			"click .datepicker-next": "nextClicked",
			"click .datepicker-prev": "prevClicked"
		},
		createElement: function() { return as.html.build(".datepicker"); },
		con: function(dateString, handler, options) {
			this.handler = handler;
			this.options = options || {};
			this.header = null;
			this.daysHeader = null;
			this.selectedDateEl = null;
			this.days = null;
			this.setup();
			this.selectedDate = this.getDate(dateString);
			this.buildCalendar();
		},
		setup: function() {
			this.options.dayNames = this.options.dayNames || ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
			this.options.monthNames = this.options.monthNames || ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
			this.options.weekDayStart = this.options.weekDayStart || 1;
			this.options.dayNameLength = this.options.dayNameLength || 2;
			this.options.dateFormat = this.options.dateFormat || "d-M-y";
		},
		getDate: function(dateString) {
			try {
				var date = DateUtils.getDateFromFormat(dateString, this.options.dateFormat) || new Date().getTime();
				return new Date(date);
			} catch (ex) {
				return new Date();
			}
		},
		buildCalendar: function() {
			var d, date = this.selectedDate;
			var year = date.getFullYear(), month = date.getMonth(), numOfDays = new Date(year, month + 1, 0).getDate();
			var firstDay = new Date(year, month, 1).getDay(), lastDay = new Date(year, month + 1, 0).getDay();
			var prevMonthDays = new Date(year, month, 0).getDate();
			//build header
			this.header = as.html.build(".datepicker-header", as.html.text(this.options.monthNames[month] + " " + year), as.html.build(".datepicker-prev.icon.icon-arrow-prev"), as.html.build(".datepicker-next.icon.icon-arrow-next"));
			//build day names header
			this.daysHeader = as.html.build(".datepicker-day-header");
			d = this.options.weekDayStart;
			while(this.options.dayNames[d]) {
				this.daysHeader.append(as.html.build(".datepicker-day-name", as.html.text(this.options.dayNames[d].substr(0, this.options.dayNameLength))));
				d++;
			}
			for(d = 0; d < this.options.weekDayStart; d++) {
				this.daysHeader.append(as.html.build(".datepicker-day-name", as.html.text(this.options.dayNames[d].substr(0, this.options.dayNameLength))));
			}
			//build days holder and reset days
			this.daysEl = as.html.build(".datepicker-days");
			this.days = [];
			//build days from previous month
			d = prevMonthDays - firstDay + 1 + this.options.weekDayStart;
			if(firstDay === 0 & this.options.weekDayStart > 0) {
				d = prevMonthDays - (7 - this.options.weekDayStart) + 1;
			}
			for(d; d <= prevMonthDays; d++) {
				this.days.push({ date: new Date(year, month-1, d), el: as.html.build(".datepicker-day.previous", as.html.text(d)) });
			}
			//build days from current month
			for(d = 1; d <= numOfDays; d++) {
				var el = as.html.build(".datepicker-day", as.html.text(d));
				if(d === this.selectedDate.getDate() && this.selectedDate.getMonth() === month && this.selectedDate.getFullYear() === year) {
					el.addClass("selected");
					this.selectedDateEl = el;
				}
				this.days.push({ date: new Date(year, month, d), el: el });
			}
			//build days from next month
			for(d = 1; d <= 6 - lastDay + this.options.weekDayStart && 6 - lastDay + this.options.weekDayStart < 7; d++) {
				this.days.push({ date: new Date(year, month+1, d), el: as.html.build(".datepicker-day.next", as.html.text(d)) });
			}
			//append days
			for(d = 0; d < this.days.length; d++) {
				this.daysEl.append(this.days[d].el);
			}
			//append everything to DOM
			this.el.html(this.header).append(this.daysHeader).append(this.daysEl);
		},
		dayClicked: function(e) {
			var d, el = $(e.currentTarget);
			for(d = 0; d < this.days.length; d++) {
				if(this.days[d].el[0] === el[0]) {
					this.selectDate(this.days[d].date, el);
					break;
				}
			}
		},
		selectDate: function(date, el) {
			this.selectedDateEl.removeClass("selected");
			el.addClass("selected");
			this.selectedDateEl = el;
			this.selectedDate = date;
			this.handler.setDate(DateUtils.formatDate(date, this.options.dateFormat));
		},
		nextClicked: function() {
			var year = this.selectedDate.getFullYear(), month = this.selectedDate.getMonth();
			this.selectedDate = new Date(year, month + 1);
			this.buildCalendar(this.selectedDate);
			this.handler.takeFocus();
		},
		prevClicked: function() {
			var year = this.selectedDate.getFullYear(), month = this.selectedDate.getMonth();
			this.selectedDate = new Date(year, month - 1);
			this.buildCalendar(this.selectedDate);
			this.handler.takeFocus();
		}
	});

	/*
	options: {
		selectedDay: string or Date object
		dayNames: []; names of days, starting from sunday
		monthNames: []; names of months
		weekDayStart: int; 0 - 6; 0 = Sunday, 1 = Monday, etc.
		dayNameLength: int; lenght of the day names abbreviation
	}
	*/
	var Datepicker = as.defineClass(as.View, {
		events: {
			"click": "toggle",
			"keydown": "onKeyDown",
			"blur": "onBlur",
			"focus": "onFocus",
		},
		createElement: function(handler, sel) { return sel; },
		con: function(handler, sel, options) {
			sel.attr("data-initialized", "1");
			this.options = options || {};
			this.picker = null;
			this.dropdown = null;
			this.handler = handler || {};

			if(this.el.next().hasClass("icon-date-button")) {
				this.iconButton = this.el.next();
				this.iconButton.on("click", _(this.toggle).bind(this));
			}
		},
		//if onoff is undefined we simply switch state.
		toggle: function(onoff) {
			if (onoff === undefined) { onoff = this.dropdown ? !this.dropdown.isShown() : true; }
			if(!this.picker && !this.dropdown) {
				this.picker = new Picker(this.el.val(), this, this.options);
				var align = this.el.attr("data-date-picker-align") || "outerRight";
				var relativeAncestorIndex = this.el.attr("data-date-picker-align-to-ancestor-level");
				relativeAncestorIndex = (relativeAncestorIndex === undefined) ? 2 : parseInt(relativeAncestorIndex);
				var relativeTo = this.el.parents().add(this.el).eq(-1 - relativeAncestorIndex); //add() function retardedly sorts the elements, so we have to use negative indices, starting from -1.
				this.dropdown = new Dropdown(this, { watchedElem: relativeTo, content: this.picker.el, align: align, cssClasses: this.options.cssClasses });
			}
			this.dropdown.toggle(onoff);
			if(this.dropdown.isShown()) {
				this.el.focus();
			} else {
				if(this.handler.onDatePickerClosed) { this.handler.onDatePickerClosed(this); }
			}
		},
		takeFocus: function() {
			this.el.focus();
		},
		setDate: function(date) {
			this.el.val(date).focus().trigger("change");
			this.toggle(false);
		},
		onKeyDown: function(e) {
			if(e.keyCode === 9) {
				this.toggle(false);
			} else if (e.keyCode === 13) {
				//will not blur, and can toggle dropdown either on or off - also, we have to manually force user-input fixing.
				this.fixUserInput();
				this.toggle();
				e.preventDefault(); //prevent submit if inside form
			}
		},
		onBlur: function(e) {
			this.fixUserInput();
		},
		onFocus: function () {
			if(!this.dropdown || !this.dropdown.isShown()) {
				//this would be a good place to call this.toggle(true), so that tab-to-focus would show the datepicker dropdown, but it does not work in ie 11: when a date is selected, 
				//we call focus() manually, in order to be able to trigger a "change" event.
				//unfortunately, in ie11, this will schedule a focus event which will call this function and then the dropdown is activated again. 
				//since the focus event seems to happen after return to the eventloop it's not easy to see how we could identify it as special, and ignore it...
			}
		},
		fixUserInput: function () {
			var val = this.el.val();
			var dateTicks = DateUtils.getDateFromFormat(val, "d/M/y") || DateUtils.getDateFromFormat(val, "d-M-y") || DateUtils.getDateFromFormat(val, "d.M.y") || DateUtils.getDateFromFormat(val, "d,M,y") || DateUtils.getDateFromFormat(val, "dMy");
			if (dateTicks) {
				this.el.val(DateUtils.formatDate(new Date(dateTicks), this.options.dateFormat));
			} else {
				this.el.val("");
			}
		},
		getDate: function() {
			return this.el.val();
		},
		onDropdownToggled: function(dropdown, state) {
			//if(!state) { this.picker.closed(); }
			if(this.iconButton) {
				this.iconButton.toggleClass("active", this.dropdown.isShown());
			}
		}
	});

	return Datepicker;
});