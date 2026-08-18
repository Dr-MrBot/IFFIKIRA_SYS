import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Cpu, Activity, Battery, Clock, Wifi, X, Terminal } from "lucide-react";

interface SystemOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  sysInfo: { ip: string; platform: string; hostname: string; username: string; bridgeActive: boolean } | null;
  isOnline: boolean;
  battery: { level: number; charging: boolean } | null;
  currentTime: Date;
  mode: "roast" | "lovely";
}

export default function SystemOverlay({ 
  isOpen, 
  onClose, 
  sysInfo, 
  isOnline, 
  battery, 
  currentTime,
  mode 
}: SystemOverlayProps) {
  const accentColor = mode === "roast" ? "#00ff9f" : "#ff4d6d";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: 20 }}
          className="fixed bottom-32 right-6 w-72 z-50 overflow-hidden rounded-sm border-2 backdrop-blur-xl bg-black/60 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
          style={{ borderColor: `${accentColor}33` }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5"
            style={{ borderBottomColor: `${accentColor}22` }}
          >
            <div className="flex items-center gap-2 opacity-80">
              <Terminal size={14} style={{ color: accentColor }} />
              <span className="text-[10px] font-mono font-bold tracking-widest">SYSTEM_KERNEL_OVR</span>
            </div>
            <button onClick={onClose} className="hover:opacity-100 opacity-50 p-1">
              <X size={14} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 font-mono">
            {/* Connection Block */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[9px] opacity-40 mb-1">
                <span>CONNECTIVITY</span>
                <div className={`w-1 h-3 ${isOnline ? "bg-green-500" : "bg-red-500"} animate-pulse`} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi size={14} className={isOnline ? "text-green-500" : "text-red-500"} />
                  <span className="text-xs">{isOnline ? "SECURE_LINK_UP" : "LINK_DOWN"}</span>
                </div>
                <span className="text-[9px] opacity-50">{sysInfo?.ip || "SCANNING..."}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 opacity-80">
                  <Activity size={14} style={{ color: sysInfo?.bridgeActive ? "#00ff9f" : "#ff4d6d" }} />
                  <span className="text-xs">BRIDGE_CORE</span>
                </div>
                <span className={`text-[9px] font-bold ${sysInfo?.bridgeActive ? "text-[#00ff9f]" : "text-red-500 text-xs"}`}>
                  {sysInfo?.bridgeActive ? "CONNECTED" : "OFFLINE!"}
                </span>
              </div>
            </div>

            <div className="h-[1px] w-full bg-white/5" />

            {/* Hardware & User */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2 opacity-70">
                  <Shield size={12} style={{ color: accentColor }} />
                  <span>IDENTITY</span>
                </div>
                <span className="font-bold">{sysInfo?.username.toUpperCase() || "ADMIN"}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2 opacity-70">
                  <Cpu size={12} style={{ color: accentColor }} />
                  <span>NODE</span>
                </div>
                <span className="opacity-50 text-[9px]">{sysInfo?.hostname.toUpperCase() || "UNKNOWN"}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2 opacity-70">
                  <Battery size={12} className={battery && battery.level < 20 ? "text-red-500" : "text-green-500"} />
                  <span>POWER</span>
                </div>
                <span className="text-[10px]">
                  {battery ? `${Math.floor(battery.level)}%` : "AC_PWR"}
                  {battery?.charging && <span className="ml-1 text-[8px] text-green-500 animate-pulse">⚡</span>}
                </span>
              </div>
            </div>

            <div className="h-[1px] w-full bg-white/5" />

            {/* Time & Environment */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 opacity-70 text-[10px]">
                <Clock size={12} style={{ color: accentColor }} />
                <span>CHRONO / DATE</span>
              </div>
              <div className="flex justify-between items-baseline font-mono">
                <span className="text-xl font-bold tracking-tighter">
                  {currentTime.toLocaleTimeString([], { hour12: false })}
                </span>
                <span className="text-[9px] opacity-40">
                  {currentTime.toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Visualizer Artifact */}
            <div className="pt-2">
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full"
                  style={{ backgroundColor: accentColor }}
                  animate={{ width: ["0%", "100%", "0%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
