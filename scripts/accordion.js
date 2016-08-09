define("Accordion",
["_", "as", "$"],
function (_, as, $) {
  "use strict";

	var Accordion = as.defineClass(as.View, {
	    events: {
	    	"click .accordion-headline": "toggleAccordionText",
	    	"keyup .accordion-headline": "toggleAccordionText",
	        "resize window": "calculateHeight"
	    },
	    createElement: function (el) {
	      return el;
	    },
	    con: function (el) {
	      this.accordionItem = el;
	      this.accordionFold = this.accordionItem.find('.accordion-content');
	      this.accordionInner = this.accordionFold.find(".accordion-inner");
	    },
	    toggleAccordionText: function (e) {
	    	if ((e.type !== "click") && (!this.isEnterKey(e))) {
				return;
			}
			/* 	
				Basic workflow is that we have 2 wrappers containing the accordion text: div.accordion-content > div.accordion-inner
				Most of the styling goes on to .accordion-inner. .accordion-content has by default max-height:0 and overflow:hidden so that nothing is shown. When clicked, it gets it's height from the .accordion-inner element which has the height according with content.
			*/
			if (this.accordionItem.hasClass('active')) {
				this.accordionFold.css({ 'max-height': 0 });
				this.accordionItem.removeClass("active");
			} else {
				this.accordionFold.css({ 'max-height': this.accordionInner.outerHeight()});
				this.accordionItem.addClass("active");
			}
	    },
	    calculateHeight: function (e) {
	    	if ((this.accordionItem.hasClass("active")) && (this.accordionFold.outerHeight() != this.accordionInner.outerHeight()))  {
	    		this.accordionFold.css({ 'max-height': this.accordionInner.outerHeight()});
	    	}
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
		$(".accordion").each(function () {
			// Calling the show() function to have the resize event working properly
			(new Accordion($(this))).show();
		});
	});

	return Accordion;
});