import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import './Hero3D.css';

// 3D Shoe Model Component
function ShoeModel({ modelPath, onLoad }) {
  const { scene } = useGLTF(modelPath);
  const meshRef = useRef();

  // Call onLoad when model is ready
  React.useEffect(() => {
    if (scene && onLoad) {
      onLoad();
    }
  }, [scene, onLoad]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.2; // Slow auto-rotation
      meshRef.current.position.y = Math.sin(t) * 0.08;
    }
  });

  return (
    <primitive 
      ref={meshRef}
      object={scene} 
      scale={1.5}
      position={[0, -0.5, 0]}
    />
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[2, 1, 3]} />
      <meshStandardMaterial color="#ff4d2e" wireframe />
    </mesh>
  );
}

function Hero3D() {
  const [modelLoaded, setModelLoaded] = useState(false);

  return (
    <section className="hero-3d" id="hero">
      <div className="hero-container">
        {/* Left Side - 3D Model */}
        <div className="hero-left">
          <div className="canvas-wrapper">
            {!modelLoaded && (
              <div className="loading-text">LOADING 3D MODEL...</div>
            )}
            <Canvas
              camera={{ position: [0, 1, 6], fov: 50 }}
              style={{ width: '100%', height: '100%' }}
              gl={{ alpha: true, antialias: true }}
            >
              <Suspense fallback={<LoadingFallback />}>
                {/* Enhanced Lighting */}
                <ambientLight intensity={0.8} />
                <directionalLight position={[5, 5, 5]} intensity={1.5} castShadow />
                <spotLight 
                  position={[10, 10, 10]} 
                  angle={0.3} 
                  penumbra={1} 
                  intensity={2}
                  color="#ffffff"
                  castShadow 
                />
                <pointLight position={[-5, 0, -5]} intensity={1} color="#00f0ff" />
                <pointLight position={[5, 0, 5]} intensity={1} color="#ff4d2e" />
                
                <ShoeModel 
                  modelPath="/3D-model/scene.gltf" 
                  onLoad={() => setModelLoaded(true)}
                />

                <ContactShadows 
                  position={[0, -2, 0]} 
                  opacity={0.6} 
                  scale={15} 
                  blur={2.5} 
                  far={4} 
                  color="#000000"
                />
                <Environment preset="studio" />
              </Suspense>
              
              <OrbitControls 
                enableZoom={false}
                enablePan={false}
                enableRotate={false}
              />
            </Canvas>
          </div>
        </div>

        {/* Right Side - Quote/Text */}
        <div className="hero-right">
          <div className="telemetry-badge">
            <span className="status-dot pulse-glow"></span>
            <span className="telemetry-label">BIOMECHANICAL TELEMETRY</span>
          </div>
          
          <h1 className="hero-title">
            <span className="display-xl gradient-text">PROPULSION</span>
            <span className="headline-lg">UNBOUND</span>
          </h1>
          
          <p className="hero-quote body-lg">
            "Ultra-compressed carbon-plate geometries engineered for maximum ground force amplification. 
            Lab-validated velocity gains across 5K to marathon distances."
          </p>

          <div className="hero-metrics">
            <div className="metric-item">
              <span className="metric-value">14.8%</span>
              <span className="metric-label">ENERGY RETURN</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-item">
              <span className="metric-value">179g</span>
              <span className="metric-label">WEIGHT</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-item">
              <span className="metric-value">3.2mm</span>
              <span className="metric-label">DROP</span>
            </div>
          </div>

          <div className="hero-actions">
            <button className="btn-primary">
              <span>EXPLORE COLLECTION</span>
              <span className="btn-icon">→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero3D;
