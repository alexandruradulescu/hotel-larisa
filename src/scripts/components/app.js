import "babel-polyfill";
import $ from "../libs/jquery";
import as from "../libs/as";

class App extends as.View {
    constructor(el){
        super(el);
        this.mobileMenu = this.$(".navigation-wrapper");
        this.mobileMenuBackground = this.$(".navigation-background");

        this.addListener("click", ".mobile-menu-toggle", this.toggleMobileMenu);
        this.addListener("click", ".navigation-background", this.toggleMobileMenu);
        this.addListener("click", ".popup-toggle", this.openPopup);
        this.addListener("click", ".popup-background", this.closePopup);
        this.addListener("change", ".input-field", this.validateInput);
        this.addListener("change", ".textarea-field", this.validateTextarea);
        this.addListener("click", ".global-navigation-item", this.scrollToSectionAndCloseNavigation);
        this.addListener("click", ".action-button", this.scrollToSection);
    }

    toggleMobileMenu(e) {
        this.mobileMenu.toggleClass("active");
        this.mobileMenuBackground.toggleClass("active");
    }
    openPopup(e) {
        const popupBox = $(e.currentTarget).attr("data-popup");
        if (this.$(popupBox)) {
            this.$(popupBox).addClass("is-active");
        }
    }
    closePopup(e) {
        $(e.currentTarget).closest(".popup").removeClass("is-active");
    }
    validateInput(e) {
        const currentField = $(e.currentTarget);
        if (!currentField[0].validity.valid) {
            currentField.closest(".form-item").addClass("validation-error");
        } else {
            currentField.closest(".form-item").removeClass("validation-error");
        }
    }
    validateTextarea(e) {
        const currentField = $(e.currentTarget);
        if (!currentField.val().trim().length > 0) {
            currentField.closest(".form-item").addClass("validation-error");
        } else {
            currentField.closest(".form-item").removeClass("validation-error");
        }
    }
    scrollToSectionAndCloseNavigation(e) {
        this.scrollToSection(e);
        this.toggleMobileMenu();
    }
    scrollToSection(e) {
        e.preventDefault();
        const target = $(e.currentTarget).attr("href");
        $("html, body").animate({ scrollTop: $(target).offset().top - 80 }, 600);
    }

    static init(selector = $("body")) {
        new App($(selector));
    }
}

export default App;