import { motion } from "motion/react";

type VisualizerState = "idle" | "listening" | "processing" | "speaking";

interface VisualizerProps {
  state: VisualizerState;
}

export default function Visualizer({ state }: VisualizerProps) {
  const getRingAnimation = (index: number, reverse: boolean = false) => {
    const baseSpeed = state === "listening" ? 3 : state === "processing" ? 1.5 : state === "speaking" ? 2 : 15;
    return {
      rotate: reverse ? [-360, 0] : [0, 360],
      transition: { duration: baseSpeed + index * 2, repeat: Infinity, ease: "linear" }
    };
  };

  const getPulseAnimation = () => {
    if (state === "speaking") {
      return {
        scale: [1, 1.05, 0.98, 1.02, 1],
        opacity: [0.8, 1, 0.8, 1, 0.8],
        transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
      };
    }
    if (state === "listening") {
      return {
        scale: [1, 1.02, 1],
        opacity: [0.7, 1, 0.7],
        transition: { duration: 1, repeat: Infinity, ease: "easeInOut" }
      };
    }
    if (state === "processing") {
      return {
        scale: [0.98, 1.02, 0.98],
        opacity: [0.6, 0.9, 0.6],
        transition: { duration: 0.8, repeat: Infinity, ease: "linear" }
      };
    }
    return {
      scale: [1, 1.01, 1],
      opacity: [0.4, 0.6, 0.4],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    };
  };

  // Hacker color palette (Matrix Green / Cyberpunk Red) + Colorful Additions
  const getTheme = () => {
    switch (state) {
      case "listening": return { 
        color: "rgba(0, 255, 159, 1)", 
        secondary: "rgba(0, 229, 255, 1)",
        glow: "shadow-[#00ff9f]/60", 
        border: "border-[#00ff9f]" 
      };
      case "processing": return { 
        color: "rgba(255, 235, 59, 1)", 
        secondary: "rgba(255, 152, 0, 1)",
        glow: "shadow-[#ffeb3b]/80", 
        border: "border-[#ffeb3b]" 
      };
      case "speaking": return { 
        color: "rgba(255, 0, 60, 1)", 
        secondary: "rgba(156, 39, 176, 1)",
        glow: "shadow-[#ff003c]/80", 
        border: "border-[#ff003c]" 
      };
      default: return { 
        color: "rgba(0, 255, 159, 0.4)", 
        secondary: "rgba(255, 61, 0, 0.4)",
        glow: "shadow-[#00ff9f]/20", 
        border: "border-[#00ff9f]/30" 
      };
    }
  };

  const theme = getTheme();

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none font-mono">
      {/* Ambient Glow Gradient */}
      <motion.div
        animate={getPulseAnimation()}
        className={`absolute w-[70%] h-[70%] rounded-full blur-[120px] opacity-20`}
        style={{ 
          background: `radial-gradient(circle, ${theme.color} 0%, ${theme.secondary} 100%)`,
        }}
      />

      {/* Ring 1: Massive Outer Dashed (Vibrant) */}
      <motion.div
        animate={getRingAnimation(4, false)}
        className={`absolute w-[100%] h-[100%] rounded-full border-[1px] border-dashed opacity-20`}
        style={{ borderColor: theme.color }}
      />

      {/* Ring 2: Segmented Thick Ring (Vibrant) */}
      <motion.div
        animate={getRingAnimation(3, true)}
        className={`absolute w-[85%] h-[85%] rounded-full border-[3px] border-dotted opacity-30`}
        style={{ borderColor: theme.secondary }}
      />

      {/* Ring 3: Scanner Ring (Solid Gradient) */}
      <motion.div
        animate={getRingAnimation(2, false)}
        className={`absolute w-[70%] h-[70%] rounded-full border-[2px] border-t-transparent border-b-transparent opacity-40`}
        style={{ borderColor: theme.color }}
      />

      {/* Ring 4: Inner Dashed (Vibrant) */}
      <motion.div
        animate={getRingAnimation(1, true)}
        className={`absolute w-[55%] h-[55%] rounded-full border-[2px] border-dashed opacity-50`}
        style={{ borderColor: theme.secondary }}
      />
      
      {/* Ring 5: Core HUD Ring (Strong Color) */}
      <motion.div
        animate={getRingAnimation(0, false)}
        className={`absolute w-[40%] h-[40%] rounded-full border-[5px] border-dotted opacity-80`}
        style={{ borderColor: theme.color }}
      />

      {/* Tech HUD Artifacts */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] border-l-2 border-r-2 opacity-5 animate-pulse`} style={{ borderColor: theme.color }} />
        {[0, 90, 180, 270].map(rot => (
          <div 
            key={rot} 
            className={`absolute top-1/2 left-1/2 w-48 h-[1px] opacity-40`}
            style={{ 
              transform: `translate(-50%, -50%) rotate(${rot}deg) translateX(400px)`,
              backgroundColor: theme.secondary
            }}
          >
            <div 
              className={`w-3 h-3 rounded-full absolute -right-1.5 -top-1 blur-[2px]`} 
              style={{ backgroundColor: theme.color }} 
            />
          </div>
        ))}
      </div>

      {/* Core Circle */}
      <motion.div
        animate={getPulseAnimation()}
        className={`absolute w-[28%] h-[28%] rounded-sm border-2 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]`}
        style={{ 
          borderColor: theme.color,
          boxShadow: `0 0 50px ${theme.color}, inset 0 0 40px ${theme.secondary}` 
        }}
      >
        <div 
          className="font-bold tracking-[0.2em] text-xl md:text-3xl lg:text-4xl text-white glitch-text mb-1"
        >
          IFFIKIRA
        </div>
        <div className="h-[2px] w-1/2 bg-white/40" />
        <div className="text-[10px] mt-2 opacity-80 tracking-[0.4em] font-bold font-mono whitespace-nowrap" style={{ color: theme.secondary }}>
          {state.toUpperCase()}_MODE
        </div>
      </motion.div>
    </div>
  );
}
