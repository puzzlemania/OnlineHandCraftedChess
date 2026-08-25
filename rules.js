/*
=========================================================
 Ancient Hindu Chess - rules.js
 Elephant=Rook, Horse=Knight, Camel=Bishop,
 Rani=Queen, Raja=King, Pawn=Pawn.
 Includes check, castling, en passant and promotion rules.
=========================================================
*/
const Rules = (() => {
    function row(cell){ return Number(cell.dataset.row); }
    function col(cell){ return Number(cell.dataset.col); }
    function pieceIn(cell){ return cell ? cell.querySelector('.board-piece') : null; }
    function sameArmy(a,b){ return a && b && a.dataset.army === b.dataset.army; }
    function inside(r,c){ return r>=0 && r<8 && c>=0 && c<8; }

    function clearPath(source,target,dr,dc){
        let r=row(source)+dr, c=col(source)+dc;
        while(r!==row(target)||c!==col(target)){
            if(pieceIn(Board.getCell(r,c))) return false;
            r+=dr; c+=dc;
        }
        return true;
    }

    function basicMove(piece,source,target,captureOnly=false){
        const type=piece.dataset.type, dr=row(target)-row(source), dc=col(target)-col(source);
        const adr=Math.abs(dr), adc=Math.abs(dc), targetPiece=pieceIn(target);
        if(source===target) return false;
        if(targetPiece && sameArmy(piece,targetPiece)) return false;
        if(targetPiece && targetPiece.dataset.type==='raja') return false;
        if(captureOnly && !targetPiece) return false;
        if(type==='horse') return (adr===2&&adc===1)||(adr===1&&adc===2);
        if(type==='raja') return adr<=1&&adc<=1;
        if(type==='elephant'||type==='camel'||type==='rani'){
            let valid=false, sr=0, sc=0;
            if(type!=='camel'&&(dr===0||dc===0)){ valid=true; sr=Math.sign(dr); sc=Math.sign(dc); }
            if(type!=='elephant'&&adr===adc&&adr>0){ valid=true; sr=Math.sign(dr); sc=Math.sign(dc); }
            return valid&&clearPath(source,target,sr,sc);
        }
        if(type==='pawn') return pawnMove(piece,source,target,captureOnly);
        return false;
    }

    function pawnDirection(piece,source){
        if(piece.dataset.direction==='1'||piece.dataset.direction==='-1') return Number(piece.dataset.direction);
        return row(source)<4?1:-1;
    }

    function pawnMove(piece,source,target,captureOnly){
        const dr=row(target)-row(source), dc=col(target)-col(source), dir=pawnDirection(piece,source), tp=pieceIn(target);
        if(captureOnly) return dr===dir&&Math.abs(dc)===1&&!!tp&&!sameArmy(piece,tp);
        if(dc===0&&dr===dir&&!tp) return true;
        const start=Number(piece.dataset.startRow);
        if(dc===0&&dr===2*dir&&row(source)===start&&!tp){
            return !pieceIn(Board.getCell(row(source)+dir,col(source)));
        }
        if(dr===dir&&Math.abs(dc)===1&&tp&&!sameArmy(piece,tp)) return true;
        return isEnPassant(piece,source,target);
    }

    function isEnPassant(piece,source,target){
        if(piece.dataset.type!=='pawn'||pieceIn(target)) return false;
        const last=Game.getLastMove();
        if(!last||last.type!=='pawn'||!last.doublePawn) return false;
        const dir=pawnDirection(piece,source);
        return row(target)-row(source)===dir && Math.abs(col(target)-col(source))===1 && last.toRow===row(source) && last.toCol===col(target) && last.army!==piece.dataset.army;
    }

    function attacksSquare(piece,source,target){
        const type=piece.dataset.type;
        const dr=row(target)-row(source), dc=col(target)-col(source), adr=Math.abs(dr), adc=Math.abs(dc);
        if(type==='pawn') return dr===pawnDirection(piece,source)&&adc===1;
        if(type==='horse') return (adr===2&&adc===1)||(adr===1&&adc===2);
        if(type==='raja') return adr<=1&&adc<=1&&!(adr===0&&adc===0);
        if(type==='elephant'||type==='camel'||type==='rani'){
            let valid=false,sr=0,sc=0;
            if(type!=='camel'&&(dr===0||dc===0)){valid=true;sr=Math.sign(dr);sc=Math.sign(dc);}
            if(type!=='elephant'&&adr===adc&&adr>0){valid=true;sr=Math.sign(dr);sc=Math.sign(dc);}
            return valid&&clearPath(source,target,sr,sc);
        }
        return false;
    }

    function findKing(army){
        for(let r=0;r<8;r++) for(let c=0;c<8;c++){
            const cell=Board.getCell(r,c), p=pieceIn(cell);
            if(p&&p.dataset.army===army&&p.dataset.type==='raja') return {piece:p,cell};
        }
        return null;
    }

    function isSquareAttacked(cell,byArmy){
        for(let r=0;r<8;r++) for(let c=0;c<8;c++){
            const s=Board.getCell(r,c), p=pieceIn(s);
            if(p&&p.dataset.army===byArmy&&attacksSquare(p,s,cell)) return true;
        }
        return false;
    }

    function isInCheck(army){
        const king=findKing(army); if(!king) return false;
        return isSquareAttacked(king.cell,Game.opposite(army));
    }

    function castlingLegal(piece,source,target){
        if(piece.dataset.type!=='raja'||piece.dataset.moved==='true'||isInCheck(piece.dataset.army)) return false;
        const r=row(source), from=col(source), to=col(target), delta=to-from;
        if(r!== (piece.dataset.army==='blue'?0:7) || Math.abs(delta)!==2) return false;
        const kingSide=delta>0, rookCol=kingSide?7:0, rookTarget=kingSide?5:3;
        const rookCell=Board.getCell(r,rookCol), rook=pieceIn(rookCell);
        if(!rook||rook.dataset.army!==piece.dataset.army||rook.dataset.type!=='elephant'||rook.dataset.moved==='true') return false;
        const step=Math.sign(delta);
        for(let c=from+step;c!==rookCol;c+=step) if(pieceIn(Board.getCell(r,c))) return false;
        for(const c of [from+step,from+2*step]) if(isSquareAttacked(Board.getCell(r,c),Game.opposite(piece.dataset.army))) return false;
        return true;
    }

    function simulateMove(piece,source,target,callback){
        const captured=pieceIn(target);
        const oldParent=piece.parentElement;
        const oldSrc={src:piece.src,type:piece.dataset.type,moved:piece.dataset.moved};
        if(captured) captured.remove();
        target.appendChild(piece);
        const result=callback();
        oldParent.appendChild(piece);
        piece.src=oldSrc.src; piece.dataset.type=oldSrc.type;
        if(oldSrc.moved===undefined) delete piece.dataset.moved; else piece.dataset.moved=oldSrc.moved;
        if(captured) target.appendChild(captured);
        Board.updateOccupied(source); Board.updateOccupied(target);
        return result;
    }

    function wouldLeaveKingInCheck(piece,source,target){
        return simulateMove(piece,source,target,()=>isInCheck(piece.dataset.army));
    }

    function canMove(piece,source,target){
        if(!piece||!source||!target||!inside(row(target),col(target))) return false;
        if(piece.dataset.type==='raja'&&Math.abs(col(target)-col(source))===2) return castlingLegal(piece,source,target);
        if(!basicMove(piece,source,target)) return false;
        if(isEnPassant(piece,source,target)){
            const capturedCell=Board.getCell(row(source),col(target)), captured=pieceIn(capturedCell);
            if(!captured) return false;
            captured.remove(); target.appendChild(piece);
            const illegal=isInCheck(piece.dataset.army);
            source.appendChild(piece); capturedCell.appendChild(captured);
            Board.updateOccupied(source); Board.updateOccupied(target); Board.updateOccupied(capturedCell);
            return !illegal;
        }
        return !wouldLeaveKingInCheck(piece,source,target);
    }

    function preparePiece(piece,source){
        if(piece.dataset.type==='pawn'){
            if(!piece.dataset.direction) piece.dataset.direction=row(source)<4?'1':'-1';
            if(!piece.dataset.startRow) piece.dataset.startRow=String(row(source));
        }
    }

    function allLegalMoves(army){
        const moves=[];
        for(let r=0;r<8;r++) for(let c=0;c<8;c++){
            const s=Board.getCell(r,c), p=pieceIn(s); if(!p||p.dataset.army!==army) continue;
            for(let tr=0;tr<8;tr++) for(let tc=0;tc<8;tc++){
                const t=Board.getCell(tr,tc); if(canMove(p,s,t)) moves.push({piece:p,source:s,target:t});
            }
        }
        return moves;
    }

    return {canMove,preparePiece,isInCheck,findKing,allLegalMoves,isSquareAttacked,isEnPassant};
})();
