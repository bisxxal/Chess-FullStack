import { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import './App.css';
import io from 'socket.io-client';

const chess = new Chess();
const socket = io("http://localhost:5000");

function App() {
  let draggedPiece = null;
  let sourceSquare = null;
  const [playerRole, setPlayerRole] = useState(null);
  const [boardElements, setBoardElements] = useState([]);

  const renderBoard = () => {
    const board = chess.board();
    const newBoardElements = board.map((row, rowIndex) =>
      row.map((square, squareIndex) => {
        const squareClass = (rowIndex + squareIndex) % 2 === 0 ? 'light' : 'dark';
        let pieceElement = null;

        if (square) {
          const pieceClass = square.color === 'w' ? 'white' : 'black';
          pieceElement = (
            <div
              key={`piece-${rowIndex}-${squareIndex}`}
              className={`piece ${pieceClass}`}
              draggable={playerRole === square.color}
              onDragStart={(e) => handleDragStart(e, rowIndex, squareIndex)}
              onDragEnd={handleDragEnd}
            >
              {getPieceUnicode(square)}
            </div>
          );
        }

        return (
          <div
            key={`square-${rowIndex}-${squareIndex}`}
            className={`square ${squareClass}`}
            data-row={rowIndex}
            data-col={squareIndex}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, rowIndex, squareIndex)}
          >
            {pieceElement}
          </div>
        );
      })
    );

    setBoardElements(newBoardElements);
  };

  const handleDragStart = (e, row, col) => {
    draggedPiece = e.target;
    sourceSquare = { row, col };
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDragEnd = () => {
    draggedPiece = null;
    sourceSquare = null;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, row, col) => {
    e.preventDefault();
    if (draggedPiece) {
      const targetSquare = { row, col };
      handleMove(sourceSquare, targetSquare);
    }
  };

  const handleMove = (source, target) => {
    const move = {
      from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
      to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
      promotion: 'q'
    };
    socket.emit("move", move);
  };

  const getPieceUnicode = (square) => {
    const unicodePieces = {
      p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
      P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔'
    };
    return unicodePieces[square.type] || '';
  };

  useEffect(() => {
    socket.on('playerRole', (role) => {
      setPlayerRole(role);
      renderBoard();
    });

    socket.on('spectatorRole', () => {
      setPlayerRole(null);
      renderBoard();
    });

    socket.on("boardState", (fen) => {
      chess.load(fen);
      renderBoard();
    });

    socket.on("move", (move) => {
      chess.move(move);
      renderBoard();
    });

    renderBoard();
  }, []);

  return (
    <div className="bg-zinc-900 w-full h-screen flex justify-center items-center">
      <div className="chessboard w-96 h-96 bg-blue-500 grid grid-cols-8 grid-rows-8">
        {boardElements.flat()}
      </div>
    </div>
  );
}

export default App;
