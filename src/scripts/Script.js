import "babel-polyfill";
import $ from "./libs/jquery";
import App from "./components/app";
import Accordion from "./components/accordion";
import Siema from "./components/siema";

$(() => {
    App.init();
    Accordion.init();

    const siemas = document.querySelectorAll('.carousel');

    siemas.forEach((element) => {
        new Siema({
            selector: element,
            loop: true
        })
    });
});
