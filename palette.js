/*
=========================================================
    Ancient Hindu Chess
    Version 1.0
    palette.js
=========================================================
*/

const Palette = (function () {

    //-----------------------------------------------------
    // Piece Definitions
    //-----------------------------------------------------

    const pieceTypes = [

        "elephant",
        "horse",
        "camel",
        "raja",
        "rani",
        "pawn"

    ];

    //-----------------------------------------------------
    // Initialise
    //-----------------------------------------------------

    function init() {

        createPalette("orange");

        createPalette("blue");

    }

    //-----------------------------------------------------
    // Create Palette
    //-----------------------------------------------------

    function createPalette(colour) {

        const palette = document.getElementById(colour + "Palette");

        palette.innerHTML = "";

        pieceTypes.forEach(type => {

            palette.appendChild(
                createPalettePiece(colour, type)
            );

        });

    }

    //-----------------------------------------------------
    // Create Palette Piece
    //-----------------------------------------------------

    function createPalettePiece(colour, type) {

        const container = document.createElement("div");

        container.className = "palettePiece";

        container.dataset.army = colour;

        container.dataset.type = type;

        const img = document.createElement("img");

        img.src = `./assets/${colour}/${type}.png`;

        img.alt = type;

        img.draggable = false;

        container.appendChild(img);

        return container;

    }

    //-----------------------------------------------------
    // Create Board Piece
    //-----------------------------------------------------

    function createBoardPiece(colour, type) {

        const img = document.createElement("img");

        img.className = "board-piece";

        img.src = `assets/${colour}/${type}.png`;

        img.alt = type;

        img.draggable = false;

        img.dataset.army = colour;

        img.dataset.type = type;

        return img;

    }

    //-----------------------------------------------------
    // Public API
    //-----------------------------------------------------

    return {

        init,

        createBoardPiece

    };

})();