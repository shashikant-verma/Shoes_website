import React, { useState } from 'react';
import './Hero3D.css';

// Featured hero showcase models backed by real catalog specifications
const HERO_SHOWCASE_MODELS = [
  {
    id: 'urban-relay',
    name: 'SOLEVIBE URBAN RELAY',
    badge: 'EVERYDAY MOVEMENT',
    tagline: 'LIGHTWEIGHT COMFORT',
    quote: 'Engineered for daily tempo and road movement with an open-cell breathable mesh upper and responsive EVA midsole cushioning.',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=85',
    featureBadge: '⚡ RESPONSIVE EVA FOAM',
    weight: '180g',
    drop: '3mm',
    color: '#ff4d2e'
  },
  {
    id: 'street-flex',
    name: 'SOLEVIBE STREET FLEX',
    badge: 'ACTIVE ROTATION',
    tagline: 'FLEXIBILITY UNCOMPROMISED',
    quote: 'Crafted with a flexible rubber outsole and supportive midfoot wrap for natural foot articulation across all-day wear.',
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=1200&q=85',
    featureBadge: '⚡ FLEXIBLE GRIP OUTSOLE',
    weight: '193g',
    drop: '4mm',
    color: '#00f0ff'
  },
  {
    id: 'ozark-ridge',
    name: 'SOLEVIBE OZARK RIDGE RUNNER',
    badge: 'ALL-TERRAIN ENDURANCE',
    tagline: 'RUGGED OUTDOOR TRACTION',
    quote: 'Reinforced protective upper with multi-directional geometric lug geometry designed for stability across trails and outdoor paths.',
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&q=85',
    featureBadge: '⚡ ALL-TERRAIN LUGS',
    weight: '206g',
    drop: '5mm',
    color: '#f59e0b'
  }
];

function Hero3D({ onExplore }) {
  const [activeModelIndex, setActiveModelIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  const activeModel = HERO_SHOWCASE_MODELS[activeModelIndex] || HERO_SHOWCASE_MODELS[0];

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20; // -10 to +10 deg
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -20;
    setMouseOffset({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMouseOffset({ x: 0, y: 0 });
  };

  return (
    <section className="hero-3d" id="hero" aria-label="Featured Footwear Showcase">
      <div className="hero-container">
        {/* Left Side: High-Resolution Telemetry Shoe Showcase with 3D Tilt */}
        <div className="hero-left">
          <div 
            className="canvas-wrapper hero-interactive-card"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              perspective: '1000px'
            }}
          >
            {/* Visual glow backdrop */}
            <div 
              style={{
                position: 'absolute',
                width: '320px',
                height: '320px',
                background: `radial-gradient(circle, ${activeModel.color}35 0%, transparent 70%)`,
                filter: 'blur(40px)',
                zIndex: 1,
                pointerEvents: 'none'
              }}
            />

            {/* High-Resolution Hero Shoe with 3D Mouse Parallax */}
            <div 
              className="hero-3d-shoe-frame"
              style={{
                transform: `rotateX(${mouseOffset.y}deg) rotateY(${mouseOffset.x}deg) scale(${isHovered ? 1.05 : 1})`,
                transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                zIndex: 2,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src={activeModel.image}
                alt={activeModel.name}
                style={{
                  maxWidth: '90%',
                  maxHeight: '420px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 25px 35px rgba(0, 0, 0, 0.65))',
                  userSelect: 'none'
                }}
              />

              {/* Floating Technology Pin */}
              <div 
                style={{
                  position: 'absolute',
                  top: '15%',
                  right: '10%',
                  background: 'rgba(11, 12, 16, 0.88)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${activeModel.color}`,
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#fff',
                  letterSpacing: '1px',
                  boxShadow: `0 0 15px ${activeModel.color}50`
                }}
              >
                {activeModel.featureBadge}
              </div>
            </div>

            {/* Interactive Model Switcher Thumbnails */}
            <div 
              style={{
                display: 'flex',
                gap: '12px',
                zIndex: 10,
                marginTop: '1.5rem'
              }}
              role="tablist"
              aria-label="Model switcher"
            >
              {HERO_SHOWCASE_MODELS.map((m, idx) => (
                <button
                  key={m.id}
                  onClick={() => setActiveModelIndex(idx)}
                  role="tab"
                  aria-selected={activeModelIndex === idx}
                  aria-label={`Select ${m.name}`}
                  style={{
                    padding: '7px 16px',
                    background: activeModelIndex === idx ? '#111827' : '#FFFFFF',
                    color: activeModelIndex === idx ? '#FFFFFF' : '#4B5563',
                    border: `1px solid ${activeModelIndex === idx ? '#111827' : '#E5E7EB'}`,
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    letterSpacing: '0.5px',
                    boxShadow: activeModelIndex === idx ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none'
                  }}
                >
                  {m.name.replace('SOLEVIBE ', '')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Telemetry Specs & Copy */}
        <div className="hero-right">
          <div className="telemetry-badge">
            <span className="status-dot pulse-glow" style={{ background: activeModel.color }}></span>
            <span className="telemetry-label">{activeModel.badge}</span>
          </div>
          
          <h1 className="hero-title">
            <span className="display-xl gradient-text">{activeModel.name}</span>
            <span className="headline-lg">{activeModel.tagline}</span>
          </h1>
          
          <p className="hero-quote body-lg">
            "{activeModel.quote}"
          </p>

          <div className="hero-metrics">
            <div className="metric-item">
              <span className="metric-value">{activeModel.weight}</span>
              <span className="metric-label">WEIGHT</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-item">
              <span className="metric-value">{activeModel.drop}</span>
              <span className="metric-label">DROP</span>
            </div>
          </div>

          <div className="hero-actions">
            <button 
              className="btn-primary" 
              onClick={() => onExplore ? onExplore('shop') : (window.location.hash = '#products')}
              aria-label="Explore collection"
            >
              <span>EXPLORE COLLECTION</span>
              <span className="btn-icon" aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero3D;
