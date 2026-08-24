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
        // Resolve the cell from its CURRENT visual bounding rectangle.
        // This remains correct after responsive resizing and after the
        // board is rotated for Player vs Computer orientation.
        //
        // We intentionally do not calculate row/column from a cached
        // board size: on tablets, especially after switching between
        // portrait and landscape, that can leave stale coordinates.
        for (const cell of cells) {
            const rect = cell.getBoundingClientRect();
            if (
                x >= rect.left && x <= rect.right &&
                y >= rect.top && y <= rect.bottom
            ) {
                return cell;
            }
        }

        // Fallback for browsers whose transformed element hit-testing
        // behaves differently while a pointer is being captured.
        const element = document.elementFromPoint(x, y);
        return element ? element.closest(".cell") : null;
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
