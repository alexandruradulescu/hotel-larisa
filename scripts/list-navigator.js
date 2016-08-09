define("ListNavigator", ["$", "_", "as"], function ($, _, as) {
    "use strict";

    var ListNavigator = as.defineClass(as.View, {
        events: {
            "keyup .search-field": "onFilterKeyup",
            "keydown .search-field": "onFilterKeydown",
            "click .list-row": "onListRowSelect",
            "dblclick .list-row": "onListRowOpen",
            "click .open-item": "openButtonClick"
        },
        createElement: function (elem) { return elem; },
        con: function (el, options) {
            this.options = options;
            this.selectedListRowIndex = 0;
            this.rows = null;
            this.listContainer = this.$(".extra-columns-selection-data");
            this.dataUpdate();
            this.rows = this.$(".list-row").not(".hidden, .picked");
        },
        onFilterKeydown: function (e) {
            var keyCode = (e.keyCode ? e.keyCode : e.which);
            this.keydownKeycode = keyCode;
        },
        onFilterKeyup: function (e) {
            var keyCode = (e.keyCode ? e.keyCode : e.which);
            if (keyCode != this.keydownKeycode) { return; }
            this.keydownKeycode = null;
            if (keyCode === 27 || keyCode === 38 || keyCode === 40 || keyCode === 13) {
                e.preventDefault();
                this.rows = this.$(".list-row").not(".hidden, .picked");
                switch (keyCode) {
                    case 27: //Esc
                        if (this.options.popup) {
                            this.options.popup.toggle(false);
                        }
                        this.reset();
                        break;
                    case 38: //Up
                        this.selectedListRowIndex--;
                        this.updateRowFocus();
                        if (this.options.onSelect) { this.options.onSelect({ currentTarget: this.rows[this.selectedListRowIndex] }); }
                        this.scrollToElement();
                        break;
                    case 40: //Down
                        this.selectedListRowIndex++;
                        this.updateRowFocus();
                        if (this.options.onSelect) { this.options.onSelect({ currentTarget: this.rows[this.selectedListRowIndex] }); }
                        this.scrollToElement();
                        break;
                    default: //Enter
                        if (this.rows.length) {
                            if (this.options.onOpen) { this.options.onOpen({ currentTarget: this.rows[this.selectedListRowIndex] }); }
                            if (this.options.popup) { this.options.popup.toggle(false); }
                        }
                        this.reset();
                        this.scrollToElement();
                        break;
                }
            }
        },
        updateRowFocus: function () {
            this.rows.removeClass("list-row-selected");
            if (this.selectedListRowIndex < 0) {
                this.selectedListRowIndex = this.rows.length - 1;
            }
            if (this.selectedListRowIndex > this.rows.length - 1) {
                this.selectedListRowIndex = 0;
            }
            $(this.rows[this.selectedListRowIndex]).addClass("list-row-selected");
        },
        dataUpdate: function () {
            this.rows = this.$(".list-row").not(".hidden, .picked").removeClass("list-row-selected");
            if (this.rows.length > 0) {
                if (this.rows.length > 0 && this.selectedListRowIndex > this.rows.length - 1) {
                    this.selectedListRowIndex = 0;
                }
                this.rows.eq(this.selectedListRowIndex).addClass("list-row-selected");
                if (this.options.onSelect) { this.options.onSelect({ currentTarget: this.rows[0] }); }
                this.$(".error-list-row").addClass("hidden");
            } else {
                this.$(".error-list-row").removeClass("hidden");
            }
        },
        scrollToElement: function () {
            var selectedEl = this.$(".list-row-selected");
            if (selectedEl.position().top + selectedEl.height() * 2 > this.listContainer.height() || selectedEl.position().top < 0) {
                this.listContainer.animate({ scrollTop: selectedEl.position().top + this.listContainer.scrollTop() }, 150);
            }
        },
        onListRowSelect: function (e) {
            this.$(".list-row").removeClass("list-row-selected");
            var el = $(e.currentTarget).addClass("list-row-selected");
            if (this.options.openOnClick && this.options.onOpen) {
                this.options.onOpen({ currentTarget: el });
                if (this.options.popup) {
                    this.options.popup.toggle(false);
                }
                this.reset();
            } else {
                this.selectedListRowIndex = this.rows.index(el);
                this.updateRowFocus();
            }
            if (this.options.onSelect) { this.options.onSelect(e); }
        },
        onListRowOpen: function (e) {
            if (this.options.onOpen) { this.options.onOpen(e); }
            if (this.options.popup) {
                this.options.popup.toggle(false);
            }
        },
        openButtonClick: function (e) {
            if (this.options.onOpen) { this.options.onOpen({ currentTarget: this.$(".list-row-selected") }); }
            if (this.options.popup) {
                this.options.popup.toggle(false);
            }
        },
        reset: function () {
            this.selectedListRowIndex = 0;
            this.rows = this.$(".list-row")
                //.not(".hidden, .picked")
                .removeClass("list-row-selected");

            if ($(this.rows[this.selectedListRowIndex]).hasClass("picked")) {
                for (var i = 0; i < this.rows.length; i++) {
                    if ($(this.rows[i]).hasClass("picked")) { continue; }
                    else { $(this.rows[i]).addClass("list-row-selected"); break; }
                }
            } else {
                $(this.rows[this.selectedListRowIndex]).addClass("list-row-selected");
            }


        }
    });

    return ListNavigator;

});