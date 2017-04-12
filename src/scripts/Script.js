import "babel-polyfill";
import $ from "./libs/jquery";
import App from "./components/app";
import Gallery from "./components/gallery";

$(() => {
    App.init();
    Gallery.init();
});
