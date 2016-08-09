define("NiceForm", ["as", "$", "Dropdown", "_", "DatePicker", "Utils"], function (as, $, Dropdown, _, DatePicker, Utils) {

	var danishDays = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];
	var danishMonths = ["Januar", "Februar", "Marts", "April", "Maj", "Juni", "Juli", "August", "September", "Oktober", "November", "December"];

	var Select = as.defineClass(as.View, {
		events: {
			"change": "onChange"
		},
		createElement: function (el) { return el; },
		con: function () {
			this.optionsHolder = as.html.build(".niceform-options-holder");
			this.select = as.html.build(".niceform-options").append(this.optionsHolder).prepend(this.upperScroller).append(this.bottomScroller);

			this.isComboBox = this.el.hasClass("combo-box");
			this.select.addClass(this.el[0].className);
			this.build();
		},
		build: function () {
			this.items = [];
			this.currentIndex = -1;
			if (this.current) {
				this.current.detach();
			}
			this.current = null;
			this.optionsHolder.empty();
			_(this.$("option")).forEach(this.buildOption, this);
			this.el.hide();
			this.dropdown = new Dropdown(this, { watchedElem: this.current, content: this.select, autoWidth: true, scroll: true });

			if (this.current) {
				this.current.addClass(this.el[0].className);
				this.current.toggleClass("validation-failed", this.currentIndex <= 0);
				var tabindex = this.el.attr('tabindex');
				if (tabindex > 0) {
					this.current.attr("tabindex", tabindex);
				}
			}
		},
		buildOption: function (elem, i) {
			var el = $(elem);
			var newEl = as.html.build(".niceform-option.dropdown-selection", as.html.text(el.text())).attr("data-idx", el.val());
			if (!el.hasClass("combo-box-always-hidden")) {
				this.items.push({ el: newEl, value: el.val(), text: el.text() });
				this.optionsHolder.append(newEl);
			}
			if (el.is(":selected")) {
				this.currentIndex = i;
				if (this.isComboBox) {
					var textElem = as.html.build("input.niceform-select-text.combo-box-input");
					textElem.prop("type", "text");
					textElem.val(el.text());
				} else {
					var textElem = as.html.build(".niceform-select-text", as.html.text(el.text()));
				}
				this.current = as.html.build("a.niceform-select", textElem, as.html.build(".icon.icon-arrow-select-white"));
				this.selectReplacement = new SelectReplacement(this, this.current, this.isComboBox);
				this.current.attr("tabindex","0");
				this.current.insertAfter(this.el);
				this.selectedEl = newEl.addClass("selected");
			}
		},
		onDropdownSelect: function (dropdown, idx, e, manual) {
			var i;
			this.el.val(idx);
			var textElem = this.current.find(".niceform-select-text");
			if (this.isComboBox) {
				textElem.val($(e.currentTarget).text());
				textElem.prop("title", $(e.currentTarget).text());
			} else {
				textElem.html($(e.currentTarget).text());
			}
			for (i = 0; i < this.items.length; i++) {
				var item = this.items[i];
				if (item.value === idx) {
					this.optionsHolder.find(".niceform-option").removeClass("selected");
					this.selectedEl = item.el.addClass("selected");
				}
			}
			if (!manual) { this.el.focus().trigger("change", this); }
			this.current.toggleClass("validation-failed", this.currentIndex <= 0);
		},
		buildFromData: function (keys, values, selectedKey) {
			this.el.empty();
			var i, option;
			for (i = 0; i < keys.length; ++i) {
				option = as.html.build("option").attr("value", keys[i]).text(values[i]);
				if (keys[i] === selectedKey) { option.prop("selected", true); }
				this.el.append(option);
			}
			this.build();
		},
		changeValue: function (idx, el) {
			this.onDropdownSelect(this.dropdown, idx, { currentTarget: el }, true);
		},
		toggle: function () {
			var i, item;
			for (i = 0; i < this.items.length; i++) {
				this.items[i].el.removeClass("hidden");
			}

			if (Utils.browser().touchDevice) {
				this.el.show().focus().css({ opacity: 0, position: "absolute" });
				var event = document.createEvent('MouseEvents');
				event.initMouseEvent('mousedown', true, true, window, null, 0, 0, 0, 0, false, false, false, false, null, null);
				this.el[0].dispatchEvent(event);
				//this.el.trigger("mousedown");
			} else {
				this.dropdown.toggle();
			}

			if (this.isComboBox && this.dropdown.isShown()) {
				this.current.find(".niceform-select-text").val("");
				this.current.find(".niceform-select-text").focus(); //in case the user opened without focusing (clicking the down-arrow).
			}
		},
		chooseNext: function () {
			this.chooseByIndex(this.currentIndex + 1);
		},
		choosePrev: function () {
			this.chooseByIndex(this.currentIndex - 1);
		},
		chooseByIndex: function (index) {
			this.items[this.currentIndex].selected = false;
			this.selectedEl.removeClass("selected");

			this.currentIndex = index < 0 ? this.items.length - 1 : (index >= this.items.length ? 0 : index);
			var newItem = this.items[this.currentIndex];
			newItem.selected = true;
			this.selectedEl = newItem.el.addClass("selected");
			this.el.val(newItem.value);
			this.current.find(".niceform-select-text").html(newItem.text);
		},
		onEnter: function () {
			if (this.dropdown.isShown()) {
				this.dropdown.toggle();
				this.el.focus().trigger("change", this);
				this.current.toggleClass("validation-failed", this.currentIndex <= 0);
			} else {
				this.toggle();
			}
		},
		onChange: function () {
			//if (Utils.browser().touchDevice) {
			//	this.changeValue(this.el.val(), this.el.find("option[value='" + this.el.val() + "']"));
			//}
		}
	});

	var SelectReplacement = as.defineClass(as.View, {
		events: {
			"click": "onClick",
			"keydown": "onKeyDown",
			"input": "onComboInput",
			"blur .combo-box-input": "onComboBlur"
		},
		createElement: function (handler, el) { return el; },
		con: function (handler, el, isComboBox) {
			this.handler = handler;
			this.show();
			this.isComboBox = isComboBox;
		},
		onClick: function () {
			this.handler.toggle();
			return false;
		},
		onKeyDown: function (e) {
			if (this.isComboBox) {
				if (e.keyCode === 13) { //enter
					var selected = this.handler.optionsHolder.find(".niceform-option.selected");
					if (selected.length === 1) {
						$(e.target).val(selected.text());
						$(e.target).prop("title", selected.text());
						this.handler.selectedEl = selected;
						this.handler.dropdown.toggle(false);
						this.handler.el.val(selected.attr("data-idx"));
						this.handler.el.focus().trigger("change");
					}
					e.preventDefault();
				} else if (e.keyCode === 40 || e.keyCode === 38) { //down or up
					var selected = this.handler.optionsHolder.find(".niceform-option.selected");
					var newSelected;
					if (selected.length === 0) {
						selected = this.handler.items[0].el.nextAll(":not(.hidden)").eq(0);
						newSelected = selected;
					} else {
						newSelected = (e.keyCode === 40) ? selected.nextAll(":not(.hidden)").eq(0) : selected.prevAll(":not(.hidden)").eq(0);
					}
					if (newSelected.length === 1) {
						selected.removeClass("selected");
						newSelected.addClass("selected");
						var aboveElement = (e.keyCode === 40) ? selected[0] : (newSelected.prevAll(":not(.hidden)")[0] || newSelected[0]);
						aboveElement.scrollIntoView();
						this.handler.dropdown.toggleScrollAreas();
					}
					e.preventDefault();
				}
			} else {
				if (e.keyCode && e.keyCode === 38) {
					this.handler.choosePrev();
					return false;
				} else if (e.keyCode && e.keyCode === 40) {
					this.handler.chooseNext();
					return false;
				} else if (e.keyCode && e.keyCode === 13) {
					this.handler.onEnter();
					return false;
				}
			}
		},
		onComboInput: function (e) {
			if (!this.handler.dropdown.isShown()) {
				this.handler.dropdown.toggle();
			}

			var i, item, filterCriteria = $(e.target).val().toLowerCase();
			for (i = 0; i < this.handler.items.length; i++) {
				item = this.handler.items[i];
				item.el.toggleClass("hidden", item.text.toLowerCase().indexOf(filterCriteria) < 0);
				var dropdown = this.handler.dropdown;
				setTimeout(function () { dropdown.toggleScrollAreas(); dropdown.resetScrollOffset(); }, 0);
			}
		},
		onComboBlur: function (e) {
			this.handler.current.find(".niceform-select-text").val(this.handler.el.find(":selected").text());
		}
	});

	var Input = as.defineClass(as.View, {
		events: {
			"change input": "onInputChange",
			"click .icon-checkbox": "toggle",
			"click .icon-radio": "toggle",
			"click label": "toggle"
		},
		createElement: function (el) { return el; },
		con: function (el) {
			this.input = this.$("input");
			this.label = this.$("label");
			this.type = this.input.attr("type");

			this.newInput = as.html.build(".icon.icon-" + this.type);
			if (this.el.hasClass("switch-box")) {
				this.newInput.addClass("switch").removeClass("icon").html(as.html.build(".switch-button"));
			}
			if (this.input.prop("checked")) { this.newInput.addClass("checked"); }
			this.newInput.attr("data-name", this.input.attr("name"));
			this.newInput.attr("data-id", this.input.attr("id"));
			this.newInput.insertAfter(this.input);
			this.input.hide();
		},
		toggle: function (e) {
			if (this.input.attr('disabled')) { return; }
			var oldState = this.input.prop("checked");
			var newState = (this.type === "radio") || !oldState;
			this.input.prop("checked", newState);
			if (oldState !== newState) {
				this.input.trigger("change");
			}
		},
		onInputChange: function () {
			if (this.input.attr('disabled')) { return; }
			var elem = this.input;
			if (this.type === "checkbox") {
				this.newInput.toggleClass("checked", elem.is(":checked"));
			} else if (this.type === "radio") {
				//if (elem.is(":checked")) {
				$(".icon-radio[data-name='" + elem.attr("name") + "']").removeClass("checked");
				this.newInput.addClass("checked");
				//} 
			}
		}
	});

	var NiceForm = as.defineClass(as.Base, {
		con: function (el) {
			if (el[0].tagName == "SELECT") {
				new Select(el);
			} else if (el[0].tagName == "DIV") {
				new Input(el);
			}
		}
	}, { //static members
		initNiceForm: function (base) {
			base = base || $("body");
			base.find(".niceform-select").remove(); // remove old niceform elements (if any), TODO: remove other types of niceform too (besides select)!
			var classFilter = ".js-radio, .js-checkbox, .js-select, .js-textarea";

			_(base.find(classFilter).add(base).filter(classFilter)).each(function (a) { //all contained elements, and the element it self (in case initNiceForm is called on a specific element).
				var elem = $(a);
				//elem.removeClass("js-radio js-checkbox js-select js-textarea"); //in case initNiceForm() runs again, prevent it from doing an element twice.
				var niceform = new NiceForm(elem);
			});
			_(base.find(".date-input")).forEach(function (a) {
				if ($(a).attr("data-initialized") !== "1") {
					var datepicker = new DatePicker(null, $(a), { dayNameLength: 1, dayNames: danishDays, dateFormat: "d/M/y", monthNames: danishMonths, cssClasses: $(a).attr("data-extra-css-classes") });
				}
			});
		},
		setChecked: function (element, state) {
			element.prop('checked', state).trigger("change");
		},
		Select: Select //to make the Select class available from outside.
	});

	$(function () {
		NiceForm.initNiceForm();
	});
	return NiceForm;
});
