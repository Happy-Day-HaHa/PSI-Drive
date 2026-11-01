// 사진 대신 쓰는 벡터 장면이다. 실제 차량이나 장소를 나타내지 않는다.

const towers: [number, number, number, string][] = [
  [600, 22, 44, "#b9cbe6"],
  [628, 30, 66, "#a9bfe0"],
  [664, 24, 50, "#bfd0ea"],
  [694, 34, 92, "#8fa9d3"],
  [734, 26, 70, "#a4bbdf"],
  [766, 36, 118, "#7f9dcc"],
  [808, 28, 84, "#9ab3da"],
  [842, 40, 138, "#7392c6"],
  [888, 30, 98, "#8fa9d3"],
  [924, 38, 124, "#7f9dcc"],
  [968, 28, 78, "#a4bbdf"],
  [1002, 32, 96, "#99b2d9"],
  [1040, 24, 58, "#b3c7e4"],
  [1070, 30, 72, "#a9bfe0"],
];

const treeBlobs: [number, number, number, string][] = [
  [1120, 190, 20, "#a9c9ae"],
  [1150, 180, 26, "#9dc0a4"],
  [1186, 170, 30, "#90b89a"],
  [1224, 156, 36, "#8ab295"],
  [1266, 142, 42, "#7fa98b"],
  [1312, 126, 48, "#769f83"],
  [1362, 112, 56, "#6e977b"],
  [1404, 100, 60, "#668f73"],
  [1206, 190, 24, "#9ec2a6"],
  [1252, 182, 30, "#92b89c"],
  [1302, 172, 36, "#86ae91"],
  [1356, 162, 42, "#7ba487"],
];

export function HeroScene() {
  return (
    <svg
      viewBox="0 0 1400 320"
      preserveAspectRatio="xMaxYMax slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9dcf8" />
          <stop offset="0.7" stopColor="#eaf1fc" />
          <stop offset="1" stopColor="#f5f8fe" />
        </linearGradient>
        <linearGradient id="asphalt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#aab6ca" />
          <stop offset="0.45" stopColor="#7d8aa2" />
          <stop offset="1" stopColor="#5b6880" />
        </linearGradient>
        <linearGradient id="carBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#dfe6f1" />
          <stop offset="1" stopColor="#aebbd0" />
        </linearGradient>
        <linearGradient id="carGlass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#40526f" />
          <stop offset="1" stopColor="#1c2a42" />
        </linearGradient>
        <linearGradient id="fadeLeft" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--color-canvas)" />
          <stop offset="0.3" stopColor="var(--color-canvas)" stopOpacity="0.92" />
          <stop offset="0.5" stopColor="var(--color-canvas)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="1400" height="320" fill="url(#sky)" />

      {towers.map(([x, w, h, fill]) => (
        <g key={x}>
          <rect x={x} y={214 - h} width={w} height={h} fill={fill} rx="1.5" />
          {h > 80 &&
            Array.from({ length: Math.floor(h / 16) }, (_, row) => (
              <rect
                key={row}
                x={x + 4}
                y={214 - h + 7 + row * 16}
                width={w - 8}
                height="3"
                fill="#ffffff"
                opacity="0.28"
              />
            ))}
        </g>
      ))}

      <path d="M520 214c60-22 150-26 230-16s170 2 260-8 90 20 90 24z" fill="#8fb39a" opacity="0.75" />
      {treeBlobs.map(([cx, cy, r, fill]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={fill} />
      ))}
      <rect x="1100" y="198" width="300" height="20" fill="#86ae91" />

      <path d="M0 214h1400v106H0z" fill="#dfe8f5" />
      <path d="M800 208 330 320h1070V252L860 208z" fill="url(#asphalt)" />
      <path d="M806 208 396 320h22l394-112z" fill="#ffffff" opacity="0.85" />
      <path d="M854 208 1400 268v8L850 208z" fill="#ffffff" opacity="0.75" />
      {[
        [832, 214, 836, 214, 835, 222, 829, 222],
        [826, 232, 834, 232, 831, 248, 820, 248],
        [814, 266, 829, 266, 825, 296, 802, 296],
      ].map((p) => (
        <polygon key={p[0]} points={p.join(",")} fill="#ffffff" opacity="0.8" />
      ))}

      <path d="M868 206 1400 238" stroke="#cfd9e8" strokeWidth="3" />
      <path d="M868 210 1400 248" stroke="#9fb0c8" strokeWidth="5" />
      {[960, 1040, 1120, 1200, 1280, 1360].map((x) => (
        <rect key={x} x={x} y={208 + (x - 868) * 0.066} width="4" height={8 + (x - 868) * 0.02} fill="#8799b4" />
      ))}

      <g transform="translate(985 128) scale(0.82)">
        <ellipse cx="118" cy="128" rx="136" ry="13" fill="#1c2a42" opacity="0.35" />
        <rect x="26" y="96" width="36" height="32" rx="7" fill="#1a2334" />
        <rect x="174" y="96" width="36" height="32" rx="7" fill="#1a2334" />
        <path
          d="M12 74c0-10 6-17 15-21l20-7 18-30C69 9 76 5 84 5h68c8 0 15 4 19 11l18 30 20 7c9 4 15 11 15 21v28c0 8-6 14-14 14H26c-8 0-14-6-14-14z"
          fill="url(#carBody)"
        />
        <path d="M60 44 74 20c3-5 7-7 12-7h64c5 0 9 2 12 7l14 24c-38-4-78-4-116 0z" fill="url(#carGlass)" />
        <path d="M14 60c28-10 62-13 104-13s76 3 104 13v8c-28-7-62-10-104-10S42 61 14 68z" fill="#ffffff" opacity="0.8" />
        <path d="M18 62h42c2 0 3 2 2 4l-3 5c-1 1-2 2-4 2H20c-3 0-5-2-5-5v-3c0-2 1-3 3-3z" fill="#d6283c" />
        <path d="M218 62h-42c-2 0-3 2-2 4l3 5c1 1 2 2 4 2h35c3 0 5-2 5-5v-3c0-2-1-3-3-3z" fill="#d6283c" />
        <rect x="62" y="65" width="112" height="4" rx="2" fill="#d6283c" opacity="0.6" />
        <rect x="92" y="80" width="52" height="16" rx="3" fill="#f3f6fb" stroke="#8fa0ba" />
        <path d="M34 104h168" stroke="#8d9db6" strokeWidth="3" strokeLinecap="round" />
      </g>

      <rect width="1400" height="320" fill="url(#fadeLeft)" />
    </svg>
  );
}
