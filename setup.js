/*
=========================================================
    Ancient Hindu Chess
    setup.js

    Exact starting arrangement:
      Row 1: Blue Elephant, Horse, Camel, Rani, Raja,
             Camel, Horse, Elephant
      Row 2: Blue Pawns
      Rows 3-6: Empty
      Row 7: Orange Pawns
      Row 8: Orange Elephant, Horse, Camel, Rani, Raja,
             Camel, Horse, Elephant
=========================================================
*/

const Setup = (() => {

    const layout = [
        [
            ['blue','elephant'], ['blue','horse'],  ['blue','camel'],
            ['blue','rani'],     ['blue','raja'],   ['blue','camel'],
            ['blue','horse'],    ['blue','elephant']
        ],
        [
            ['blue','pawn'], ['blue','pawn'], ['blue','pawn'], ['blue','pawn'],
            ['blue','pawn'], ['blue','pawn'], ['blue','pawn'], ['blue','pawn']
        ],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null],
        [
            ['orange','pawn'], ['orange','pawn'], ['orange','pawn'], ['orange','pawn'],
            ['orange','pawn'], ['orange','pawn'], ['orange','pawn'], ['orange','pawn']
        ],
        [
            ['orange','elephant'], ['orange','horse'],  ['orange','camel'],
            ['orange','rani'],     ['orange','raja'],   ['orange','camel'],
            ['orange','horse'],    ['orange','elephant']
        ]
    ];

    function init() {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const entry = layout[r][c];
                if (!entry) continue;

                const cell = Board.getCell(r, c);
                const piece = Palette.createBoardPiece(entry[0], entry[1]);
                piece.dataset.moved = 'false';

                if (entry[1] === 'pawn') {
                    // Blue pawns on row 2 move toward the bottom (+1).
                    // Orange pawns on row 7 move toward the top (-1).
                    piece.dataset.direction = r < 4 ? '1' : '-1';
                    piece.dataset.startRow = String(r);
                }

                cell.appendChild(piece);
                Board.updateOccupied(cell);
                DragDrop.attachBoardPiece(piece);
            }
        }
    }

    return { init };

})();
