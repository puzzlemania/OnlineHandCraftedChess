/*
=========================================================
 Ancient Hindu Chess - dragdrop.js
 Only board pieces are draggable. Valid moves include
 castling, en passant and pawn promotion.
=========================================================
*/
const DragDrop = (() => {
    let dragging=false, dragPiece=null, sourceCell=null, currentCell=null, offsetX=0, offsetY=0;
    function init(){ document.querySelectorAll('.board-piece').forEach(attachBoardPiece); }
    function attachBoardPiece(piece){ if(piece.dataset.dragAttached==='true')return; piece.dataset.dragAttached='true'; piece.addEventListener('pointerdown',startBoardDrag); }
    function startBoardDrag(event){
        event.preventDefault();
        const piece=event.currentTarget, army=piece.dataset.army;
        if(Game.isGameOver()||!Turn.isPlayersTurn(army))return;
        dragPiece=piece; sourceCell=piece.parentElement;
        Rules.preparePiece(piece,sourceCell);
        document.body.appendChild(piece); Board.updateOccupied(sourceCell); beginDrag(event);
    }
    function beginDrag(event){
        dragging=true;dragPiece.classList.add('dragging');
        const rect=dragPiece.getBoundingClientRect();
        const dragWidth=rect.width/3;
        const dragHeight=rect.height/3;
        // Keep the much smaller drag image centered under the pointer.
        offsetX=dragWidth/2;
        offsetY=dragHeight/2;
        // The board itself may be rotated 180° in Player vs Computer
        // mode so the human player's army is nearest the player. Once a
        // piece is detached from the board and attached to <body> for
        // dragging, that board rotation no longer applies. Keep the
        // floating drag image upright in both perspectives.
        Object.assign(dragPiece.style,{
            position:'fixed',
            left:(event.clientX-offsetX)+'px',
            top:(event.clientY-offsetY)+'px',
            width:dragWidth+'px',
            height:dragHeight+'px',
            transform:'none',
            zIndex:'10000',
            pointerEvents:'none'
        });
        // Listen on the window as well as the active pointer. This is
        // important on tablets where the pointer may leave the original
        // element during a landscape drag.
        if (dragPiece.setPointerCapture && event.pointerId !== undefined) {
            try { dragPiece.setPointerCapture(event.pointerId); } catch(e) {}
        }
        window.addEventListener('pointermove',pointerMove,{passive:false});
        window.addEventListener('pointerup',pointerUp,{passive:false});
        window.addEventListener('pointercancel',pointerUp,{passive:false});
    }
    function pointerMove(event){
        if(!dragging)return;
        event.preventDefault();
        dragPiece.style.left=(event.clientX-offsetX)+'px';
        dragPiece.style.top=(event.clientY-offsetY)+'px';
        currentCell=Board.getCellFromPoint(event.clientX,event.clientY);
        Board.highlight(currentCell);
    }
    async function pointerUp(event){
        if(!dragging)return;
        event.preventDefault();
        dragging=false;
        window.removeEventListener('pointermove',pointerMove);
        window.removeEventListener('pointerup',pointerUp);
        window.removeEventListener('pointercancel',pointerUp);
        Board.clearHighlight();
        currentCell=Board.getCellFromPoint(event.clientX,event.clientY);
        if(!currentCell){cancelDrag();return;}
        if(!Rules.canMove(dragPiece,sourceCell,currentCell)){cancelDrag();return;}
        await completeDrop(currentCell);
    }
    async function completeDrop(cell){
        const army=dragPiece.dataset.army, originalType=dragPiece.dataset.type;
        const fromRow=Number(sourceCell.dataset.row),fromCol=Number(sourceCell.dataset.col),toRow=Number(cell.dataset.row),toCol=Number(cell.dataset.col);
        const isCastle=Game.isCastlingMove(dragPiece,sourceCell,cell);
        const isEP=Rules.isEnPassant(dragPiece,sourceCell,cell);
        const doublePawn=originalType==='pawn'&&Math.abs(toRow-fromRow)===2;
        if(isCastle){
            if(!Game.performCastling(dragPiece,sourceCell,cell)){cancelDrag();return;}
        }else if(isEP){
            if(!Game.performEnPassant(dragPiece,sourceCell,cell)){cancelDrag();return;}
        }else{
            Game.movePiece(dragPiece,sourceCell,cell);
        }
        dragPiece.dataset.moved='true';
        if(originalType==='pawn'){
            if(!dragPiece.dataset.startRow)dragPiece.dataset.startRow=String(fromRow);
            if(Game.isPromotionRow(army,toRow)){
                resetPieceStyle(); Board.updateOccupied(cell); dragPiece.classList.remove('dragging');
                const choice=await Game.requestPromotion(dragPiece,cell); Game.promotePawn(dragPiece,cell,choice);
            }
        }
        Board.updateOccupied(sourceCell);Board.updateOccupied(cell);dragPiece.classList.remove('dragging');resetPieceStyle();attachBoardPiece(dragPiece);
        Game.finalizeMove({army,type:originalType,fromRow,fromCol,toRow,toCol,doublePawn,promotion:dragPiece.dataset.promoted?dragPiece.dataset.type:null});
        cleanup();
    }
    function cancelDrag(){if(sourceCell){sourceCell.appendChild(dragPiece);Board.updateOccupied(sourceCell);dragPiece.classList.remove('dragging');resetPieceStyle();}else if(dragPiece)dragPiece.remove();cleanup();}
    function resetPieceStyle(){
        if(!dragPiece)return;
        const flipped=document.getElementById('boardContainer')?.classList.contains('boardFlipped');
        Object.assign(dragPiece.style,{
            position:'absolute',
            left:'50%',
            top:'50%',
            transform:flipped?'translate(-50%, -50%) rotate(180deg)':'translate(-50%, -50%)',
            width:'88%',
            height:'88%',
            zIndex:'',
            pointerEvents:'auto'
        });
    }
    function cleanup(){dragPiece=null;sourceCell=null;currentCell=null;}
    return {init,attachBoardPiece};
})();
