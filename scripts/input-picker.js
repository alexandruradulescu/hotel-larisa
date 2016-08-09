define("InputPicker", ["as", "$", "_", "ListNavigator"], function (as, $, _, ListNavigator) {
    "use strict";

    var InputPicker = as.defineClass(as.View, {
        events: {
            "click": "onClick",
            "click .picker-bubble-remove": "onRemoveClick",
            "keydown .picker-input": "keydown",
            "focus .picker-input": "onFocus",
            "blur .picker-input": "onBlur"
        },
        createElement: function (el) { return el; },
        con: function (el, options) {
            this.options = options;
            this.onItemPick = _.bind(this.onItemPick, this);
            this.listContainer = options.listContainer;
            this.pickedItems = [];
            this.allItems = [];
            this.itemFocusIndex = null;
            this.getItems();
            this.update(true);
            this.listNavigator = new ListNavigator(options.listContainer, { onOpen: this.onItemPick, openOnClick: true });
        },
        getValue: function () {
            var picked = [];
            _.map(this.pickedItems, function (item) {
                picked.push(item.id);
            });
            return picked;
        },
        getItems: function () {
            var i, el, picked, item;
            for (i = 0; i < this.options.listElems.length; i++) {
                el = $(this.options.listElems[i]);
                this.allItems.push({ el: el, id: el.attr("data-id"), text: el.text() });
            }
            if (this.options.items !== "") {
                picked = this.options.items.split(",");
                this.pickedItems = _.map(picked, function (val) {
                    item = this.findItem(val);
                    item.el.addClass("picked")
                    return item
                }, this);
            }
        },
        findItem: function (id, list) {
            var list = list || this.allItems;
            for (var i = 0; i < list.length; i++) {
                if (list[i].id === id) { return list[i]; }
            }
        },
        update: function (init) {
            var i, out = [];
            this.$(".picker-bubble").remove();
            _(this.pickedItems).each(function (item) {
                out.push(_.template($.trim($("#input-picker-bubble").html()))(item));
            });
            this.el.prepend(out);
            if (!init) {
                this.$(".picker-input").text("")[0].focus();
                this.itemFocusIndex = null;
                this.updateItemFocus();
            }
        },
        dataUpdate: function () {
            this.listNavigator.dataUpdate();
        },
        onClick: function () {
            var input = this.$(".picker-input")[0];
            input.focus();
            this.itemFocusIndex = null;
        },
        onRemoveClick: function (e) {
            var el = $(e.currentTarget).closest(".picker-bubble");
            this.removeItem(el.attr("data-id"));
        },
        removeItem: function (id) {
            this.pickedItems = _.reduce(this.pickedItems, function (prevVal, currentVal) {
                if (currentVal.id !== id) { prevVal.push(currentVal); }
                else { currentVal.el.removeClass("picked"); }
                return prevVal;
            }, []);
            this.update();
        },
        onItemPick: function (e) {
            var el = $(e.currentTarget);
            this.pickItem(el.attr("data-id"));
        },
        pickItem: function (id) {
            var item;
            if (id && !this.findItem(id, this.pickedItems)) {
                item = this.findItem(id);
                item.el.addClass("picked");
                this.pickedItems.push(item);
                this.update();
                this.$(".picker-input").trigger("keyup");
            }
        },
        keydown: function (e) {
            var keyCode = e && (e.keyCode ? e.keyCode : e.which),
				inputVal = this.$(".picker-input").text();

            if (keyCode === 8 || keyCode === 13 || keyCode === 27 || keyCode === 32 || keyCode === 37 || keyCode === 39 || keyCode === 46 || keyCode === 188) {
                switch (keyCode) {
                    case 46: // delete
                    case 8: // backspace
                        if (this.itemFocusIndex !== null) {
                            this.removeItem(this.pickedItems[this.itemFocusIndex].id);
                        } else if (inputVal === "" && this.pickedItems.length && keyCode === 8) {
                            this.removeItem(this.pickedItems[this.pickedItems.length - 1].id);
                        }
                        break;
                    case 13: // enter
                        e.preventDefault();
                        break;
                    case 32: // space
                    case 188: // comma
                    case 27: // escape
                        break;
                    case 37: // left arrow
                        if (inputVal !== "" && this.getCaretPosition(this.$(".picker-input")[0]) > 0) { break; }
                        if (this.itemFocusIndex === null) {
                            this.itemFocusIndex = this.pickedItems.length - 1;
                        } else {
                            this.itemFocusIndex--;
                        }
                        this.updateItemFocus();
                        break;
                    case 39: // right arrow
                        if (inputVal !== "" && this.getCaretPosition(this.$(".picker-input")[0]) > 0) { break; }
                        if (this.itemFocusIndex === null) {
                            this.itemFocusIndex = 0;
                        } else {
                            this.itemFocusIndex++;
                        }
                        this.updateItemFocus();
                        break;
                }
            } else {
                this.itemFocusIndex = null;
                this.updateItemFocus();
            }
        },
        updateItemFocus: function () {
            var items = this.$(".picker-bubble").removeClass("focused");
            if (this.itemFocusIndex >= this.pickedItems.length) {
                this.itemFocusIndex = null;
            } else if (this.itemFocusIndex < 0) {
                this.itemFocusIndex = 0;
            }
            if (this.itemFocusIndex === null) {
                items.removeClass("focused");
            } else {
                items.eq(this.itemFocusIndex).addClass("focused");
            }
        },
        getCaretPosition: function (editableDiv) {
            var caretPos = 0, sel, range;
            if (window.getSelection) {
                sel = window.getSelection();
                if (sel.rangeCount) {
                    range = sel.getRangeAt(0);
                    if (range.commonAncestorContainer.parentNode == editableDiv) {
                        caretPos = range.endOffset;
                    }
                }
            } else if (document.selection && document.selection.createRange) {
                range = document.selection.createRange();
                if (range.parentElement() == editableDiv) {
                    var tempEl = document.createElement("span");
                    editableDiv.insertBefore(tempEl, editableDiv.firstChild);
                    var tempRange = range.duplicate();
                    tempRange.moveToElementText(tempEl);
                    tempRange.setEndPoint("EndToEnd", range);
                    caretPos = tempRange.text.length;
                }
            }
            return caretPos;
        },
        onFocus: function () { },//todo
        onBlur: function () { }//todo
    });
    return InputPicker;
});