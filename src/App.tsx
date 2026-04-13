import { useState, useRef, useCallback, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, Text, Float, ContactShadows, RoundedBox, useTexture } from '@react-three/drei'
import * as THREE from 'three'

// Types
interface Fighter {
  id: number
  name: string
  faceImage: string | null
  health: number
  maxHealth: number
  position: [number, number, number]
  color: string
  isAttacking: boolean
  isBlocking: boolean
  isHit: boolean
}

interface GameState {
  phase: 'menu' | 'setup' | 'fight' | 'victory'
  winner: number | null
  round: number
}

// Fighter component
function FighterModel({
  fighter,
  side,
  onHit
}: {
  fighter: Fighter
  side: 'left' | 'right'
  onHit: () => void
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const bodyRef = useRef<THREE.Mesh>(null!)
  const armRef = useRef<THREE.Mesh>(null!)
  const legRef = useRef<THREE.Mesh>(null!)

  const [idleOffset] = useState(() => Math.random() * Math.PI * 2)

  // Try to load face texture if available
  const faceTexture = fighter.faceImage ? useTexture(fighter.faceImage) : null

  useFrame((state) => {
    if (!groupRef.current) return

    const t = state.clock.elapsedTime

    // Idle breathing animation
    groupRef.current.position.y = Math.sin(t * 2 + idleOffset) * 0.05

    // Face opponent
    groupRef.current.rotation.y = side === 'left' ? 0.3 : -0.3

    // Attack animation
    if (fighter.isAttacking && armRef.current) {
      armRef.current.rotation.x = Math.sin(t * 20) * 0.8 - 0.5
    } else if (armRef.current) {
      armRef.current.rotation.x = Math.sin(t * 3 + idleOffset) * 0.1
    }

    // Block animation
    if (fighter.isBlocking && armRef.current) {
      armRef.current.position.z = 0.3
      armRef.current.rotation.x = -1.2
    } else if (armRef.current && !fighter.isAttacking) {
      armRef.current.position.z = side === 'left' ? 0.4 : -0.4
    }

    // Hit reaction
    if (fighter.isHit && bodyRef.current) {
      bodyRef.current.position.x = Math.sin(t * 40) * 0.1
    } else if (bodyRef.current) {
      bodyRef.current.position.x = 0
    }

    // Leg movement
    if (legRef.current) {
      legRef.current.rotation.x = Math.sin(t * 3 + idleOffset + 1) * 0.1
    }
  })

  const mainColor = fighter.color
  const accentColor = side === 'left' ? '#00ffff' : '#ff00ff'

  return (
    <group ref={groupRef} position={fighter.position}>
      {/* Body */}
      <mesh ref={bodyRef} position={[0, 0.9, 0]} castShadow>
        <RoundedBox args={[0.7, 1, 0.4]} radius={0.05} smoothness={4}>
          <meshStandardMaterial color={mainColor} metalness={0.3} roughness={0.7} />
        </RoundedBox>
      </mesh>

      {/* Head with face */}
      <group position={[0, 1.7, 0]}>
        {/* Base head */}
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#f5d0c5" metalness={0.1} roughness={0.8} />
        </mesh>

        {/* Face plane with uploaded image */}
        {faceTexture && (
          <mesh position={[0, 0, 0.26]} rotation={[0, 0, 0]}>
            <planeGeometry args={[0.45, 0.45]} />
            <meshBasicMaterial map={faceTexture} transparent />
          </mesh>
        )}

        {/* Default face if no image */}
        {!faceTexture && (
          <>
            {/* Eyes */}
            <mesh position={[-0.1, 0.05, 0.26]}>
              <circleGeometry args={[0.05, 16]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[0.1, 0.05, 0.26]}>
              <circleGeometry args={[0.05, 16]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            {/* Mouth */}
            <mesh position={[0, -0.1, 0.26]}>
              <planeGeometry args={[0.15, 0.03]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
          </>
        )}

        {/* Hair / helmet accent */}
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.55, 0.15, 0.55]} />
          <meshStandardMaterial color={accentColor} metalness={0.8} roughness={0.2} emissive={accentColor} emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* Arms */}
      <mesh
        ref={armRef}
        position={[side === 'left' ? 0.5 : -0.5, 1, side === 'left' ? 0.4 : -0.4]}
        castShadow
      >
        <RoundedBox args={[0.2, 0.6, 0.2]} radius={0.05} smoothness={4}>
          <meshStandardMaterial color={mainColor} metalness={0.3} roughness={0.7} />
        </RoundedBox>
        {/* Glove */}
        <mesh position={[0, -0.4, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color={accentColor} metalness={0.5} roughness={0.3} emissive={accentColor} emissiveIntensity={0.2} />
        </mesh>
      </mesh>

      {/* Other arm */}
      <mesh position={[side === 'left' ? -0.5 : 0.5, 1, 0]} castShadow>
        <RoundedBox args={[0.2, 0.6, 0.2]} radius={0.05} smoothness={4}>
          <meshStandardMaterial color={mainColor} metalness={0.3} roughness={0.7} />
        </RoundedBox>
        <mesh position={[0, -0.4, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color={accentColor} metalness={0.5} roughness={0.3} emissive={accentColor} emissiveIntensity={0.2} />
        </mesh>
      </mesh>

      {/* Legs */}
      <mesh ref={legRef} position={[0.2, 0.1, 0]} castShadow>
        <RoundedBox args={[0.25, 0.7, 0.25]} radius={0.05} smoothness={4}>
          <meshStandardMaterial color="#2a2a2a" metalness={0.3} roughness={0.7} />
        </RoundedBox>
      </mesh>
      <mesh position={[-0.2, 0.1, 0]} castShadow>
        <RoundedBox args={[0.25, 0.7, 0.25]} radius={0.05} smoothness={4}>
          <meshStandardMaterial color="#2a2a2a" metalness={0.3} roughness={0.7} />
        </RoundedBox>
      </mesh>

      {/* Name tag floating above */}
      <Float speed={2} rotationIntensity={0} floatIntensity={0.2}>
        <Text
          position={[0, 2.3, 0]}
          fontSize={0.25}
          color={accentColor}
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter.woff"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {fighter.name}
        </Text>
      </Float>
    </group>
  )
}

// Arena component
function Arena() {
  const floorRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    // Subtle pulsing glow on floor edges
  })

  return (
    <group>
      {/* Main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]} receiveShadow ref={floorRef}>
        <circleGeometry args={[5, 64]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Outer ring glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.29, 0]}>
        <ringGeometry args={[4.8, 5.2, 64]} />
        <meshBasicMaterial color="#ff6b00" transparent opacity={0.8} />
      </mesh>

      {/* Inner ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.28, 0]}>
        <ringGeometry args={[3.8, 4, 64]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.4} />
      </mesh>

      {/* Center marker */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.27, 0]}>
        <ringGeometry args={[0.3, 0.5, 32]} />
        <meshBasicMaterial color="#ff00ff" transparent opacity={0.6} />
      </mesh>

      {/* Corner pillars */}
      {[[-4, 4], [4, 4], [-4, -4], [4, -4]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.2, 0.3, 3, 8]} />
            <meshStandardMaterial
              color="#1a1a1a"
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          <pointLight
            position={[0, 1.5, 0]}
            color={i % 2 === 0 ? '#00ffff' : '#ff00ff'}
            intensity={2}
            distance={5}
          />
        </group>
      ))}

      {/* Background walls with Japanese-style pattern */}
      <mesh position={[0, 3, -6]} receiveShadow>
        <planeGeometry args={[15, 8]} />
        <meshStandardMaterial color="#0a0a15" metalness={0.5} roughness={0.8} />
      </mesh>
    </group>
  )
}

