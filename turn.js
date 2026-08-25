/*
=========================================================
    Ancient Hindu Chess
    turn.js

    Blue moves first. A turn changes only after a valid
    move has been completed.
=========================================================
*/

const Turn = (() => {

    let currentArmy = 'blue';

    function init() {
        currentArmy = 'blue';
        updateUI();
    }

    function getCurrentArmy() {
        return currentArmy;
    }

    function isPlayersTurn(army) {
        return army === currentArmy;
    }

    function completeMove() {
        currentArmy = currentArmy === 'blue' ? 'orange' : 'blue';
        updateUI();
    }

    function updateUI() {
        document.body.dataset.turn = currentArmy;

        const bluePanel = document.getElementById('bluePanel');
        const orangePanel = document.getElementById('orangePanel');

        if (bluePanel) bluePanel.classList.toggle('activeTurn', currentArmy === 'blue');
        if (orangePanel) orangePanel.classList.toggle('activeTurn', currentArmy === 'orange');
    }

    return {
        init,
        getCurrentArmy,
        isPlayersTurn,
        completeMove
    };

})();
