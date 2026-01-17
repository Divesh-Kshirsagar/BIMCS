import React from 'react';

const BoilerSchematic = ({ valvePosition = 50 }) => {
  // Determine valve color based on position
  const valveColor = valvePosition > 50 ? '#10b981' : '#f43f5e'; // emerald-500 or rose-500
  const valveStatus = valvePosition > 50 ? 'OPEN' : 'CLOSING';

  return (
    <div className="w-full h-full bg-slate-800 rounded-lg p-6 border-2 border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-cyan-400">Boiler System Schematic</h3>
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: valveColor }}
          />
          <span className="text-sm text-slate-300">Valve: {valveStatus}</span>
        </div>
      </div>

      <svg
        viewBox="0 0 600 400"
        className="w-full h-full"
        style={{ maxHeight: 'calc(100% - 3rem)' }}
      >
        {/* Definitions for gradients and patterns */}
        <defs>
          {/* Furnace gradient */}
          <linearGradient id="furnaceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#f59e0b', stopOpacity: 0.8 }} />
            <stop offset="50%" style={{ stopColor: '#dc2626', stopOpacity: 0.6 }} />
            <stop offset="100%" style={{ stopColor: '#7c2d12', stopOpacity: 0.9 }} />
          </linearGradient>

          {/* Steam drum gradient */}
          <linearGradient id="drumGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#64748b', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#334155', stopOpacity: 1 }} />
          </linearGradient>

          {/* Pipe gradient */}
          <linearGradient id="pipeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#475569', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#64748b', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#475569', stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* Furnace (Combustion Chamber) */}
        <g id="furnace">
          <rect
            x="50"
            y="220"
            width="180"
            height="150"
            fill="url(#furnaceGradient)"
            stroke="#f59e0b"
            strokeWidth="3"
            rx="8"
          />
          <text x="140" y="250" fill="#fbbf24" fontSize="14" fontWeight="bold" textAnchor="middle">
            FURNACE
          </text>
          <text x="140" y="270" fill="#fde68a" fontSize="11" textAnchor="middle">
            Combustion
          </text>

          {/* Flame indicators */}
          <circle cx="100" cy="320" r="8" fill="#fb923c" opacity="0.8">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="140" cy="330" r="10" fill="#f97316" opacity="0.8">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="180" cy="320" r="8" fill="#fb923c" opacity="0.8">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Riser Pipe (from Furnace to Steam Drum) */}
        <g id="riser">
          <rect
            x="195"
            y="80"
            width="30"
            height="140"
            fill="url(#pipeGradient)"
            stroke="#64748b"
            strokeWidth="2"
          />
          <text x="210" y="155" fill="#94a3b8" fontSize="10" textAnchor="middle" transform="rotate(-90, 210, 155)">
            RISER
          </text>

          {/* Steam flow indicator */}
          <circle cx="210" cy="120" r="3" fill="#06b6d4">
            <animate attributeName="cy" values="200;90;200" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Steam Drum */}
        <g id="steam-drum">
          <ellipse
            cx="350"
            cy="80"
            rx="150"
            ry="50"
            fill="url(#drumGradient)"
            stroke="#64748b"
            strokeWidth="3"
          />
          <text x="350" y="75" fill="#cbd5e1" fontSize="16" fontWeight="bold" textAnchor="middle">
            STEAM DRUM
          </text>
          <text x="350" y="95" fill="#94a3b8" fontSize="11" textAnchor="middle">
            Pressure Vessel
          </text>
          
          {/* Water level indicator */}
          <line x1="220" y1="80" x2="480" y2="80" stroke="#0891b2" strokeWidth="2" strokeDasharray="5,5">
            <animate attributeName="y1" values="78;82;78" dur="3s" repeatCount="indefinite" />
            <animate attributeName="y2" values="78;82;78" dur="3s" repeatCount="indefinite" />
          </line>
        </g>

        {/* Outlet Pipe (from Steam Drum) */}
        <g id="outlet">
          <rect
            x="485"
            y="65"
            width="80"
            height="30"
            fill="url(#pipeGradient)"
            stroke="#64748b"
            strokeWidth="2"
          />
          <text x="525" y="84" fill="#94a3b8" fontSize="10" textAnchor="middle">
            OUTLET
          </text>
        </g>

        {/* Control Valve */}
        <g id="valve" transform="translate(530, 80)">
          {/* Valve body */}
          <circle
            cx="0"
            cy="0"
            r="20"
            fill={valveColor}
            stroke="#1e293b"
            strokeWidth="3"
          />
          
          {/* Valve wheel */}
          <g transform={`rotate(${valvePosition * 3.6})`}>
            <line x1="-12" y1="0" x2="12" y2="0" stroke="#1e293b" strokeWidth="2" />
            <line x1="0" y1="-12" x2="0" y2="12" stroke="#1e293b" strokeWidth="2" />
            <circle cx="0" cy="-8" r="2" fill="#1e293b" />
            <circle cx="8" cy="0" r="2" fill="#1e293b" />
            <circle cx="0" cy="8" r="2" fill="#1e293b" />
            <circle cx="-8" cy="0" r="2" fill="#1e293b" />
          </g>

          {/* Valve position indicator */}
          <text x="0" y="35" fill={valveColor} fontSize="12" fontWeight="bold" textAnchor="middle">
            {Math.round(valvePosition)}%
          </text>
        </g>

        {/* Temperature Sensor Label */}
        <g id="temp-sensor">
          <rect
            x="520"
            y="120"
            width="60"
            height="25"
            fill="#1e293b"
            stroke="#06b6d4"
            strokeWidth="2"
            rx="4"
          />
          <text x="550" y="137" fill="#06b6d4" fontSize="11" fontWeight="bold" textAnchor="middle">
            TE-8332A
          </text>
          
          {/* Sensor connection line */}
          <line x1="550" y1="120" x2="550" y2="95" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="2,2" />
          <circle cx="550" cy="95" r="3" fill="#06b6d4" />
        </g>

        {/* Downcomer Pipe (from Steam Drum to Furnace) */}
        <g id="downcomer">
          <rect
            x="45"
            y="80"
            width="30"
            height="140"
            fill="url(#pipeGradient)"
            stroke="#64748b"
            strokeWidth="2"
          />
          <text x="60" y="155" fill="#94a3b8" fontSize="10" textAnchor="middle" transform="rotate(-90, 60, 155)">
            DOWN
          </text>

          {/* Water flow indicator */}
          <circle cx="60" cy="90" r="3" fill="#0891b2">
            <animate attributeName="cy" values="90;200;90" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.3;1" dur="3s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Connecting pipes */}
        <rect x="75" y="65" width="145" height="15" fill="url(#pipeGradient)" stroke="#64748b" strokeWidth="2" />

        {/* Flow direction arrows */}
        <g fill="#06b6d4" opacity="0.7">
          <polygon points="210,200 206,190 214,190" >
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
          </polygon>
          <polygon points="60,110 56,120 64,120" >
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
          </polygon>
        </g>
      </svg>
    </div>
  );
};

export default BoilerSchematic;