// Hit effect
function HitEffect({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Mesh>(null!)
  const [scale, setScale] = useState(0.1)
  const [opacity, setOpacity] = useState(1)

  useFrame((_, delta) => {
    setScale(s => Math.min(s + delta * 8, 2))
    setOpacity(o => Math.max(o - delta * 3, 0))
  })

  if (opacity <= 0) return null

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  )
}

// Camera controller for fight scenes
function FightCamera({ phase }: { phase: string }) {
  const { camera } = useThree()

  useFrame((state) => {
    if (phase === 'fight') {
      const t = state.clock.elapsedTime
      camera.position.x = Math.sin(t * 0.1) * 0.5
      camera.position.z = 6 + Math.sin(t * 0.15) * 0.3
      camera.lookAt(0, 1, 0)
    }
  })

  return null
}

// Main scene
function FightScene({
  fighters,
  gameState,
  onAttack,
  onBlock,
  onStopBlock
}: {
  fighters: Fighter[]
  gameState: GameState
  onAttack: (attackerId: number) => void
  onBlock: (fighterId: number, blocking: boolean) => void
  onStopBlock: (fighterId: number) => void
}) {
  const [hitEffects, setHitEffects] = useState<{ id: number; position: [number, number, number]; color: string }[]>([])

  return (
    <>
      <color attach="background" args={['#0a0a12']} />
      <fog attach="fog" args={['#0a0a12', 8, 20]} />

      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={2048}
      />
      <spotLight
        position={[0, 10, 0]}
        angle={0.5}
        penumbra={0.5}
        intensity={2}
        color="#ffffff"
        castShadow
      />

      <FightCamera phase={gameState.phase} />

      <Arena />

      <Suspense fallback={null}>
        {fighters.map((fighter, index) => (
          <FighterModel
            key={fighter.id}
            fighter={fighter}
            side={index === 0 ? 'left' : 'right'}
            onHit={() => {
              const newEffect = {
                id: Date.now(),
                position: fighter.position,
                color: index === 0 ? '#00ffff' : '#ff00ff'
              }
              setHitEffects(prev => [...prev, newEffect])
              setTimeout(() => {
                setHitEffects(prev => prev.filter(e => e.id !== newEffect.id))
              }, 500)
            }}
          />
        ))}
      </Suspense>

      {hitEffects.map(effect => (
        <HitEffect key={effect.id} position={effect.position} color={effect.color} />
      ))}

      <ContactShadows
        position={[0, -0.29, 0]}
        opacity={0.6}
        scale={12}
        blur={2}
        far={4}
      />

      <Environment preset="night" />

      {gameState.phase !== 'fight' && (
        <OrbitControls
          enablePan={false}
          maxPolarAngle={Math.PI / 2}
          minDistance={4}
          maxDistance={12}
        />
      )}
    </>
  )
}

