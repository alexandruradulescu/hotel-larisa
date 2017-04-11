import "babel-polyfill";
import $ from "../libs/jquery";
import as from "../libs/as";

class Accordion extends as.View {
    constructor(el){
        super(el);
        this.accordionContent = this.$(".accordion-content");
        this.accordionContentInner = this.$(".accordion-inner");

        this.addListener("click", ".accordion-header", this.toggleAccordion);
        this.addListener("resize", window, this.calculateHeight);
        this.addListener("keyup", ".accordion-header", this.toggleAccordion);
    }

    toggleAccordion(e) {
        if ((e.type == "keyup" && e.keyCode == 13) || (e.type == "click")) {
            if(this.el.hasClass("is-active")){
                this.accordionContent.removeAttr("style");
                this.el.removeClass("active");
            } else {
                this.el.addClass("active");
                this.accordionContent.css({ "max-height": this.accordionContentInner.outerHeight()});
            }
        }
    }

    calculateHeight() {
        if (this.el.hasClass("is-active")){
            this.accordionContent.css({ "height": this.accordionContentInner.outerHeight()});
        }
    }

    static init(selector = ".accordion", base = $("body")) {
        base.find(selector).each((i, el) => {
            new Accordion($(el));
        });
    }
}

export default Accordion;