import "babel-polyfill";
import $ from "../libs/jquery";
import as from "../libs/as";
import Siema from "../libs/siema";

class Gallery extends as.View {
    constructor(el){
        super(el);
        this.siema = new Siema({
            selector: this.el.find(".carousel")[0],
            loop: true
        });

        this.addListener("click", ".previous-slide", this.previousSlide);
        this.addListener("click", ".next-slide", this.nextSlide);
    }

    previousSlide() {
        this.siema.prev();
    }
    
    nextSlide() {
        this.siema.next();
    }

    static init(selector = ".carousel-wrapper", base = $("body")) {
        base.find(selector).each((i, el) => {
            new Gallery($(el));
        });
    }
}

export default Gallery;