// UI Components
function HealthBar({ fighter, side }: { fighter: Fighter; side: 'left' | 'right' }) {
  const percentage = (fighter.health / fighter.maxHealth) * 100
  const barColor = percentage > 50 ? '#00ff88' : percentage > 25 ? '#ffaa00' : '#ff3366'

  return (
    <div className={`flex flex-col ${side === 'right' ? 'items-end' : 'items-start'}`}>
      <span className="text-xs md:text-sm font-bold tracking-widest mb-1" style={{ color: side === 'left' ? '#00ffff' : '#ff00ff' }}>
        {fighter.name}
      </span>
      <div
        className="w-28 md:w-40 h-4 md:h-6 bg-black/60 border-2 rounded-sm overflow-hidden"
        style={{ borderColor: side === 'left' ? '#00ffff' : '#ff00ff' }}
      >
        <div
          className={`h-full transition-all duration-200 ${side === 'right' ? 'ml-auto' : ''}`}
          style={{
            width: `${percentage}%`,
            backgroundColor: barColor,
            boxShadow: `0 0 10px ${barColor}`
          }}
        />
      </div>
    </div>
  )
}

function GameControls({
  onAttack,
  onBlock,
  onStopBlock,
  side
}: {
  onAttack: () => void
  onBlock: () => void
  onStopBlock: () => void
  side: 'left' | 'right'
}) {
  const accentColor = side === 'left' ? '#00ffff' : '#ff00ff'

  return (
    <div className={`flex flex-col gap-2 ${side === 'right' ? 'items-end' : 'items-start'}`}>
      <button
        className="w-16 h-16 md:w-20 md:h-20 rounded-full font-black text-sm md:text-base tracking-wider active:scale-90 transition-all touch-manipulation select-none"
        style={{
          backgroundColor: accentColor,
          boxShadow: `0 0 20px ${accentColor}`,
          color: '#000'
        }}
        onTouchStart={(e) => { e.preventDefault(); onAttack(); }}
        onMouseDown={onAttack}
      >
        PUNCH
      </button>
      <button
        className="w-14 h-14 md:w-16 md:h-16 rounded-full font-black text-xs md:text-sm tracking-wider active:scale-90 transition-all border-4 touch-manipulation select-none"
        style={{
          borderColor: accentColor,
          backgroundColor: 'rgba(0,0,0,0.6)',
          color: accentColor
        }}
        onTouchStart={(e) => { e.preventDefault(); onBlock(); }}
        onTouchEnd={(e) => { e.preventDefault(); onStopBlock(); }}
        onMouseDown={onBlock}
        onMouseUp={onStopBlock}
        onMouseLeave={onStopBlock}
      >
        BLOCK
      </button>
    </div>
  )
}

