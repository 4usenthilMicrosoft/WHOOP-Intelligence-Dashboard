import React from 'react';

interface CircularProgressProps {
  value: number;
  max?: number;
  color: string;
  label: string;
  size?: number;
  strokeWidth?: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ 
  value, 
  max = 100, 
  color, 
  label, 
  size = 150, 
  strokeWidth = 12 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeValue = Math.min(Math.max(value, 0), max);
  const offset = circumference - (safeValue / max) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '10px' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#2A2A2A"
          strokeWidth={strokeWidth}
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {/* Text */}
        <text
          x="50%"
          y="50%"
          dy=".3em"
          textAnchor="middle"
          fill="white"
          fontSize={size * 0.22}
          fontWeight="bold"
        >
          {label}
        </text>
      </svg>
    </div>
  );
};

export default CircularProgress;
