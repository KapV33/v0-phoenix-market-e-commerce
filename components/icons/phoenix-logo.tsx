export function PhoenixLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="phoenixGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="50%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      
      {/* Phoenix bird silhouette with flames */}
      <path
        d="M100 20 C95 25, 90 30, 88 38 L85 50 C83 55, 80 60, 75 63 L65 70 C60 73, 58 78, 60 85 C62 92, 68 95, 75 93 L85 90 C90 88, 95 90, 98 95 L105 110 C107 115, 105 120, 100 123 C95 126, 90 125, 87 120 L80 108 C78 103, 75 100, 70 100 L55 100 C50 100, 45 103, 43 108 C41 113, 42 118, 46 122 L60 135 C65 140, 68 146, 68 153 L68 165 C68 172, 70 178, 75 182 L85 190 C90 194, 95 195, 100 193 C105 191, 108 186, 108 180 L108 165 C108 158, 110 152, 115 148 L130 135 C135 130, 138 123, 137 116 C136 109, 132 103, 125 100 L115 95 C110 93, 108 88, 110 83 L118 65 C120 60, 125 57, 130 57 L145 57 C150 57, 155 55, 158 50 C161 45, 160 40, 156 36 L142 23 C137 18, 130 15, 123 15 L100 20 Z M100 45 C105 45, 110 50, 110 55 C110 60, 105 65, 100 65 C95 65, 90 60, 90 55 C90 50, 95 45, 100 45 Z"
        fill="url(#phoenixGradient)"
        style={{ filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.5))' }}
      />
      
      {/* Wing flames - left */}
      <path
        d="M50 75 Q45 85, 40 95 Q38 100, 42 103 Q48 105, 52 98 Q55 90, 58 82 Q60 78, 56 76 Q52 74, 50 75 Z"
        fill="url(#phoenixGradient)"
        opacity="0.8"
      />
      
      {/* Wing flames - right */}
      <path
        d="M150 75 Q155 85, 160 95 Q162 100, 158 103 Q152 105, 148 98 Q145 90, 142 82 Q140 78, 144 76 Q148 74, 150 75 Z"
        fill="url(#phoenixGradient)"
        opacity="0.8"
      />
      
      {/* Tail flames */}
      <path
        d="M85 155 Q80 165, 75 175 Q73 180, 77 183 Q82 185, 87 178 Q92 170, 95 162 L100 150 L105 162 Q108 170, 113 178 Q118 185, 123 183 Q127 180, 125 175 Q120 165, 115 155 Q110 148, 100 148 Q90 148, 85 155 Z"
        fill="url(#phoenixGradient)"
        opacity="0.9"
      />
    </svg>
  )
}
