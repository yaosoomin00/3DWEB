
import { useEffect, useRef, useState } from "react";
import {
  Canvas,
  useFrame,
  useThree,
} from "@react-three/fiber";
import { Text, Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";

import BalloonGame from "./components/BalloonGame";
import SnakeGame from "./components/SnakeGame";
import MemoryMatch from "./components/MemoryMatch";
import "./index.css";

const STAR_POSITIONS = [
  [-3, 0.8, -2],
  [2, 0.8, -4],
  [5, 0.8, 1],
  [-5, 0.8, 3],
  [0, 0.8, 5],
  [6, 0.8, -5],
];

const PORTALS = [
  { id: "balloon", position: [-5, 0, -5], color: "#f35c9b", label: "BALLOON MATH", emoji: "🎈" },
  { id: "snake", position: [6, 0, -1], color: "#53c978", label: "SNAKE FRUIT", emoji: "🐍" },
  { id: "memory", position: [0, 0, 6], color: "#ffc34d", label: "MEMORY GARDEN", emoji: "🧠" },
];

function Tree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 1.3, 8]} />
        <meshStandardMaterial color="#98613e" />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <coneGeometry args={[0.8, 1.5, 8]} />
        <meshStandardMaterial color="#45a66a" />
      </mesh>
      <mesh position={[0, 2.05, 0]} castShadow>
        <coneGeometry args={[0.55, 1.2, 8]} />
        <meshStandardMaterial color="#65c77d" />
      </mesh>
    </group>
  );
}

function Flower({ position, color }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.35, 6]} />
        <meshStandardMaterial color="#3b9d57" />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function House({ position, color }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[2, 1.7, 1.7]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.95, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.55, 1.25, 4]} />
        <meshStandardMaterial color="#754c9b" />
      </mesh>
      <mesh position={[0, 0.55, 0.87]}>
        <boxGeometry args={[0.48, 0.9, 0.08]} />
        <meshStandardMaterial color="#7c4a36" />
      </mesh>
      <mesh position={[-0.55, 1.05, 0.88]}>
        <boxGeometry args={[0.38, 0.38, 0.08]} />
        <meshStandardMaterial color="#b9edff" />
      </mesh>
      <mesh position={[0.55, 1.05, 0.88]}>
        <boxGeometry args={[0.38, 0.38, 0.08]} />
        <meshStandardMaterial color="#b9edff" />
      </mesh>
    </group>
  );
}

function Portal({ position, color, label, emoji }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 0.2, 32]} />
        <meshStandardMaterial color="#eee8d7" />
      </mesh>

      <Float speed={2} floatIntensity={0.25}>
        <mesh position={[0, 1.25, 0]}>
          <torusGeometry args={[0.7, 0.12, 12, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.45}
          />
        </mesh>
        <mesh position={[0, 1.25, 0]}>
          <sphereGeometry args={[0.48, 24, 24]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.3}
          />
        </mesh>
        <Text
          position={[0, 1.3, 0.55]}
          fontSize={0.42}
          color="white"
          anchorX="center"
          outlineWidth={0.04}
          outlineColor="#333333"
        >
          {emoji}
        </Text>
      </Float>

      <Text
        position={[0, 2.3, 0]}
        fontSize={0.28}
        color="#26344c"
        anchorX="center"
        outlineWidth={0.035}
        outlineColor="white"
      >
        {label}
      </Text>
    </group>
  );
}

function Star({ position }) {
  const ref = useRef();

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 2;
    ref.current.position.y =
      position[1] +
      Math.sin(state.clock.elapsedTime * 3 + position[0]) * 0.12;
  });

  return (
    <mesh
      ref={ref}
      position={position}
      rotation={[0, 0, Math.PI / 2]}
      castShadow
    >
      <dodecahedronGeometry args={[0.25, 0]} />
      <meshStandardMaterial
        color="#ffdc54"
        emissive="#d99c19"
        emissiveIntensity={0.4}
      />
    </mesh>
  );
}

