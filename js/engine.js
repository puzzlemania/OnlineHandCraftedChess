/*
=========================================================
 Ancient Hindu Chess - engine.js
 A self-contained chess engine for the game's custom names:
 Elephant=rook, Horse=knight, Camel=bishop, Rani=queen,
 Raja=king, Pawn=pawn.
 Uses its own board representation, legal move generation,
 alpha-beta minimax search, castling, promotion and en passant.
=========================================================
*/
const Engine = (() => {
    let state = emptyState();
    const value = {pawn:100, horse:320, camel:330, elephant:500, rani:900, raja:20000};
    const dirs = {elephant:[[1,0],[-1,0],[0,1],[0,-1]], camel:[[1,1],[1,-1],[-1,1],[-1,-1]], rani:[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]};

    function emptyState(){ return {board:Array.from({length:8},()=>Array(8).fill(null)), turn:'blue', last:null}; }
    function clone(s){ return {board:s.board.map(row=>row.map(p=>p?{...p}:null)),turn:s.turn,last:s.last?{...s.last}:null}; }
    function inside(r,c){ return r>=0&&r<8&&c>=0&&c<8; }
    function opp(a){ return a==='blue'?'orange':'blue'; }

    function syncFromBoard(){
        const s=emptyState(); s.turn=typeof Turn!=='undefined'?Turn.getCurrentArmy():'blue';
        for(let r=0;r<8;r++) for(let c=0;c<8;c++){
            const cell=Board.getCell(r,c), p=cell&&cell.querySelector('.board-piece');
            if(!p) continue;
            s.board[r][c]={army:p.dataset.army,type:p.dataset.type,moved:p.dataset.moved==='true',direction:p.dataset.direction?Number(p.dataset.direction):null,startRow:p.dataset.startRow!==undefined?Number(p.dataset.startRow):null};
        }
        s.last=Game.getLastMove(); state=s;
    }

    function pathClear(s,r,c,tr,tc,dr,dc){ r+=dr;c+=dc; while(r!==tr||c!==tc){ if(s.board[r][c]) return false; r+=dr;c+=dc; } return true; }
    function attacks(s,p,r,c,tr,tc){
        const dr=tr-r,dc=tc-c, adr=Math.abs(dr),adc=Math.abs(dc);
        if(p.type==='pawn'){ const d=p.direction??(r<4?1:-1); return dr===d&&adc===1; }
        if(p.type==='horse') return (adr===2&&adc===1)||(adr===1&&adc===2);
        if(p.type==='raja') return adr<=1&&adc<=1;
        if(p.type==='elephant'||p.type==='camel'||p.type==='rani'){
            let ok=false,sr=0,sc=0;
            if(p.type!=='camel'&&(dr===0||dc===0)){ok=true;sr=Math.sign(dr);sc=Math.sign(dc);}
            if(p.type!=='elephant'&&adr===adc&&adr>0){ok=true;sr=Math.sign(dr);sc=Math.sign(dc);}
            return ok&&pathClear(s,r,c,tr,tc,sr,sc);
        }
        return false;
    }
    function inCheck(s,army){
        let king=null; for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(s.board[r][c]?.army===army&&s.board[r][c]?.type==='raja') king={r,c};
        if(!king) return true;
        for(let r=0;r<8;r++) for(let c=0;c<8;c++){ const p=s.board[r][c]; if(p&&p.army!==army&&attacks(s,p,r,c,king.r,king.c)) return true; }
        return false;
    }
    function pseudoMoves(s,r,c){
        const p=s.board[r][c], out=[]; if(!p) return out; const army=p.army, enemy=opp(army);
        const add=(tr,tc,extra={})=>{ if(!inside(tr,tc))return; const t=s.board[tr][tc]; if(t&&t.army===army)return; if(t&&t.type==='raja')return; out.push({fromRow:r,fromCol:c,toRow:tr,toCol:tc,...extra}); };
        if(p.type==='horse'||p.type==='raja'){
            const ds=p.type==='horse'?[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]]:[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
            ds.forEach(([dr,dc])=>add(r+dr,c+dc));
            if(p.type==='raja'&&!p.moved&&!inCheck(s,army)){
                for(const side of ['king','queen']){
                    const to=side==='king'?c+2:c-2, rookCol=side==='king'?7:0, rookTo=side==='king'?5:3;
                    if(c!==4||!inside(r,to))continue; const rook=s.board[r][rookCol]; if(!rook||rook.army!==army||rook.type!=='elephant'||rook.moved)continue;
                    const step=Math.sign(to-c); let clear=true; for(let cc=c+step;cc!==rookCol;cc+=step)if(s.board[r][cc])clear=false;
                    if(!clear)continue; let safe=true; for(const cc of [c+step,c+2*step]) if(squareAttacked(s,r,cc,enemy))safe=false;
                    if(safe)out.push({fromRow:r,fromCol:c,toRow:r,toCol:to,castle:true,rookFromCol:rookCol,rookToCol:rookTo});
                }
            }
            return out;
        }
        if(p.type==='pawn'){
            const d=p.direction??(r<4?1:-1), one=r+d;
            const addPawnMove=(tr,tc,extra={})=>{
                const promotes=(army==='blue'&&tr===7)||(army==='orange'&&tr===0);
                if(promotes){ for(const promotion of ['rani','elephant','camel','horse']) add(tr,tc,{...extra,promotion}); }
                else add(tr,tc,extra);
            };
            if(inside(one,c)&&!s.board[one][c]){
                addPawnMove(one,c);
                const start=p.startRow??(p.army==='blue'?1:6), two=r+2*d;
                if(r===start&&inside(two,c)&&!s.board[two][c])add(two,c,{doublePawn:true});
            }
            for(const dc of [-1,1]){
                const tr=r+d,tc=c+dc; if(!inside(tr,tc))continue;
                if(s.board[tr][tc]&&s.board[tr][tc].army!==army&&s.board[tr][tc].type!=='raja')addPawnMove(tr,tc);
                else if(!s.board[tr][tc]&&s.last&&s.last.type==='pawn'&&s.last.doublePawn&&s.last.toRow===r&&s.last.toCol===tc&&s.last.army===enemy) add(tr,tc,{enPassant:true,captureRow:r,captureCol:tc});
            }
            return out;
        }
        for(const [dr,dc] of dirs[p.type]||[]){ let tr=r+dr,tc=c+dc; while(inside(tr,tc)){ const t=s.board[tr][tc]; if(!t)add(tr,tc); else {if(t.army!==army&&t.type!=='raja')add(tr,tc);break;} tr+=dr;tc+=dc; } }
        return out;
    }
    function promotionFor(army,r){ return (army==='blue'&&r===7)||(army==='orange'&&r===0)?'rani':null; }
    function squareAttacked(s,r,c,byArmy){ for(let rr=0;rr<8;rr++)for(let cc=0;cc<8;cc++){const p=s.board[rr][cc];if(p&&p.army===byArmy&&attacks(s,p,rr,cc,r,c))return true;} return false; }

    function apply(s,m){
        const n=clone(s), p=n.board[m.fromRow][m.fromCol]; if(!p)return null;
        n.board[m.fromRow][m.fromCol]=null;
        if(m.enPassant)n.board[m.captureRow][m.captureCol]=null;
        if(m.castle){ const rook=n.board[m.fromRow][m.rookFromCol]; n.board[m.fromRow][m.rookFromCol]=null; rook.moved=true; n.board[m.fromRow][m.rookToCol]=rook; }
        const moved={...p,moved:true}; if(m.promotion)moved.type=m.promotion;
        n.board[m.toRow][m.toCol]=moved;
        n.last={army:p.army,type:p.type,fromRow:m.fromRow,fromCol:m.fromCol,toRow:m.toRow,toCol:m.toCol,doublePawn:!!m.doublePawn};
        n.turn=opp(p.army); return n;
    }
    function legalMoves(s,army=s.turn){
        const out=[]; for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=s.board[r][c];if(!p||p.army!==army)continue;for(const m of pseudoMoves(s,r,c)){const n=apply(s,m);if(n&&!inCheck(n,army))out.push(m);} } return out;
    }
    function evaluate(s,root){
        let score=0;
        for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=s.board[r][c];if(!p)continue;let v=value[p.type];
            const advance=p.type==='pawn'?(p.army==='blue'?r:7-r)*4:0;
            const center=(3.5-Math.abs(3.5-r))+(3.5-Math.abs(3.5-c));
            v+=advance+(p.type!=='pawn'?center*2:0);
            score+=(p.army===root?v:-v);
        }
        return score;
    }
    function minimax(s,depth,alpha,beta,root){
        const moves=legalMoves(s,s.turn); if(depth===0||moves.length===0){ if(moves.length===0){if(inCheck(s,s.turn))return s.turn===root?-999999-depth:999999+depth;return 0;} return evaluate(s,root); }
        const maximizing=s.turn===root; let best=maximizing?-Infinity:Infinity;
        for(const m of moves){const n=apply(s,m),v=minimax(n,depth-1,alpha,beta,root);if(maximizing){best=Math.max(best,v);alpha=Math.max(alpha,v);}else{best=Math.min(best,v);beta=Math.min(beta,v);}if(beta<=alpha)break;} return best;
    }
    function chooseMove(army,depth=2){
        syncFromBoard(); state.turn=army; const moves=legalMoves(state,army); if(!moves.length)return null;
        let best=-Infinity, candidates=[]; for(const m of moves){const v=minimax(apply(state,m),Math.max(0,depth-1),-Infinity,Infinity,army);if(v>best){best=v;candidates=[m];}else if(v===best)candidates.push(m);} const chosen=candidates[Math.floor(Math.random()*candidates.length)]; chosen.type=state.board[chosen.fromRow][chosen.fromCol].type; return chosen;
    }
    function getState(){return clone(state);}
    return {syncFromBoard,chooseMove,getState,legalMoves};
})();