// Setup Screen
function SetupScreen({
  fighters,
  onUpdateFighter,
  onStartFight
}: {
  fighters: Fighter[]
  onUpdateFighter: (id: number, updates: Partial<Fighter>) => void
  onStartFight: () => void
}) {
  const handleImageUpload = (fighterId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        onUpdateFighter(fighterId, { faceImage: event.target?.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-black/80 via-transparent to-black/80">
      <h2
        className="text-3xl md:text-5xl font-black tracking-widest mb-6 md:mb-10 text-center"
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          background: 'linear-gradient(180deg, #ff6b00, #ff00ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}
      >
        CUSTOMIZE FIGHTERS
      </h2>

      <div className="flex flex-col md:flex-row gap-6 md:gap-12 w-full max-w-4xl">
        {fighters.map((fighter, index) => (
          <div
            key={fighter.id}
            className="flex-1 p-4 md:p-6 rounded-lg border-2 backdrop-blur-sm"
            style={{
              borderColor: index === 0 ? '#00ffff' : '#ff00ff',
              backgroundColor: 'rgba(0,0,0,0.6)'
            }}
          >
            <h3
              className="text-lg md:text-xl font-bold mb-4 tracking-widest"
              style={{ color: index === 0 ? '#00ffff' : '#ff00ff' }}
            >
              PLAYER {index + 1}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1 tracking-wider">FIGHTER NAME</label>
                <input
                  type="text"
                  value={fighter.name}
                  onChange={(e) => onUpdateFighter(fighter.id, { name: e.target.value })}
                  className="w-full bg-black/60 border-2 border-gray-700 rounded px-3 py-2 text-white font-bold focus:outline-none focus:border-white transition-colors"
                  maxLength={12}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1 tracking-wider">FACE PHOTO</label>
                <div className="flex items-center gap-3">
                  {fighter.faceImage ? (
                    <div
                      className="w-16 h-16 rounded border-2 bg-cover bg-center"
                      style={{
                        borderColor: index === 0 ? '#00ffff' : '#ff00ff',
                        backgroundImage: `url(${fighter.faceImage})`
                      }}
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded border-2 border-dashed flex items-center justify-center text-gray-500"
                      style={{ borderColor: index === 0 ? '#00ffff44' : '#ff00ff44' }}
                    >
                      <span className="text-2xl">?</span>
                    </div>
                  )}
                  <label
                    className="px-3 py-2 rounded font-bold text-xs tracking-wider cursor-pointer transition-all hover:scale-105 touch-manipulation"
                    style={{
                      backgroundColor: index === 0 ? '#00ffff' : '#ff00ff',
                      color: '#000'
                    }}
                  >
                    UPLOAD
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(fighter.id, e)}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onStartFight}
        className="mt-8 md:mt-12 px-8 md:px-12 py-3 md:py-4 text-xl md:text-2xl font-black tracking-widest rounded transition-all hover:scale-105 active:scale-95 touch-manipulation"
        style={{
          background: 'linear-gradient(90deg, #00ffff, #ff00ff)',
          color: '#000',
          boxShadow: '0 0 30px rgba(255, 0, 255, 0.5)'
        }}
      >
        START FIGHT!
      </button>
    </div>
  )
}

// Main Menu
function MainMenu({ onStart }: { onStart: () => void }) {
  const [glitch, setGlitch] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true)
      setTimeout(() => setGlitch(false), 100)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1
          className={`text-5xl md:text-8xl font-black tracking-tighter mb-2 transition-all ${glitch ? 'skew-x-2' : ''}`}
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            color: '#ff6b00',
            textShadow: glitch
              ? '-3px 0 #00ffff, 3px 0 #ff00ff'
              : '0 0 40px rgba(255, 107, 0, 0.5)'
          }}
        >
          FACE BRAWL
        </h1>
        <p
          className="text-lg md:text-2xl tracking-widest mb-8 md:mb-12"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            color: '#888'
          }}
        >
          CUSTOM FIGHTER ARENA
        </p>

        <button
          onClick={onStart}
          className="px-10 md:px-16 py-4 md:py-5 text-xl md:text-3xl font-black tracking-widest rounded-sm transition-all hover:scale-105 active:scale-95 animate-pulse touch-manipulation"
          style={{
            background: 'linear-gradient(180deg, #ff6b00, #ff3300)',
            color: '#000',
            boxShadow: '0 0 50px rgba(255, 107, 0, 0.6)'
          }}
        >
          PRESS START
        </button>

        <p className="mt-8 text-xs md:text-sm text-gray-500 tracking-wider">
          TAP BUTTONS TO FIGHT • UPLOAD YOUR FACES
        </p>
      </div>
    </div>
  )
}

