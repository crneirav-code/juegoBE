import React, { useState, useEffect, useCallback } from 'react';
import { Bus, Train, Car, Navigation } from 'lucide-react';

const CELL_SIZE = 30;
const GRID_WIDTH = 19;
const GRID_HEIGHT = 15;

// Laberinto (1 = pared, 0 = camino)
const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,1,0,1,0,1,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,1],
  [1,1,1,1,1,0,1,1,0,1,0,1,1,0,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,1,0,1,0,0,1,0,0,1,0,1,0,0,0,1],
  [1,1,1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,1,0,1,0,1,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const TRANSPORTS = [
  { id: 'metro', name: 'Metro Santiago', icon: '🚇', color: '#E30613' },
  { id: 'metro-valpo', name: 'Metro Valparaíso', icon: '🚊', color: '#0066CC' },
  { id: 'metro-conce', name: 'Metro Concepción', icon: '🚈', color: '#009B3A' },
  { id: 'buses', name: 'Buses', icon: '🚌', color: '#FF9500' },
  { id: 'taxis', name: 'Taxis', icon: '🚕', color: '#FFD700' },
];

const PAYMENT_METHODS = [
  { id: 'banco-chile', name: 'Banco de Chile', color: '#003DA5' },
  { id: 'tenpo', name: 'Tenpo', color: '#8B5CF6' },
  { id: 'mach', name: 'Mach', color: '#FF6B35' },
  { id: 'santander', name: 'Santander', color: '#EC0000' },
];

const Game = () => {
  const [gameState, setGameState] = useState('menu'); // menu, playing, won, lost
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [playerPos, setPlayerPos] = useState({ x: 1, y: 1 });
  const [targetPos] = useState({ x: 17, y: 13 });
  const [enemies, setEnemies] = useState([]);
  const [score, setScore] = useState(0);

  const startGame = (transport) => {
    setSelectedTransport(transport);
    setPlayerPos({ x: 1, y: 1 });
    setEnemies([
      { id: 'banco-chile', ...PAYMENT_METHODS[0], x: 17, y: 1 },
      { id: 'tenpo', ...PAYMENT_METHODS[1], x: 1, y: 13 },
      { id: 'mach', ...PAYMENT_METHODS[2], x: 9, y: 7 },
      { id: 'santander', ...PAYMENT_METHODS[3], x: 15, y: 10 },
      { id: 'banco-chile-2', ...PAYMENT_METHODS[0], x: 17, y: 13 }, // Enemigo extra
      { id: 'tenpo-2', ...PAYMENT_METHODS[1], x: 3, y: 3 }, // Enemigo extra
    ]);
    setScore(0);
    setGameState('playing');
  };

  const isValidMove = (x, y) => {
    return x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT && MAZE[y][x] === 0;
  };

  const getDistance = (pos1, pos2) => {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  };

  const moveEnemies = useCallback(() => {
    setEnemies(prevEnemies => {
      return prevEnemies.map(enemy => {
        const possibleMoves = [
          { x: enemy.x + 1, y: enemy.y },
          { x: enemy.x - 1, y: enemy.y },
          { x: enemy.x, y: enemy.y + 1 },
          { x: enemy.x, y: enemy.y - 1 },
        ].filter(pos => isValidMove(pos.x, pos.y));

        if (possibleMoves.length === 0) return enemy;

        // Movimiento inteligente: elegir el mejor movimiento hacia el jugador
        // Ordenar por distancia al jugador (más cercano primero)
        possibleMoves.sort((a, b) => {
          return getDistance(a, playerPos) - getDistance(b, playerPos);
        });

        // 90% de probabilidad de tomar el mejor movimiento, 10% aleatorio para variedad
        const bestMove = Math.random() < 0.9 ? possibleMoves[0] : possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

        return { ...enemy, ...bestMove };
      });
    });
  }, [playerPos]);

  const handleKeyPress = useCallback((e) => {
    if (gameState !== 'playing') return;

    let newX = playerPos.x;
    let newY = playerPos.y;

    switch(e.key) {
      case 'ArrowUp':
      case 'w':
        newY -= 1;
        break;
      case 'ArrowDown':
      case 's':
        newY += 1;
        break;
      case 'ArrowLeft':
      case 'a':
        newX -= 1;
        break;
      case 'ArrowRight':
      case 'd':
        newX += 1;
        break;
      default:
        return;
    }

    e.preventDefault();

    if (isValidMove(newX, newY)) {
      setPlayerPos({ x: newX, y: newY });
      setScore(prev => prev + 1);
    }
  }, [gameState, playerPos]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      moveEnemies();
    }, 250); // Movimiento más rápido (antes 400ms, ahora 250ms)

    return () => clearInterval(interval);
  }, [gameState, moveEnemies]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    // Verificar si ganó
    if (playerPos.x === targetPos.x && playerPos.y === targetPos.y) {
      setGameState('won');
    }

    // Verificar si perdió
    const caught = enemies.some(enemy => 
      enemy.x === playerPos.x && enemy.y === playerPos.y
    );
    if (caught) {
      setGameState('lost');
    }
  }, [playerPos, enemies, gameState, targetPos]);

  if (gameState === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-8">
        <h1 className="text-5xl font-bold text-white mb-4">💳 BancoEstado la lleva 🏃</h1>
        <p className="text-xl text-white mb-8">Elige tu medio de transporte</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
          {TRANSPORTS.map(transport => (
            <button
              key={transport.id}
              onClick={() => startGame(transport)}
              className="bg-white hover:bg-gray-100 rounded-lg p-6 shadow-xl transform hover:scale-105 transition-all"
              style={{ borderLeft: `8px solid ${transport.color}` }}
            >
              <div className="text-5xl mb-2">{transport.icon}</div>
              <div className="text-xl font-bold" style={{ color: transport.color }}>
                {transport.name}
              </div>
            </button>
          ))}
        </div>
        <div className="mt-12 text-white text-center max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">📋 Cómo Jugar</h2>
          <p className="mb-2">Usa las flechas o WASD para moverte</p>
          <p className="mb-2">Llega desde el punto A (verde) hasta el punto B (azul)</p>
          <p className="mb-2">¡Evita que los otros bancos te atrapen!</p>
          <p className="text-yellow-300 font-bold">⚠️ MODO DIFÍCIL: Los enemigos te persiguen activamente</p>
        </div>
      </div>
    );
  }

  if (gameState === 'won') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-600 to-green-800 p-8">
        <h1 className="text-6xl font-bold text-white mb-4">🎉 ¡Escapaste! 🎉</h1>
        <p className="text-3xl text-white mb-4">¡BancoEstado llegó al transporte!</p>
        <div className="text-2xl text-white mb-8">Movimientos: {score}</div>
        <div className="text-4xl mb-8">{selectedTransport.icon}</div>
        <button
          onClick={() => setGameState('menu')}
          className="bg-white text-green-700 px-8 py-4 rounded-lg text-xl font-bold hover:bg-gray-100 shadow-xl"
        >
          Volver al Menú
        </button>
      </div>
    );
  }

  if (gameState === 'lost') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-600 to-red-800 p-8">
        <h1 className="text-6xl font-bold text-white mb-4">😱 ¡Te Atraparon! 💳</h1>
        <p className="text-3xl text-white mb-4">La competencia te alcanzó</p>
        <div className="text-2xl text-white mb-8">Movimientos: {score}</div>
        <div className="text-6xl mb-8">🏦💰💳🏧</div>
        <button
          onClick={() => setGameState('menu')}
          className="bg-white text-red-700 px-8 py-4 rounded-lg text-xl font-bold hover:bg-gray-100 shadow-xl"
        >
          Intentar de Nuevo
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="mb-4 flex items-center gap-6 bg-gray-800 px-6 py-3 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-3xl">{selectedTransport.icon}</span>
          <span className="text-white font-bold">{selectedTransport.name}</span>
        </div>
        <div className="text-white font-bold">Movimientos: {score}</div>
      </div>
      
      <div 
        className="relative bg-black rounded-lg shadow-2xl"
        style={{ 
          width: GRID_WIDTH * CELL_SIZE, 
          height: GRID_HEIGHT * CELL_SIZE 
        }}
      >
        {/* Laberinto */}
        {MAZE.map((row, y) => 
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              style={{
                position: 'absolute',
                left: x * CELL_SIZE,
                top: y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
                backgroundColor: cell === 1 ? '#1E40AF' : '#000',
                border: cell === 1 ? '1px solid #3B82F6' : 'none',
              }}
            />
          ))
        )}

        {/* Punto de inicio */}
        <div
          style={{
            position: 'absolute',
            left: 1 * CELL_SIZE + 5,
            top: 1 * CELL_SIZE + 5,
            width: CELL_SIZE - 10,
            height: CELL_SIZE - 10,
            backgroundColor: '#10B981',
            borderRadius: '50%',
            opacity: 0.5,
          }}
        />

        {/* Punto de destino */}
        <div
          style={{
            position: 'absolute',
            left: targetPos.x * CELL_SIZE + 5,
            top: targetPos.y * CELL_SIZE + 5,
            width: CELL_SIZE - 10,
            height: CELL_SIZE - 10,
            backgroundColor: '#3B82F6',
            borderRadius: '50%',
            animation: 'pulse 1s infinite',
          }}
        />

        {/* Jugador - Tarjeta CuentaRUT */}
        <div
          style={{
            position: 'absolute',
            left: playerPos.x * CELL_SIZE + 2,
            top: playerPos.y * CELL_SIZE + 2,
            width: CELL_SIZE - 4,
            height: CELL_SIZE - 4,
            background: 'linear-gradient(135deg, #00A651 0%, #006837 100%)',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '8px',
            fontWeight: 'bold',
            color: 'white',
            border: '2px solid #FFD700',
            transition: 'all 0.1s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ textAlign: 'center', lineHeight: '1' }}>
            <div style={{ fontSize: '6px' }}>CUENTA</div>
            <div style={{ fontSize: '7px' }}>RUT</div>
          </div>
        </div>

        {/* Enemigos - Medios de Pago */}
        {enemies.map(enemy => (
          <div
            key={enemy.id}
            style={{
              position: 'absolute',
              left: enemy.x * CELL_SIZE + 2,
              top: enemy.y * CELL_SIZE + 2,
              width: CELL_SIZE - 4,
              height: CELL_SIZE - 4,
              backgroundColor: enemy.color,
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '6px',
              fontWeight: 'bold',
              color: 'white',
              transition: 'all 0.3s',
              border: '1px solid rgba(255,255,255,0.3)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
              textAlign: 'center',
              padding: '1px',
              lineHeight: '1.1',
            }}
            title={enemy.name}
          >
            {enemy.name}
          </div>
        ))}
      </div>

      <div className="mt-4 text-white text-center">
        <p className="text-sm">Usa las flechas ⬆️⬇️⬅️➡️ o WASD para moverte</p>
        <button
          onClick={() => setGameState('menu')}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
        >
          Salir al Menú
        </button>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.9); }
        }
      `}</style>
    </div>
  );
};

export default Game;