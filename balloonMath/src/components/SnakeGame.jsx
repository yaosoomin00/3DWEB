
import { useEffect, useRef, useState } from "react";

const SIZE = 18;
const ROWS = 14;
const CELL = 40;
const WIDTH = SIZE * CELL;
const HEIGHT = ROWS * CELL;

const START_SNAKE = [
  { x: 8, y: 7 },
  { x: 7, y: 7 },
  { x: 6, y: 7 },
  { x: 5, y: 7 },
];

function randomFruit(snake) {
  let fruit;

  do {
    fruit = {
      x: Math.floor(Math.random() * SIZE),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (snake.some((part) => part.x === fruit.x && part.y === fruit.y));

  return fruit;
}

export default function SnakeGame() {
  const [snake, setSnake] = useState(START_SNAKE);
  const [fruit, setFruit] = useState({ x: 12, y: 7 });
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    try {
      return Number(localStorage.getItem("snakeBest") || 0);
    } catch {
      return 0;
    }
  });
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);

  const boardRef = useRef(null);
  const directionRef = useRef({ x: 1, y: 0 });

  const turn = (next) => {
    const current = directionRef.current;

    // Prevent immediate reversal.
    if (
      current.x + next.x === 0 &&
      current.y + next.y === 0
    ) {
      return;
    }

    directionRef.current = next;
    setDirection(next);
  };

  // Optional keyboard controls.
  useEffect(() => {
    const handleKey = (event) => {
      const keys = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
      };

      const next = keys[event.key];

      if (next) {
        event.preventDefault();
        turn(next);
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  // Click anywhere on the board to choose a direction.
  const handleBoardClick = (event) => {
    if (gameOver || paused) return;

    const rect = boardRef.current.getBoundingClientRect();

    const clickX =
      ((event.clientX - rect.left) / rect.width) * WIDTH;

    const clickY =
      ((event.clientY - rect.top) / rect.height) * HEIGHT;

    const head = snake[0];

    const headX = (head.x + 0.5) * CELL;
    const headY = (head.y + 0.5) * CELL;

    const dx = clickX - headX;
    const dy = clickY - headY;

    if (Math.abs(dx) > Math.abs(dy)) {
      turn({ x: dx > 0 ? 1 : -1, y: 0 });
    } else {
      turn({ x: 0, y: dy > 0 ? 1 : -1 });
    }
  };

  // Game movement.
  useEffect(() => {
    if (gameOver || paused) return;

    const timer = setInterval(() => {
      setSnake((currentSnake) => {
        const head = currentSnake[0];
        const currentDirection = directionRef.current;

        // Wrap around the board edges.
        const newHead = {
          x: (head.x + currentDirection.x + SIZE) % SIZE,
          y: (head.y + currentDirection.y + ROWS) % ROWS,
        };

        const eating =
          newHead.x === fruit.x && newHead.y === fruit.y;

        // The tail moves away on normal movement.
        const bodyToCheck = eating
          ? currentSnake
          : currentSnake.slice(0, -1);

        const hitBody = bodyToCheck.some(
          (part) =>
            part.x === newHead.x &&
            part.y === newHead.y
        );

        if (hitBody) {
          setGameOver(true);
          return currentSnake;
        }

        const updatedSnake = [newHead, ...currentSnake];

        if (!eating) {
          updatedSnake.pop();
        } else {
          setScore((oldScore) => {
            const nextScore = oldScore + 10;

            setBest((oldBest) => {
              const nextBest = Math.max(oldBest, nextScore);

              try {
                localStorage.setItem(
                  "snakeBest",
                  String(nextBest)
                );
              } catch {
                // Continue playing if storage is unavailable.
              }

              return nextBest;
            });

            return nextScore;
          });

          setFruit(randomFruit(updatedSnake));
        }

        return updatedSnake;
      });
    }, Math.max(85, 180 - score * 1.2));

    return () => clearInterval(timer);
  }, [fruit, gameOver, paused, score]);

  const restart = () => {
    const freshSnake = [...START_SNAKE];

    setSnake(freshSnake);
    setFruit(randomFruit(freshSnake));
    directionRef.current = { x: 1, y: 0 };
    setDirection({ x: 1, y: 0 });
    setScore(0);
    setGameOver(false);
    setPaused(false);
  };

  // Split the snake into separate visual sections at wall crossings.
  // This prevents SVG from drawing a long line across the board.
  const getSnakePaths = () => {
    const segments = [];
    let currentSegment = [];

    snake.forEach((part, index) => {
      const point = {
        x: (part.x + 0.5) * CELL,
        y: (part.y + 0.5) * CELL,
      };

      if (index > 0) {
        const previous = snake[index - 1];

        const wrapped =
          Math.abs(part.x - previous.x) > 1 ||
          Math.abs(part.y - previous.y) > 1;

        if (wrapped) {
          if (currentSegment.length > 0) {
            segments.push(currentSegment);
          }

          currentSegment = [];
        }
      }

      currentSegment.push(point);
    });

    if (currentSegment.length > 0) {
      segments.push(currentSegment);
    }

    return segments.map((points) => {
      if (points.length === 1) {
        return `M ${points[0].x} ${points[0].y}`;
      }

      let path = `M ${points[0].x} ${points[0].y}`;

      for (let i = 1; i < points.length - 1; i++) {
        const previous = points[i - 1];
        const current = points[i];
        const next = points[i + 1];

        const before = {
          x: current.x + (previous.x - current.x) * 0.35,
          y: current.y + (previous.y - current.y) * 0.35,
        };

        const after = {
          x: current.x + (next.x - current.x) * 0.35,
          y: current.y + (next.y - current.y) * 0.35,
        };

        path += ` L ${before.x} ${before.y}`;
        path += ` Q ${current.x} ${current.y} ${after.x} ${after.y}`;
      }

      const last = points[points.length - 1];

      path += ` L ${last.x} ${last.y}`;

      return path;
    });
  };

  const snakePaths = getSnakePaths();

  const head = snake[0];
  const headX = (head.x + 0.5) * CELL;
  const headY = (head.y + 0.5) * CELL;

  const headRotation =
    direction.x === 1 ? 0 :
    direction.x === -1 ? 180 :
    direction.y === 1 ? 90 : -90;

  return (
    <div className="snake-game">
      <div className="snake-heading">
        <div>
          <div className="game-kicker">🍎 FOREST CHALLENGE</div>
          <h1>Snake Fruit Adventure</h1>
          <p>Guide your snake, collect fruits and grow longer!</p>
        </div>

        <div className="snake-scores">
          <div>
            <small>SCORE</small>
            <strong>{score}</strong>
          </div>
          <div>
            <small>BEST</small>
            <strong>{best}</strong>
          </div>
        </div>
      </div>

      <div className="snake-board-wrap">
        <div
          ref={boardRef}
          className="snake-board"
          onClick={handleBoardClick}
          role="button"
          tabIndex={0}
          aria-label="Click in the direction you want the snake to move"
        >
          <svg
            className="snake-svg"
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="snakeBodyGradient"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor="#8de65f" />
                <stop offset="50%" stopColor="#36b95e" />
                <stop offset="100%" stopColor="#16834a" />
              </linearGradient>

              <radialGradient id="snakeHeadGradient">
                <stop offset="0%" stopColor="#b4f779" />
                <stop offset="100%" stopColor="#2eaa57" />
              </radialGradient>

              <pattern
                id="grassPattern"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <rect width="40" height="40" fill="#bde8a9" />
                <circle cx="8" cy="8" r="1.5" fill="#9fd48e" />
                <circle cx="29" cy="26" r="1.5" fill="#9fd48e" />
              </pattern>

              <filter
                id="snakeShadow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="4" />
              </filter>
            </defs>

            <rect
              width={WIDTH}
              height={HEIGHT}
              fill="url(#grassPattern)"
            />

            {/* Grass decorations */}
            {Array.from({ length: 40 }).map((_, i) => (
              <circle
                key={i}
                cx={(i * 83 + 17) % WIDTH}
                cy={(i * 57 + 25) % HEIGHT}
                r="2"
                fill="#82c87b"
                opacity="0.5"
              />
            ))}

            {/* Apple shadow */}
            <ellipse
              cx={(fruit.x + 0.5) * CELL}
              cy={(fruit.y + 0.72) * CELL}
              rx="10"
              ry="4"
              fill="#4e8d45"
              opacity="0.3"
            />

            {/* Apple */}
            <text
              x={(fruit.x + 0.5) * CELL}
              y={(fruit.y + 0.7) * CELL}
              textAnchor="middle"
              fontSize="30"
              style={{ userSelect: "none" }}
            >
              🍎
            </text>

            {/* Snake shadow - each segment is separate */}
            {snakePaths.map((path, index) => (
              <path
                key={`shadow-${index}`}
                d={path}
                fill="none"
                stroke="#24643b"
                strokeWidth="34"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.2"
                transform="translate(0 5)"
                filter="url(#snakeShadow)"
              />
            ))}

            {/* Snake body */}
            {snakePaths.map((path, index) => (
              <g key={`body-${index}`}>
                <path
                  d={path}
                  fill="none"
                  stroke="#167d48"
                  strokeWidth="31"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d={path}
                  fill="none"
                  stroke="url(#snakeBodyGradient)"
                  strokeWidth="25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            ))}

            {/* Body markings */}
            {snake.slice(1).map((part, index) => (
              <circle
                key={index}
                cx={(part.x + 0.5) * CELL}
                cy={(part.y + 0.5) * CELL}
                r="4"
                fill="#b7f28a"
                opacity="0.7"
              />
            ))}

            {/* Snake head */}
            <g
              transform={`translate(${headX} ${headY}) rotate(${headRotation})`}
            >
              <ellipse
                cx="0"
                cy="0"
                rx="19"
                ry="17"
                fill="#167d48"
              />

              <ellipse
                cx="0"
                cy="-2"
                rx="17"
                ry="15"
                fill="url(#snakeHeadGradient)"
              />

              {/* Eyes */}
              <circle cx="-7" cy="-9" r="5" fill="white" />
              <circle cx="8" cy="-9" r="5" fill="white" />
              <circle cx="-6" cy="-9" r="2.5" fill="#172d27" />
              <circle cx="9" cy="-9" r="2.5" fill="#172d27" />

              {/* Smile */}
              <path
                d="M -7 5 Q 0 11 8 5"
                fill="none"
                stroke="#17653c"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Tongue */}
              <path
                d="M 0 12 L 0 20 M 0 20 L -4 24 M 0 20 L 4 24"
                fill="none"
                stroke="#ff668c"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
          </svg>

          {(gameOver || paused) && (
            <div className="snake-overlay">
              <div className="snake-result">
                <span className="result-emoji">
                  {gameOver ? "💥" : "⏸️"}
                </span>

                <h2>
                  {gameOver
                    ? "Oops! You bumped yourself!"
                    : "Game Paused"}
                </h2>

                <p>
                  {gameOver
                    ? `You collected ${score / 10} fruits!`
                    : "Take a little break."}
                </p>

                <button
                  className="game-primary"
                  onClick={gameOver ? restart : () => setPaused(false)}
                >
                  {gameOver ? "Play Again ↻" : "Continue ▶"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="snake-bottom">
        <div className="snake-help">
          <strong>🐍 HOW TO PLAY</strong>
          <span>🍎 Collect fruits to grow longer.</span>
          <span>🌍 Hit a wall? Appear on the other side!</span>
          <span>👆 Click the board to choose your direction.</span>
        </div>

        <div className="snake-controls">
          <button
            aria-label="Move up"
            onClick={() => turn({ x: 0, y: -1 })}
          >
            ▲
          </button>

          <div>
            <button
              aria-label="Move left"
              onClick={() => turn({ x: -1, y: 0 })}
            >
              ◀
            </button>

            <button
              aria-label="Move down"
              onClick={() => turn({ x: 0, y: 1 })}
            >
              ▼
            </button>

            <button
              aria-label="Move right"
              onClick={() => turn({ x: 1, y: 0 })}
            >
              ▶
            </button>
          </div>
        </div>
      </div>

      <div className="snake-actions">
        <button
          className="game-secondary"
          onClick={() => setPaused(!paused)}
          disabled={gameOver}
        >
          {paused ? "▶ Resume" : "⏸ Pause"}
        </button>

        <button className="game-primary" onClick={restart}>
          ↻ Restart Game
        </button>
      </div>
    </div>
  );
}
