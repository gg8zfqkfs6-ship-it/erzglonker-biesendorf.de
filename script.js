const backgroundImages = [
    "https://commons.wikimedia.org/wiki/Special:FilePath/Rottweil%20Fasnet%202012%20Narrenengel.jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Elzach%20Fasnet%20So2014%20040.jpg",
    "https://commons.wikimedia.org/wiki/Special:FilePath/Elzach%20Fasnet%20So2014%20107.jpg"
];

const layers = Array.from(document.querySelectorAll(".background-layer"));

if (layers.length === 2) {
    let visibleIndex = 0;
    let imageIndex = 0;

    const applyImage = (layer, url) => {
        layer.style.backgroundImage = `url("${url}")`;
    };

    const preloadImage = (url) => {
        const image = new Image();
        image.src = url;
    };

    applyImage(layers[0], backgroundImages[0]);
    preloadImage(backgroundImages[1]);

    window.setInterval(() => {
        const nextLayerIndex = visibleIndex === 0 ? 1 : 0;
        imageIndex = (imageIndex + 1) % backgroundImages.length;

        applyImage(layers[nextLayerIndex], backgroundImages[imageIndex]);
        layers[nextLayerIndex].classList.add("is-visible");
        layers[visibleIndex].classList.remove("is-visible");

        visibleIndex = nextLayerIndex;
        preloadImage(backgroundImages[(imageIndex + 1) % backgroundImages.length]);
    }, 7000);
}