// Victory Screen
function VictoryScreen({ winner, fighters, onRematch, onMenu }: {
  winner: number
  fighters: Fighter[]
  onRematch: () => void
  onMenu: () => void
}) {
  const winnerFighter = fighters.find(f => f.id === winner)
  const color = fighters[0].id === winner ? '#00ffff' : '#ff00ff'

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 bg-black/80">
      <h2
        className="text-4xl md:text-7xl font-black tracking-widest mb-4 animate-pulse"
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          color: color,
          textShadow: `0 0 50px ${color}`
        }}
      >
        {winnerFighter?.name} WINS!
      </h2>

      <p className="text-xl md:text-3xl text-gray-400 tracking-wider mb-8 md:mb-12" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
        FLAWLESS VICTORY
      </p>

      <div className="flex flex-col md:flex-row gap-4">
        <button
          onClick={onRematch}
          className="px-8 py-3 text-lg md:text-xl font-black tracking-widest rounded transition-all hover:scale-105 active:scale-95 touch-manipulation"
          style={{
            backgroundColor: color,
            color: '#000'
          }}
        >
          REMATCH
        </button>
        <button
          onClick={onMenu}
          className="px-8 py-3 text-lg md:text-xl font-black tracking-widest rounded border-2 transition-all hover:scale-105 active:scale-95 touch-manipulation"
          style={{
            borderColor: color,
            color: color,
            backgroundColor: 'transparent'
          }}
        >
          MAIN MENU
        </button>
      </div>
    </div>
  )
}

