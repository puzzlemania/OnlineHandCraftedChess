/*
=========================================================
 Ancient Hindu Chess - game.js
 Game-state helpers for castling, en passant, promotion,
 captures, and computer-play coordination.
=========================================================
*/
const Game = (() => {
    let lastMove = null;
    let gameOver = false;

    function getLastMove() { return lastMove; }
    function isGameOver() { return gameOver; }
    function setGameOver(value) { gameOver = !!value; }

    function recordMove(move) {
        lastMove = {
            army: move.army,
            type: move.type,
            fromRow: move.fromRow,
            fromCol: move.fromCol,
            toRow: move.toRow,
            toCol: move.toCol,
            doublePawn: !!move.doublePawn,
            promotion: move.promotion || null
        };
    }

    function clearLastMove() {
        lastMove = null;
        if (typeof Board !== 'undefined' && Board.clearLastMoveTarget) {
            Board.clearLastMoveTarget();
        }
    }

    function opposite(army) { return army === 'blue' ? 'orange' : 'blue'; }

    function isPromotionRow(army, r) {
        return (army === 'blue' && r === 7) || (army === 'orange' && r === 0);
    }

    function findPiece(r, c) {
        const cell = Board.getCell(r, c);
        return cell ? cell.querySelector('.board-piece') : null;
    }

    function movePiece(piece, fromCell, toCell) {
        const captured = toCell.querySelector('.board-piece');
        if (captured && captured !== piece) captured.remove();
        toCell.appendChild(piece);
        Board.updateOccupied(fromCell);
        Board.updateOccupied(toCell);
        return captured;
    }

    function moveRookForCastle(king, fromCell, toCell) {
        const r = Number(fromCell.dataset.row);
        const fromC = Number(fromCell.dataset.col);
        const toC = Number(toCell.dataset.col);
        const kingSide = toC > fromC;
        const rookCol = kingSide ? 7 : 0;
        const rookToCol = kingSide ? 5 : 3;
        const rookCell = Board.getCell(r, rookCol);
        const rookTarget = Board.getCell(r, rookToCol);
        const rook = rookCell && rookCell.querySelector('.board-piece');
        if (!rook || rook.dataset.type !== 'elephant' || rook.dataset.army !== king.dataset.army) return false;
        rookTarget.appendChild(rook);
        rook.dataset.moved = 'true';
        Board.updateOccupied(rookCell);
        Board.updateOccupied(rookTarget);
        return true;
    }

    function performCastling(king, source, target) {
        const ok = moveRookForCastle(king, source, target);
        if (!ok) return false;
        movePiece(king, source, target);
        king.dataset.moved = 'true';
        return true;
    }

    function performEnPassant(piece, source, target) {
        const last = lastMove;
        if (!last || last.type !== 'pawn' || !last.doublePawn) return false;
        const dir = Number(piece.dataset.direction);
        if (last.toRow !== Number(source.dataset.row) || Math.abs(last.toCol - Number(source.dataset.col)) !== 1) return false;
        if (Number(target.dataset.col) !== last.toCol || Number(target.dataset.row) - Number(source.dataset.row) !== dir) return false;
        if (target.querySelector('.board-piece')) return false;
        const capturedCell = Board.getCell(last.toRow, last.toCol);
        const captured = capturedCell && capturedCell.querySelector('.board-piece');
        if (!captured || captured.dataset.type !== 'pawn' || captured.dataset.army === piece.dataset.army) return false;
        captured.remove();
        Board.updateOccupied(capturedCell);
        movePiece(piece, source, target);
        return true;
    }

    function promotePawn(piece, targetCell, choice) {
        if (piece.dataset.type !== 'pawn') return;
        if (!isPromotionRow(piece.dataset.army, Number(targetCell.dataset.row))) return;
        const newType = ['rani','elephant','camel','horse'].includes(choice) ? choice : 'rani';
        piece.dataset.type = newType;
        piece.src = `assets/${piece.dataset.army}/${newType}.png`;
        piece.alt = newType;
        piece.dataset.promoted = 'true';
        delete piece.dataset.direction;
        delete piece.dataset.startRow;
    }

    function requestPromotion(piece, cell) {
        return new Promise(resolve => {
            const overlay = document.getElementById('promotionOverlay');
            const title = document.getElementById('promotionTitle');
            const choices = document.getElementById('promotionChoices');
            if (!overlay || !choices) { resolve('rani'); return; }
            title.textContent = `${piece.dataset.army === 'blue' ? 'Blue' : 'Orange'} Pawn Promotion`;
            choices.innerHTML = '';
            ['rani','elephant','camel','horse'].forEach(type => {
                const button = document.createElement('button');
                button.className = 'promotionChoice';
                button.innerHTML = `<img src="assets/${piece.dataset.army}/${type}.png" alt="${type}"><span>${type[0].toUpperCase()+type.slice(1)}</span>`;
                button.addEventListener('click', () => {
                    overlay.classList.remove('show');
                    resolve(type);
                }, { once:true });
                choices.appendChild(button);
            });
            overlay.classList.add('show');
        });
    }

    function isCastlingMove(piece, source, target) {
        return piece.dataset.type === 'raja' && Number(source.dataset.row) === Number(target.dataset.row) && Math.abs(Number(target.dataset.col)-Number(source.dataset.col)) === 2;
    }

    function finalizeMove(move) {
        recordMove(move);
        if (typeof Board !== 'undefined' && Board.markLastMoveTarget) {
            Board.markLastMoveTarget(Board.getCell(move.toRow, move.toCol));
        }
        Turn.completeMove();
        if (typeof Engine !== 'undefined') Engine.syncFromBoard();
        if (typeof GameUI !== 'undefined') GameUI.afterMove();
    }

    return {
        getLastMove, clearLastMove, opposite, isPromotionRow, findPiece,
        movePiece, isCastlingMove, performCastling, performEnPassant,
        promotePawn, requestPromotion, finalizeMove, isGameOver, setGameOver
    };
})();
