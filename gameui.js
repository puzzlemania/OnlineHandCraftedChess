/*=========================================================
 Ancient Hindu Chess - gameui.js
 Controls for human/computer play and game status.
=========================================================*/
const GameUI = (() => {
    let computerEnabled=false, computerArmy='orange', depth=3, thinking=false;
    function init(){
        const mode=document.getElementById('gameMode'), army=document.getElementById('computerArmy'), level=document.getElementById('engineLevel'), reset=document.getElementById('resetGame');
        mode.addEventListener('change',()=>{computerEnabled=mode.value==='computer'; updatePerspective(); updateStatus(); maybeComputerTurn();});
        army.addEventListener('change',()=>{computerArmy=army.value; updatePerspective(); updateStatus(); resetGame();});
        level.addEventListener('change',()=>{depth={1:2,2:3,3:4}[Number(level.value)]||3;});
        reset.addEventListener('click',resetGame);
        updatePerspective(); updateStatus();
    }
    function updatePerspective(){
        const board=document.getElementById('boardContainer');
        if(!board)return;
        const flipped=computerEnabled && computerArmy==='orange';
        board.classList.toggle('boardFlipped',flipped);
        // When Blue is the human army, Blue is at the bottom of the
        // visual board. When Orange is the human army, the board is
        // flipped so Orange is at the bottom. Pieces are counter-rotated
        // by CSS and therefore remain upright.
    }
    function setStatus(text){const el=document.getElementById('gameStatus');if(el)el.textContent=text;}
    function updateStatus(){
        const current=Turn.getCurrentArmy();
        const turnName=current==='blue'?'Blue':'Orange';
        if(Game.isGameOver())return;
        if(computerEnabled) setStatus(`${turnName} to move${current===computerArmy?' — Computer thinking':' — Your move'}`); else setStatus(`${turnName} to move`);
    }
    function afterMove(){
        const next=Turn.getCurrentArmy();
        const moves=Rules.allLegalMoves(next);
        if(!moves.length){Game.setGameOver(true);setStatus(Rules.isInCheck(next)?`${next==='blue'?'Blue':'Orange'} Raja is checkmated — ${next==='blue'?'Orange':'Blue'} wins!`:'Stalemate — Draw');return;}
        updateStatus(); maybeComputerTurn();
    }
    function maybeComputerTurn(){
        if(!computerEnabled||thinking||Game.isGameOver()||Turn.getCurrentArmy()!==computerArmy)return;
        thinking=true; updateStatus();
        setTimeout(()=>{
            const move=Engine.chooseMove(computerArmy,depth);
            if(move) applyEngineMove(move); else Game.setGameOver(true);
            thinking=false; afterMove();
        },350);
    }
    function applyEngineMove(m){
        const source=Board.getCell(m.fromRow,m.fromCol), target=Board.getCell(m.toRow,m.toCol), piece=source&&source.querySelector('.board-piece');
        if(!piece)return;
        let captured=target.querySelector('.board-piece'); if(captured)captured.remove();
        if(m.enPassant){const cap=Board.getCell(m.captureRow,m.captureCol).querySelector('.board-piece');if(cap)cap.remove();Board.updateOccupied(Board.getCell(m.captureRow,m.captureCol));}
        if(m.castle){const rookCell=Board.getCell(m.fromRow,m.rookFromCol), rookTarget=Board.getCell(m.fromRow,m.rookToCol), rook=rookCell.querySelector('.board-piece');if(rook){rookTarget.appendChild(rook);rook.dataset.moved='true';Board.updateOccupied(rookCell);Board.updateOccupied(rookTarget);}}
        target.appendChild(piece); piece.dataset.moved='true';
        if(piece.dataset.type==='pawn'&&m.promotion){Game.promotePawn(piece,target,m.promotion);}
        Board.updateOccupied(source);Board.updateOccupied(target);
        Game.finalizeMove({army:piece.dataset.army,type:m.type||piece.dataset.type,fromRow:m.fromRow,fromCol:m.fromCol,toRow:m.toRow,toCol:m.toCol,doublePawn:!!m.doublePawn,promotion:m.promotion||null});
    }
    function resetGame(){
        Game.setGameOver(false); Game.clearLastMove(); Turn.init(); updatePerspective();
        document.querySelectorAll('#boardOverlay .board-piece').forEach(p=>p.remove());
        document.querySelectorAll('#boardOverlay .cell').forEach(c=>{c.classList.remove('occupiedCell','activeCell');});
        Setup.init(); Engine.syncFromBoard(); updateStatus(); maybeComputerTurn();
    }
    return {init,afterMove,resetGame};
})();