// Main App
export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'menu',
    winner: null,
    round: 1
  })

  const [fighters, setFighters] = useState<Fighter[]>([
    {
      id: 1,
      name: 'PLAYER 1',
      faceImage: null,
      health: 100,
      maxHealth: 100,
      position: [-2, 0, 0],
      color: '#3366ff',
      isAttacking: false,
      isBlocking: false,
      isHit: false
    },
    {
      id: 2,
      name: 'PLAYER 2',
      faceImage: null,
      health: 100,
      maxHealth: 100,
      position: [2, 0, 0],
      color: '#ff3366',
      isAttacking: false,
      isBlocking: false,
      isHit: false
    }
  ])

  const handleUpdateFighter = useCallback((id: number, updates: Partial<Fighter>) => {
    setFighters(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  }, [])

  const handleAttack = useCallback((attackerId: number) => {
    if (gameState.phase !== 'fight') return

    const attacker = fighters.find(f => f.id === attackerId)
    const defender = fighters.find(f => f.id !== attackerId)

    if (!attacker || !defender) return

    // Set attacking animation
    setFighters(prev => prev.map(f =>
      f.id === attackerId ? { ...f, isAttacking: true } : f
    ))

    // Calculate damage
    setTimeout(() => {
      const damage = defender.isBlocking ? 5 : 15 + Math.floor(Math.random() * 10)
      const newHealth = Math.max(0, defender.health - damage)

      setFighters(prev => prev.map(f => {
        if (f.id === attackerId) return { ...f, isAttacking: false }
        if (f.id === defender.id) return { ...f, health: newHealth, isHit: true }
        return f
      }))

      // Clear hit animation
      setTimeout(() => {
        setFighters(prev => prev.map(f =>
          f.id === defender.id ? { ...f, isHit: false } : f
        ))
      }, 200)

      // Check for victory
      if (newHealth <= 0) {
        setGameState(prev => ({ ...prev, phase: 'victory', winner: attackerId }))
      }
    }, 150)
  }, [fighters, gameState.phase])

  const handleBlock = useCallback((fighterId: number) => {
    if (gameState.phase !== 'fight') return
    setFighters(prev => prev.map(f =>
      f.id === fighterId ? { ...f, isBlocking: true } : f
    ))
  }, [gameState.phase])

  const handleStopBlock = useCallback((fighterId: number) => {
    setFighters(prev => prev.map(f =>
      f.id === fighterId ? { ...f, isBlocking: false } : f
    ))
  }, [])

  const resetFight = useCallback(() => {
    setFighters(prev => prev.map(f => ({
      ...f,
      health: f.maxHealth,
      isAttacking: false,
      isBlocking: false,
      isHit: false
    })))
    setGameState(prev => ({ ...prev, phase: 'fight', winner: null }))
  }, [])

  const goToMenu = useCallback(() => {
    setFighters(prev => prev.map(f => ({
      ...f,
      health: f.maxHealth,
      isAttacking: false,
      isBlocking: false,
      isHit: false
    })))
    setGameState({ phase: 'menu', winner: null, round: 1 })
  }, [])

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative" style={{ fontFamily: "'Bebas Neue', 'Arial Black', sans-serif" }}>
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 2, 6], fov: 60 }}
        gl={{ antialias: true }}
      >
        <FightScene
          fighters={fighters}
          gameState={gameState}
          onAttack={handleAttack}
          onBlock={handleBlock}
          onStopBlock={handleStopBlock}
        />
      </Canvas>

      {/* UI Overlays */}
      {gameState.phase === 'menu' && (
        <MainMenu onStart={() => setGameState(prev => ({ ...prev, phase: 'setup' }))} />
      )}

      {gameState.phase === 'setup' && (
        <SetupScreen
          fighters={fighters}
          onUpdateFighter={handleUpdateFighter}
          onStartFight={() => setGameState(prev => ({ ...prev, phase: 'fight' }))}
        />
      )}

      {gameState.phase === 'fight' && (
        <>
          {/* Health Bars */}
          <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
            <HealthBar fighter={fighters[0]} side="left" />
            <div className="text-2xl md:text-4xl font-black text-orange-500" style={{ textShadow: '0 0 20px rgba(255, 107, 0, 0.8)' }}>
              VS
            </div>
            <HealthBar fighter={fighters[1]} side="right" />
          </div>

          {/* Fight Controls */}
          <div className="absolute bottom-20 left-4 right-4 flex justify-between z-10">
            <GameControls
              onAttack={() => handleAttack(fighters[0].id)}
              onBlock={() => handleBlock(fighters[0].id)}
              onStopBlock={() => handleStopBlock(fighters[0].id)}
              side="left"
            />
            <GameControls
              onAttack={() => handleAttack(fighters[1].id)}
              onBlock={() => handleBlock(fighters[1].id)}
              onStopBlock={() => handleStopBlock(fighters[1].id)}
              side="right"
            />
          </div>

          {/* Round indicator */}
          <div className="absolute top-16 md:top-20 left-1/2 -translate-x-1/2 z-10">
            <span className="text-sm md:text-lg text-gray-500 tracking-widest">ROUND {gameState.round}</span>
          </div>
        </>
      )}

      {gameState.phase === 'victory' && gameState.winner && (
        <VictoryScreen
          winner={gameState.winner}
          fighters={fighters}
          onRematch={resetFight}
          onMenu={goToMenu}
        />
      )}

      {/* Footer */}
      <div className="absolute bottom-2 left-0 right-0 text-center z-10">
        <p className="text-[10px] md:text-xs text-gray-600 tracking-wider">
          Requested by @Salmong · Built by @clonkbot
        </p>
      </div>
    </div>
  )
}
