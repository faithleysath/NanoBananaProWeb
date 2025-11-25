import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { playJumpSound, playGameOverSound } from '../../utils/soundUtils';

const GRAVITY = 0.6;
const JUMP_FORCE = -10;
const SPEED = 5;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const DinoGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);

  // Game State
  const dinoRef = useRef({ y: 0, dy: 0, grounded: true });
  const obstaclesRef = useRef<Rect[]>([]);
  const frameRef = useRef<number>(0);
  const scoreRef = useRef(0);

  const resetGame = useCallback(() => {
    dinoRef.current = { y: 0, dy: 0, grounded: true };
    obstaclesRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    setGameOver(false);
  }, []);

  const jump = useCallback(() => {
    if (dinoRef.current.grounded) {
      dinoRef.current.dy = JUMP_FORCE;
      dinoRef.current.grounded = false;
      playJumpSound();
    }
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear - Light Mode Background
    ctx.fillStyle = '#f3f4f6'; // gray-100
    ctx.fillRect(0, 0, width, height);

    // Ground Line
    const groundY = height - 20;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.strokeStyle = '#9ca3af'; // gray-400
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Dino
    const dinoY = groundY - 40 + dinoRef.current.y;
    ctx.fillStyle = '#4b5563'; // gray-600
    ctx.fillRect(40, dinoY, 40, 40);
    
    // Dino Eye
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(65, dinoY + 5, 5, 5);

    // Draw Obstacles
    ctx.fillStyle = '#ef4444'; // red-500
    obstaclesRef.current.forEach(obs => {
      ctx.fillRect(obs.x, groundY - obs.h, obs.w, obs.h);
    });

    // Cloud decorations (optional)
    ctx.fillStyle = '#e5e7eb'; // gray-200
    ctx.beginPath();
    ctx.arc(100, 50, 20, 0, Math.PI * 2);
    ctx.arc(130, 50, 25, 0, Math.PI * 2);
    ctx.fill();

  }, []);

  const update = useCallback((width: number, height: number) => {
    if (gameOver) return;

    // Dino Physics
    dinoRef.current.dy += GRAVITY;
    dinoRef.current.y += dinoRef.current.dy;

    // Ground Collision
    if (dinoRef.current.y > 0) {
      dinoRef.current.y = 0;
      dinoRef.current.dy = 0;
      dinoRef.current.grounded = true;
    }

    // Move Obstacles
    obstaclesRef.current.forEach(obs => {
      obs.x -= SPEED;
    });

    // Spawn Obstacles
    const lastObs = obstaclesRef.current[obstaclesRef.current.length - 1];
    if (!lastObs || (width - lastObs.x > 200 + Math.random() * 300)) {
       const h = 30 + Math.random() * 30;
       obstaclesRef.current.push({
         x: width,
         y: 0, // calculated in draw relative to ground
         w: 20 + Math.random() * 10,
         h: h
       });
    }

    // Remove off-screen obstacles
    if (obstaclesRef.current.length > 0 && obstaclesRef.current[0].x < -50) {
      obstaclesRef.current.shift();
      scoreRef.current += 10;
      setScore(scoreRef.current);
      setHighScore(h => Math.max(h, scoreRef.current));
    }

    // Collision Detection
    const groundY = height - 20;
    const dinoRect = {
        x: 40,
        y: groundY - 40 + dinoRef.current.y,
        w: 40,
        h: 40
    };

    for (const obs of obstaclesRef.current) {
        const obsRect = {
            x: obs.x,
            y: groundY - obs.h,
            w: obs.w,
            h: obs.h
        };

        if (
            dinoRect.x < obsRect.x + obsRect.w &&
            dinoRect.x + dinoRect.w > obsRect.x &&
            dinoRect.y < obsRect.y + obsRect.h &&
            dinoRect.y + dinoRect.h > obsRect.y
        ) {
            setGameOver(true);
            playGameOverSound();
        }
    }

  }, [gameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
        if (canvas.parentElement) {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = 300;
        }
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      update(canvas.width, canvas.height);
      draw(ctx, canvas.width, canvas.height);
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);

    return () => {
        cancelAnimationFrame(frameRef.current);
        window.removeEventListener('resize', resize);
    };
  }, [draw, update]);

  // Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  return (
    <div className="relative flex flex-col items-center w-full">
      <div className="absolute top-2 left-4 text-xs font-mono text-gray-600 font-bold z-10">SCORE: {score}</div>
      <div className="absolute top-2 right-4 text-xs font-mono text-gray-500 z-10">HI: {highScore}</div>
      
      <canvas
        ref={canvasRef}
        className="rounded-lg border border-gray-200 bg-gray-50 shadow-sm w-full"
        onClick={jump} // Also allow click to jump
      />

      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-lg backdrop-blur-sm">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">GAME OVER</h3>
            <button
              onClick={resetGame}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full transition-colors mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      )}
      
      <div className="mt-2 text-[10px] text-gray-500 font-mono">
        Press Space/Up or Click to Jump
      </div>
    </div>
  );
};