function Avatar({ keys, positionRef, onEnter, stars, setStars }) {
  const avatar = useRef();
  const lastE = useRef(false);
  const direction = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    if (!avatar.current) return;

    let x = 0;
    let z = 0;

    if (keys.current.w || keys.current.arrowup) z -= 1;
    if (keys.current.s || keys.current.arrowdown) z += 1;
    if (keys.current.a || keys.current.arrowleft) x -= 1;
    if (keys.current.d || keys.current.arrowright) x += 1;

    direction.current.set(x, 0, z);

    const moving = direction.current.length() > 0;

    if (moving) {
      direction.current.normalize();

      avatar.current.position.x += direction.current.x * 4.5 * delta;
      avatar.current.position.z += direction.current.z * 4.5 * delta;

      const rotation = Math.atan2(direction.current.x, direction.current.z);

      avatar.current.rotation.y = THREE.MathUtils.lerp(
        avatar.current.rotation.y,
        rotation,
        0.15
      );

      avatar.current.position.y =
        0.05 + Math.abs(Math.sin(state.clock.elapsedTime * 10)) * 0.08;
    } else {
      avatar.current.position.y = 0.05;
    }

    avatar.current.position.x = THREE.MathUtils.clamp(
      avatar.current.position.x, -9, 9
    );
    avatar.current.position.z = THREE.MathUtils.clamp(
      avatar.current.position.z, -9, 9
    );

    positionRef.current.copy(avatar.current.position);

    // Collect stars when walking close to them
    STAR_POSITIONS.forEach((star, index) => {
      if (stars.includes(index)) return;

      const distance = avatar.current.position.distanceTo(
        new THREE.Vector3(star[0], 0, star[2])
      );

      if (distance < 0.65) {
        setStars((old) =>
          old.includes(index) ? old : [...old, index]
        );
      }
    });

    // Press E to enter the nearest game portal
    const nearest = PORTALS.find(
      (portal) =>
        avatar.current.position.distanceTo(
          new THREE.Vector3(...portal.position)
        ) < 2.2
    );

    const ePressed = keys.current.e;

    if (nearest && ePressed && !lastE.current) {
      onEnter(nearest.id);
    }

    lastE.current = ePressed;
  });

  return (
    <group ref={avatar} position={[0, 0.05, 0]}>
      {/* Body */}
      <mesh position={[0, 0.78, 0]} castShadow>
        <capsuleGeometry args={[0.34, 0.55, 5, 12]} />
        <meshStandardMaterial color="#7357d8" />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.42, 0]} castShadow>
        <sphereGeometry args={[0.38, 24, 24]} />
        <meshStandardMaterial color="#ffc99d" />
      </mesh>

      {/* Hair */}
      <mesh position={[0, 1.65, -0.04]}>
        <sphereGeometry args={[0.37, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#53352e" />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.13, 1.43, 0.33]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshStandardMaterial color="#25213a" />
      </mesh>
      <mesh position={[0.13, 1.43, 0.33]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshStandardMaterial color="#25213a" />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.39, 0.85, 0]} rotation={[0, 0, -0.25]}>
        <capsuleGeometry args={[0.1, 0.35, 4, 8]} />
        <meshStandardMaterial color="#ffc99d" />
      </mesh>
      <mesh position={[0.39, 0.85, 0]} rotation={[0, 0, 0.25]}>
        <capsuleGeometry args={[0.1, 0.35, 4, 8]} />
        <meshStandardMaterial color="#ffc99d" />
      </mesh>

      {/* Feet */}
      <mesh position={[-0.18, 0.17, 0.04]}>
        <boxGeometry args={[0.22, 0.18, 0.38]} />
        <meshStandardMaterial color="#f6f0e9" />
      </mesh>
      <mesh position={[0.18, 0.17, 0.04]}>
        <boxGeometry args={[0.22, 0.18, 0.38]} />
        <meshStandardMaterial color="#f6f0e9" />
      </mesh>
    </group>
  );
}

function CameraFollow({ target }) {
  const { camera } = useThree();

  useFrame(() => {
    const desired = new THREE.Vector3(
      target.current.x + 8,
      10,
      target.current.z + 10
    );

    camera.position.lerp(desired, 0.045);
    camera.lookAt(target.current.x, 0, target.current.z);
  });

  return null;
}

