
import { useEffect, useState } from "react";

const SYMBOLS = ["🐼", "🦊", "🐸", "🐻", "🍓", "🍉", "🍍", "🍒"];

const makeCards = () =>
  [...SYMBOLS, ...SYMBOLS]
    .map((symbol, index) => ({
      id: index,
      symbol,
      matched: false,
    }))
    .sort(() => Math.random() - 0.5);

export default function MemoryMatch() {
  const [cards, setCards] = useState(makeCards);
  const [selected, setSelected] = useState([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);

  const matches = cards.filter((card) => card.matched).length / 2;
  const won = matches === SYMBOLS.length;

  useEffect(() => {
    if (selected.length !== 2) return;

    setLocked(true);

    const [first, second] = selected;
    const isMatch = cards[first].symbol === cards[second].symbol;

    const timer = setTimeout(() => {
      if (isMatch) {
        setCards((old) =>
          old.map((card, index) =>
            index === first || index === second
              ? { ...card, matched: true }
              : card
          )
        );
      }

      setSelected([]);
      setLocked(false);
    }, isMatch ? 550 : 950);

    return () => clearTimeout(timer);
  }, [selected, cards]);

  const flipCard = (index) => {
    if (
      locked ||
      cards[index].matched ||
      selected.includes(index) ||
      won
    ) {
      return;
    }

    if (selected.length === 0) {
      setSelected([index]);
    } else {
      setMoves((old) => old + 1);
      setSelected([selected[0], index]);
    }
  };

  const restart = () => {
    setCards(makeCards());
    setSelected([]);
    setMoves(0);
    setLocked(false);
  };

  return (
    <div className="memory-game">
      <div className="memory-heading">
        <div className="memory-title">
          <div className="game-kicker">🌼 GARDEN CHALLENGE</div>
          <h1>Memory Match Garden</h1>
          <p>Find all the matching animals and fruits!</p>
        </div>

        <div className="memory-scores">
          <div>
            <small>MATCHES</small>
            <strong>{matches}/8</strong>
          </div>

          <div>
            <small>MOVES</small>
            <strong>{moves}</strong>
          </div>
        </div>
      </div>

      <div className="memory-progress">
        <div style={{ width: `${(matches / 8) * 100}%` }} />
      </div>

      <div className="memory-grid">
        {cards.map((card, index) => {
          const flipped = selected.includes(index) || card.matched;

          return (
            <button
              key={card.id}
              className={`memory-card ${
                flipped ? "flipped" : ""
              } ${card.matched ? "matched" : ""}`}
              onClick={() => flipCard(index)}
              aria-label={flipped ? card.symbol : "Hidden card"}
              disabled={locked || card.matched || flipped || won}
            >
              <span>{flipped ? card.symbol : "?"}</span>
            </button>
          );
        })}
      </div>

      {won && (
        <div className="memory-win">
          <span>🏆</span>
          <h2>Amazing! You did it!</h2>
          <p>You found all 8 pairs in {moves} moves.</p>

          <button className="game-primary" onClick={restart}>
            Play Again ↻
          </button>
        </div>
      )}

      <div className="memory-bottom">
        <span>🧠 Remember the card positions!</span>

        <button className="game-primary" onClick={restart}>
          ↻ Restart Game
        </button>
      </div>
    </div>
  );
}
