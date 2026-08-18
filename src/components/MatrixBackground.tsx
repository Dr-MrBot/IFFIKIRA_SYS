import React from "react";
import { motion } from "motion/react";

const MatrixColumn = ({ char, x, delay, speed, color }: { char: string; x: number; delay: number; speed: number; color: string; key?: any }) => (
  <motion.div
    initial={{ y: -50, opacity: 0 }}
    animate={{ 
      y: ["0vh", "110vh"],
      opacity: [1, 1, 0]
    }}
    transition={{ 
      duration: speed, 
      delay, 
      repeat: Infinity, 
      ease: "linear" 
    }}
    className="absolute pointer-events-none font-mono text-[10px] select-none"
    style={{ left: `${x}%`, color }}
  >
    {char}
  </motion.div>
);

const Heart = ({ delay, x }: { delay: number; x: number; key?: any }) => (
  <motion.div
    initial={{ y: "110vh", opacity: 0 }}
    animate={{ 
      y: "-10vh", 
      opacity: [0, 1, 1, 0],
      x: [x + "vw", (x + (Math.random() * 10 - 5)) + "vw"] 
    }}
    transition={{ 
      duration: 5 + Math.random() * 5, 
      delay, 
      repeat: Infinity, 
      ease: "linear" 
    }}
    className="absolute bottom-0 text-red-500/20 pointer-events-none text-xl"
  >
    ❤️
  </motion.div>
);

const Dot = ({ delay, x, y }: { delay: number; x: number; y: number; key?: any }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ 
      opacity: [0, 0.3, 0],
    }}
    transition={{ 
      duration: 3 + Math.random() * 3, 
      delay, 
      repeat: Infinity, 
      ease: "easeInOut" 
    }}
    className="absolute w-1 h-1 bg-blue-400 rounded-full pointer-events-none"
    style={{ left: `${x}%`, top: `${y}%` }}
  />
);

export default function MatrixBackground({ mode }: { mode: "roast" | "lovely" | "normal" }) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&*";
  const color = mode === "roast" ? "#00ff9f33" : mode === "lovely" ? "#ff4d6d22" : "#3b82f611";
  
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {mode === "roast" ? (
        Array.from({ length: 50 }).map((_, i) => (
          <MatrixColumn 
            key={i}
            char={characters[Math.floor(Math.random() * characters.length)]}
            x={Math.random() * 100}
            delay={Math.random() * 7}
            speed={4 + Math.random() * 8}
            color={color}
          />
        ))
      ) : mode === "lovely" ? (
        Array.from({ length: 20 }).map((_, i) => (
          <Heart key={i} delay={i * 0.5} x={Math.random() * 100} />
        ))
      ) : (
        Array.from({ length: 40 }).map((_, i) => (
          <Dot key={i} delay={Math.random() * 5} x={Math.random() * 100} y={Math.random() * 100} />
        ))
      )}
    </div>
  );
}