function World({ onEnter, stars, setStars, onNearbyChange }) {
  const keys = useRef({});
  const playerPosition = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    const down = (event) => {
      const key = event.key.toLowerCase();
      if (
        ["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)
      ) {
        event.preventDefault();
      }
      keys.current[key] = true;
    };

    const up = (event) => {
      keys.current[event.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useFrame(() => {
    const position = playerPosition.current;

    const nearest = PORTALS
      .map((portal) => ({
        ...portal,
        distance: position.distanceTo(
          new THREE.Vector3(...portal.position)
        ),
      }))
      .filter((portal) => portal.distance < 2.5)
      .sort((a, b) => a.distance - b.distance)[0];

    onNearbyChange(nearest || null);
  });

  return (
    <>
      <color attach="background" args={["#b9e8ff"]} />
      <fog attach="fog" args={["#b9e8ff", 18, 38]} />

      <ambientLight intensity={1.2} />
      <directionalLight
        position={[8, 14, 8]}
        intensity={2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Island */}
      <mesh position={[0, -0.35, 0]} receiveShadow>
        <cylinderGeometry args={[12, 12, 0.7, 64]} />
        <meshStandardMaterial color="#78c978" roughness={1} />
      </mesh>

      {/* Walking paths */}
      <mesh position={[0, 0.015, -2.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 11]} />
        <meshStandardMaterial color="#e8c99c" />
      </mesh>

      <mesh position={[-2.5, 0.02, -5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7, 2.5]} />
        <meshStandardMaterial color="#e8c99c" />
      </mesh>

      <mesh position={[3, 0.02, -1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7, 2.3]} />
        <meshStandardMaterial color="#e8c99c" />
      </mesh>

      {/* Trees */}
      <Tree position={[-8, 0, -6]} scale={1.1} />
      <Tree position={[-8, 0, 1]} />
      <Tree position={[8, 0, -7]} scale={1.2} />
      <Tree position={[7, 0, 5]} />
      <Tree position={[-6, 0, 7]} />
      <Tree position={[2, 0, 8]} scale={0.9} />
      <Tree position={[5, 0, -6]} />

      {/* Houses */}
      <House position={[4, 0, -5]} color="#ffb5a7" />
      <House position={[-5, 0, 4]} color="#a9a0ff" />

      {/* Three playable portals */}
      {PORTALS.map((portal) => (
        <Portal
          key={portal.id}
          position={portal.position}
          color={portal.color}
          label={portal.label}
          emoji={portal.emoji}
        />
      ))}

      {/* Flowers */}
      {Array.from({ length: 45 }).map((_, i) => {
        const x = Math.sin(i * 12.3) * 9;
        const z = Math.cos(i * 7.7) * 9;
        const color = ["#ff7eb6", "#ffe16b", "#ffffff", "#b89cff"][i % 4];

        return (
          <Flower key={i} position={[x, 0, z]} color={color} />
        );
      })}

      {/* Collectible stars */}
      {STAR_POSITIONS.map((star, index) =>
        !stars.includes(index) ? (
          <Star key={index} position={star} />
        ) : null
      )}

      <Sparkles
        count={80}
        scale={[20, 5, 20]}
        size={2}
        speed={0.3}
        color="#ffffff"
      />

      <Avatar
        keys={keys}
        positionRef={playerPosition}
        onEnter={onEnter}
        stars={stars}
        setStars={setStars}
      />

      <CameraFollow target={playerPosition} />
    </>
  );
}

export default function App() {
  const [screen, setScreen] = useState("world");
  const [stars, setStars] = useState([]);
  const [nearPortal, setNearPortal] = useState(null);

  const enterGame = (game) => {
    setScreen(game);
    setNearPortal(null);
  };

  const goBack = () => {
    setScreen("world");
  };

  return (
    <main className="adventure-app">
      {screen === "world" ? (
        <>
          <header className="game-header">
            <div className="brand">
              <span className="brand-icon">🎈</span>
              <div>
                <h1>Math Adventure</h1>
                <p>Explore • Learn • Have Fun</p>
              </div>
            </div>

            <div className="stats">
              <div className="stat-pill">
                ⭐ {stars.length}/{STAR_POSITIONS.length}
              </div>
              <div className="stat-pill">🌍 WORLD 1</div>
            </div>
          </header>

          <section className="world-container">
            <Canvas
              shadows
              camera={{ position: [8, 10, 10], fov: 45 }}
              gl={{ antialias: true }}
            >
              <World
                onEnter={enterGame}
                stars={stars}
                setStars={setStars}
                onNearbyChange={(portal) =>
                  setNearPortal((old) =>
                    old?.id === portal?.id ? old : portal
                  )
                }
              />
            </Canvas>

            <div className="world-title">
              <span>YOUR ADVENTURE BEGINS!</span>
              <small>Explore the island and discover new games.</small>
            </div>

            <div className="controls-card">
              <strong>🎮 HOW TO MOVE</strong>
              <span>W A S D / Arrow Keys — Walk</span>
              <span>E — Enter nearby game portal</span>
              <span>Walk near ⭐ to collect stars</span>
            </div>

            {nearPortal && (
              <button
                className="enter-prompt"
                onClick={() => enterGame(nearPortal.id)}
              >
                {nearPortal.emoji} Play {nearPortal.label} — Press E or Click
              </button>
            )}
          </section>

          <footer className="world-footer">
            <span>🎈 Balloon Pop Math</span>
            <span>🐍 Snake Fruit Adventure</span>
            <span>🧠 Memory Match Garden</span>
          </footer>
        </>
      ) : (
        <section className="mini-game-screen">
          <div className="mini-game-top">
            <button className="back-button" onClick={goBack}>
              ← Back to Adventure
            </button>

            <span>
              {screen === "balloon" && "🎈 BALLOON MATH"}
              {screen === "snake" && "🐍 SNAKE FRUIT ADVENTURE"}
              {screen === "memory" && "🧠 MEMORY MATCH GARDEN"}
            </span>
          </div>

          {screen === "balloon" && <BalloonGame />}
          {screen === "snake" && <SnakeGame />}
          {screen === "memory" && <MemoryMatch />}
        </section>
      )}
    </main>
  );
}
