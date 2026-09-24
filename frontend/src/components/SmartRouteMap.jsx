import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Truck, Warehouse, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function SmartRouteMap({ routeData, onSelectStop }) {
  const [activeStep, setActiveStep] = useState(0);
  const [animating, setAnimating] = useState(true);

  // Coordinate projection mapping for Coimbatore & Pollachi region
  // Latitude: ~10.6 to 11.1
  // Longitude: ~76.8 to 77.2
  const minLat = 10.60;
  const maxLat = 11.10;
  const minLng = 76.80;
  const maxLng = 77.25;

  const projectToSvg = (lat, lng) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 740 + 60;
    // Invert Y because SVG coordinates increase downwards
    const y = 360 - (((lat - minLat) / (maxLat - minLat)) * 300 + 30);
    return { x: Math.max(40, Math.min(820, x)), y: Math.max(30, Math.min(340, y)) };
  };

  const waypoints = routeData?.waypoints || [
    { step: 1, role: "Farmer Pickup", name: "Farmer A (Kinathukadavu)", location: "Kinathukadavu", quantity_kg: 100, lat: 10.8167, lng: 77.0167 },
    { step: 2, role: "Farmer Pickup", name: "Farmer B (Negamam)", location: "Negamam", quantity_kg: 150, lat: 10.7412, lng: 77.1021 },
    { step: 3, role: "Farmer Pickup", name: "Farmer C (Sulur)", location: "Sulur", quantity_kg: 250, lat: 11.0267, lng: 77.1264 },
    { step: 4, role: "Virtual FPO Hub", name: "Pollachi Pre-cooling Hub", location: "Pollachi Hub", quantity_kg: 500, lat: 10.6609, lng: 77.0048 },
    { step: 5, role: "Buyer Destination", name: "Coimbatore Wholesale Buyer", location: "Coimbatore Market", quantity_kg: 500, lat: 11.0168, lng: 76.9558 },
  ];

  const projectedPoints = waypoints.map(w => ({
    ...w,
    ...projectToSvg(w.lat, w.lng)
  }));

  // Build SVG path
  const pathD = projectedPoints.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, "");

  useEffect(() => {
    if (!animating) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % projectedPoints.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [animating, projectedPoints.length]);

  return (
    <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2ece6', padding: '16px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: '#ecfdf5', padding: '6px', borderRadius: '8px', color: '#108e56' }}>
            <Navigation size={18} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0a2f1d' }}>
            GIS Optimized Multi-Stop Routing Topology (Google OR-Tools Heuristic)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setAnimating(!animating)}
            style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '6px', background: animating ? '#ecfdf5' : '#f1f5f3', border: '1px solid #cbdcd3', cursor: 'pointer', fontWeight: 600, color: animating ? '#059669' : '#4b6357' }}
          >
            {animating ? '● Live Simulation Active' : '▶ Play Simulation'}
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', height: '360px', background: 'linear-gradient(180deg, #f4faf6 0%, #eaf4ef 100%)', borderRadius: '12px', border: '1px solid #cbdcd3', overflow: 'hidden' }}>
        {/* District grid lines */}
        <svg width="100%" height="100%" viewBox="0 0 880 360" style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          <line x1="40" y1="90" x2="840" y2="90" stroke="#d5e8dc" strokeDasharray="4 4" />
          <line x1="40" y1="180" x2="840" y2="180" stroke="#d5e8dc" strokeDasharray="4 4" />
          <line x1="40" y1="270" x2="840" y2="270" stroke="#d5e8dc" strokeDasharray="4 4" />
          <line x1="220" y1="20" x2="220" y2="340" stroke="#d5e8dc" strokeDasharray="4 4" />
          <line x1="440" y1="20" x2="440" y2="340" stroke="#d5e8dc" strokeDasharray="4 4" />
          <line x1="660" y1="20" x2="660" y2="340" stroke="#d5e8dc" strokeDasharray="4 4" />

          {/* District Labels */}
          <text x="50" y="45" fill="#88a896" fontSize="11" fontWeight="600">Coimbatore North</text>
          <text x="450" y="45" fill="#88a896" fontSize="11" fontWeight="600">Sulur / Tiruppur Border</text>
          <text x="240" y="335" fill="#88a896" fontSize="11" fontWeight="600">Pollachi Rural Agro-Belt</text>

          {/* Base Road Polyline */}
          <path d={pathD} fill="none" stroke="#b7d6c5" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          {/* Animated Active Route Polyline */}
          <path d={pathD} fill="none" stroke="url(#routeGradient)" strokeWidth="3.5" strokeDasharray="8 6" strokeLinecap="round" strokeLinejoin="round">
            <animate attributeName="stroke-dashoffset" from="100" to="0" dur="3s" repeatCount="indefinite" />
          </path>

          {/* Waypoint nodes */}
          {projectedPoints.map((pt, i) => {
            const isFarmer = pt.role.includes("Farmer");
            const isHub = pt.role.includes("Hub");
            const isBuyer = pt.role.includes("Buyer");
            const isActive = activeStep === i;

            return (
              <g key={i} onClick={() => { setActiveStep(i); onSelectStop && onSelectStop(pt); }} style={{ cursor: 'pointer' }}>
                {/* Ripple ring for active step */}
                {isActive && (
                  <circle cx={pt.x} cy={pt.y} r="22" fill={isBuyer ? 'rgba(2, 132, 199, 0.2)' : isHub ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'}>
                    <animate attributeName="r" from="14" to="26" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="1" to="0" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Node Outer Circle */}
                <circle 
                  cx={pt.x} 
                  cy={pt.y} 
                  r="14" 
                  fill={isBuyer ? '#0284c7' : isHub ? '#f59e0b' : '#10b981'} 
                  stroke="#ffffff" 
                  strokeWidth="3"
                  filter="url(#glow)"
                />
                
                {/* Step number inside */}
                <text x={pt.x} y={pt.y + 4} textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                  {i + 1}
                </text>

                {/* Label Box */}
                <g transform={`translate(${pt.x}, ${pt.y + 24})`}>
                  <rect x="-65" y="-3" width="130" height="24" rx="6" fill="#0f241a" opacity="0.85" />
                  <text x="0" y="13" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="600">
                    {pt.location} ({pt.quantity_kg}kg)
                  </text>
                </g>
              </g>
            );
          })}

          {/* Vehicle Transit Icon along the current active step */}
          {projectedPoints[activeStep] && (
            <g transform={`translate(${projectedPoints[activeStep].x - 16}, ${projectedPoints[activeStep].y - 38})`}>
              <rect width="32" height="22" rx="6" fill="#0a2f1d" stroke="#34d399" strokeWidth="1.5" />
              <text x="16" y="15" textAnchor="middle" fill="#ffffff" fontSize="12">🚛</text>
            </g>
          )}
        </svg>

        {/* Legend Overlay */}
        <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', display: 'flex', gap: '14px', border: '1px solid #cbdcd3' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span>
            Farmer Pickups (A, B, C)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span>
            Virtual FPO Hub (Pre-cooling)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0284c7' }}></span>
            Buyer Destination
          </span>
        </div>
      </div>

      {/* Active Stop Card Info */}
      <div style={{ marginTop: '12px', padding: '12px', background: '#f8faf9', borderRadius: '10px', border: '1px solid #e2ece6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#108e56', fontWeight: 700 }}>
            Active Waypoint {activeStep + 1} of {projectedPoints.length}: {projectedPoints[activeStep]?.role}
          </div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0a2f1d' }}>
            {projectedPoints[activeStep]?.name}
          </div>
          <div style={{ fontSize: '0.84rem', color: '#4b6357' }}>
            Cargo Batch: {projectedPoints[activeStep]?.quantity_kg} kg | GPS: {projectedPoints[activeStep]?.lat.toFixed(4)}, {projectedPoints[activeStep]?.lng.toFixed(4)}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {projectedPoints.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: activeStep === idx ? '2px solid #10b981' : '1px solid #cbdcd3',
                background: activeStep === idx ? '#ecfdf5' : '#ffffff',
                fontWeight: 700,
                color: activeStep === idx ? '#059669' : '#4b6357',
                cursor: 'pointer'
              }}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
