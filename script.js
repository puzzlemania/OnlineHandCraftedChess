window.addEventListener('DOMContentLoaded', () => {
    Board.init();
    Palette.init();
    Setup.init();
    Turn.init();
    DragDrop.init();
    Engine.syncFromBoard();
    GameUI.init();
});
