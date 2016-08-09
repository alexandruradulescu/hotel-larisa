define("SimplePopup", ["as", "Utils", "$"], function(as, Utils, $) {
	var SimplePopup = as.defineClass(as.View, {
		/* 
		Options:
			showOnLoad: (bool) open the popup on contruct (Default false).
			closeButton: (bool) show closebutton at the top right corner (Default true).
			okButton: (bool) add ok-button (Default false).
			classes: (string) classes that will be set on the content box.
			addBackground: (bool/string) adds overlay (className if passed string) to the background of the popup
		*/
		events: {
			"click .close-popup": "remove",
			"click": "overlayClicked",
			"click .close-button": "remove",
			"click .submit-button": "onSubmit",
			"resize window": "onResize"
		},
		createElement: function() { return as.html.build(".popup"); },
		con: function (content, options) {
			this.options = options || {};
			this.window = $(window);
			this.onWindowKeyUp = _(this.onWindowKeyUp).bind(this);
			if(typeof this.options.showOnLoad !== "boolean") { this.options.showOnLoad = true; }
			if(typeof this.options.closeButton !== "boolean") { this.options.closeButton = true; }
			this.options.classes = this.options.classes || "box-wide";
			this.contentHolder = as.html.build(".content-holder");
			this.el.append(this.contentHolder);

			if(!content) { throw new Error("content must be specified"); }
			this.content = as.html.build(".content.clearfix").addClass(this.options.classes).append(content);

			if(this.options.closeButton) {
				this.content.append(as.html.build(".close-button", as.html.build("span.icon.icon-close")));
			}
			if(this.options.okButton) {
				this.content.append("<a class='button-round submit-button'>OK</a>");
			}

			if(this.options.showOnLoad) {
				this.show();
			}
			if(this.options.addBackground) {
				if(typeof this.options.addBackground === "string") {
					$(this.el).addClass(this.options.addBackground);
				}
				$(this.el).addClass("with-background");
			}
		},
		show: function() {
			this.el.appendTo($("body"));
			this.contentHolder.append(this.content);
			this.el.show();
			$("body").addClass("no-scroll");
			this.onResize();
			this.window.on("keyup", this.onWindowKeyUp);
			SimplePopup._super.show.apply(this, arguments);
		},
		remove: function(detach) {
			// IE8 fix for flash iframe
			if(this.$("iframe").length) {
				this.$("iframe").hide();
			}

			$("body").removeClass("no-scroll");
			this.window.off("keyup", this.onWindowKeyUp);
			SimplePopup._super.remove.apply(this, arguments);
			if(this.options.triggerElement) {
				this.options.triggerElement.focus();
			}
		},
		toggle: function (onoff) {
			if (onoff) {
				this.show();
			} else {
				this.remove(true);
			}
		},
		overlayClicked: function(e) {
			if(!$(e.target).closest(".content").length && document.body.contains(e.target)) {
				this.remove(true);
			}
		},
		onSubmit: function(e) {
			if(this.options.triggerElement) {
				this.options.triggerElement.trigger("simplepopuptrigger");
			}
			this.remove(true);
		},
		onResize: function() {
			var windowHeight = this.window.innerHeight()
				scrollTop = $("html")[0].scrollTop || $("body")[0].scrollTop;
			if(!Utils.browser().mobile) {
				this.content.css({ maxHeight: windowHeight - 50 });
			}
			this.contentHolder.css({ "top": scrollTop + (windowHeight - this.contentHolder.height()) / 4 });
		},
		onWindowKeyUp: function(e) {
			if(e.keyCode === 27) {//escape button
				this.remove(true);
			}
		}
	});
	return SimplePopup;
});