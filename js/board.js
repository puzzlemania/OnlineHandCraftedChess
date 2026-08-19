/*
=========================================================
    Ancient Hindu Chess
    board.js
=========================================================
*/

const Board = (() => {

    let overlay = null;
    let cells = [];

    function init() {
        overlay = document.getElementById("boardOverlay");
        createGrid();
    }

    function createGrid() {
        overlay.innerHTML = "";
        cells = [];

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = document.createElement("div");
                cell.className = "cell";
                cell.dataset.row = row;
                cell.dataset.col = col;
                overlay.appendChild(cell);
                cells.push(cell);
            }
        }
    }

    function getCellFromPoint(x, y) {
        const element = document.elementFromPoint(x, y);
        if (!element) return null;
        return element.closest(".cell");
    }

    function highlight(cell) {
        clearHighlight();
        if (cell) cell.classList.add("activeCell");
    }

    function updateOccupied(cell) {
        if (!cell) return;
        const occupied = cell.querySelector(".board-piece") !== null;
        cell.classList.toggle("occupiedCell", occupied);
    }

    function clearHighlight() {
        cells.forEach(cell => cell.classList.remove("activeCell"));
    }

    // Mark only the destination square of the most recent move.
    function markLastMoveTarget(cell) {
        cells.forEach(c => c.classList.remove("lastMoveTarget"));
        if (cell) cell.classList.add("lastMoveTarget");
    }

    function clearLastMoveTarget() {
        cells.forEach(c => c.classList.remove("lastMoveTarget"));
    }

    function getCell(row, col) {
        return overlay.querySelector(
            `.cell[data-row="${row}"][data-col="${col}"]`
        );
    }

    return {
        init,
        getCell,
        getCellFromPoint,
        highlight,
        clearHighlight,
        markLastMoveTarget,
        clearLastMoveTarget,
        updateOccupied
    };

})();
