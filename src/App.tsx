import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, Volume2, VolumeX, Trash2, Paperclip } from "lucide-react";
import { resetSession } from "./services/geminiService";
import { LiveSessionManager } from "./services/liveService";
import Visualizer from "./components/Visualizer";
import PermissionModal from "./components/PermissionModal";
import CameraView from "./components/CameraView";
import SystemOverlay from "./components/SystemOverlay";
import MatrixBackground from "./components/MatrixBackground";
import { motion, AnimatePresence } from "motion/react";
import { Camera as CameraIcon, CameraOff, History } from "lucide-react";

type AppState = "idle" | "listening" | "processing" | "speaking";
type PersonalityMode = "roast" | "lovely" | "normal";

interface ChatMessage {
  id: string;
  sender: "user" | "iffikira";
  text: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function App() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [personalityMode, setPersonalityMode] = useState<PersonalityMode>(() => {
    const saved = localStorage.getItem("iffikira_personality_mode");
    return (saved as PersonalityMode) || "normal";
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const messagesRef = useRef(messages);

  // Check API config and Load from server-side memory.json on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Check API Keys
        const configRes = await fetch("/api/config");
        const configData = await configRes.json();
        setHasApiKey(configData.hasApiKey);

        const res = await fetch("/api/memory");
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          // Fallback to localStorage if server empty
          const saved = localStorage.getItem("iffikira_chat_history");
          if (saved) setMessages(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Failed to initialize App", e);
      }
    };
    init();

    // Connection Tracking
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sys Info Fetch
    const fetchSysInfo = async () => {
      try {
        const res = await fetch("/api/sys-info");
        const data = await res.json();
        setSysInfo(data);
      } catch (e) {
        console.warn("Failed to fetch sys info");
      }
    };
    fetchSysInfo();
    const sysInterval = setInterval(fetchSysInfo, 10000); // 10s sync

    // Battery Tracking
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((batt: any) => {
        setBattery({ level: batt.level * 100, charging: batt.charging });
        batt.addEventListener('levelchange', () => setBattery({ level: batt.level * 100, charging: batt.charging }));
        batt.addEventListener('chargingchange', () => setBattery({ level: batt.level * 100, charging: batt.charging }));
      });
    }

    // Time Tracking
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(sysInterval);
      clearInterval(timeInterval);
    };
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
    localStorage.setItem("iffikira_chat_history", JSON.stringify(messages));
    localStorage.setItem("iffikira_personality_mode", personalityMode);
    
    // Auto-save to server-side memory.json
    const saveMemory = async () => {
      try {
        await fetch("/api/memory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages, timestamp: new Date().toISOString() })
        });
      } catch (e) {
        console.warn("Server memory save failed", e);
      }
    };
    if (messages.length > 0) saveMemory();
  }, [messages]);

  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (liveSessionRef.current) {
      liveSessionRef.current.isMuted = isMuted;
    }
  }, [isMuted]);


  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sysInfo, setSysInfo] = useState<{ ip: string; platform: string; hostname: string; username: string; bridgeActive: boolean } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOverlay, setShowOverlay] = useState(true);
  const [battery, setBattery] = useState<{ level: number; charging: boolean } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const lastFrameRef = useRef<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const liveSessionRef = useRef<LiveSessionManager | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, appState]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert("Abe saale, file bahut badi hai! 4MB se kam ki bhej.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        
        // If live session is active, send it immediately
        if (isSessionActive && liveSessionRef.current) {
          setUploadedImage(base64);
          liveSessionRef.current.sendImageFrame(base64);
          liveSessionRef.current.sendText("[User uploaded a file/screenshot for you to see]");
        } else {
          handleImageUploadToLive(base64); 
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUploadToLive = useCallback(async (directImage: string) => {
    if (!directImage) return;
    
    setUploadedImage(null);
    setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "user", text: "[IMAGE ATTACHMENT]" }]);
    
    if (isSessionActive && liveSessionRef.current) {
      liveSessionRef.current.sendImageFrame(directImage);
      liveSessionRef.current.sendText("[User sent an image]");
    }
  }, [isSessionActive]);

  useEffect(() => {
    const handleOpenUpload = () => {
      fileInputRef.current?.click();
    };
    window.addEventListener("open-upload-window", handleOpenUpload);
    return () => {
      window.removeEventListener("open-upload-window", handleOpenUpload);
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = async () => {
    if (isSessionActive) {
      setIsSessionActive(false);
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
        liveSessionRef.current = null;
      }
      setAppState("idle");
      resetSession();
    } else {
      try {
        setIsSessionActive(true);
        resetSession();
        
        const session = new LiveSessionManager();
        session.isMuted = isMuted;
        session.mode = personalityMode;
        session.recentHistory = messagesRef.current;
        liveSessionRef.current = session;
        
        session.onStateChange = (state) => {
          setAppState(state);
        };
        
        session.onMessage = (sender, text) => {
          setMessages((prev) => [...prev, { id: Date.now().toString() + "-" + sender, sender, text }]);
        };
        
        session.onCommand = (url) => {
          setTimeout(() => {
            window.open(url, "_blank");
          }, 1000);
        };

        session.onOpenUpload = () => {
          fileInputRef.current?.click();
        };

        await session.start();
      } catch (e) {
        console.error("Failed to start session", e);
        setShowPermissionModal(true);
        setIsSessionActive(false);
        setAppState("idle");
      }
    }
  };



  return (
    <div className={`h-[100dvh] w-screen flex flex-col items-center justify-between font-mono relative overflow-hidden m-0 p-0 selection:bg-[#00ff9f] selection:text-black transition-colors duration-1000 ${
      personalityMode === "roast" ? "bg-[#000a0f] text-[#00ff9f]" : "bg-[#1a0005] text-[#ff4d6d]"
    }`}>
      {showPermissionModal && (
        <PermissionModal 
          onClose={() => setShowPermissionModal(false)} 
        />
      )}

      {/* Mode Specific Background Effects */}
      <MatrixBackground mode={personalityMode} />

      {/* Cyber/Tech Background Overlay */}
      <div className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-1000 ${personalityMode === "roast" ? "opacity-30" : "opacity-10"}`}>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,5px_100%] animate-scan" />
        <div className="absolute inset-0 bg-cover bg-center brightness-[0.2]" style={{ backgroundImage: personalityMode === "roast" ? 'url(https://picsum.photos/seed/cyberpunk/1920/1080)' : 'url(https://picsum.photos/seed/nebula/1920/1080)' }} />
      </div>

      <CameraView 
        isActive={isCameraActive} 
        mode={personalityMode} 
        onCapture={(b64) => { 
          lastFrameRef.current = b64;
          if (isSessionActive && liveSessionRef.current) {
            liveSessionRef.current.sendImageFrame(b64);
          }
        }} 
      />

      <SystemOverlay 
        isOpen={showOverlay}
        onClose={() => setShowOverlay(false)}
        sysInfo={sysInfo}
        isOnline={isOnline}
        battery={battery}
        currentTime={currentTime}
        mode={personalityMode}
      />

      {/* Transparent Chat Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.aside
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            className={`fixed left-0 top-20 bottom-32 w-72 md:w-80 z-50 flex flex-col p-4 border-r backdrop-blur-xl transition-all duration-500 bg-black/60 ${
              personalityMode === "roast" ? "border-[#00ff9f]/30 scrollbar-roast" : "border-[#ff4d6d]/30 scrollbar-lovely"
            }`}
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
              <span className={`text-[10px] font-bold tracking-widest ${personalityMode === "roast" ? "text-[#00ff9f]" : "text-[#ff4d6d]"}`}>
                LIVE_FEED://CHAT_HISTORY
              </span>
              <button onClick={() => setShowHistory(false)} className="opacity-50 hover:opacity-100">
                <History size={14} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                  <div className="w-12 h-12 border-2 rounded-full mb-2 border-current animate-pulse" />
                  <span className="text-[10px] uppercase font-bold">No active logs</span>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-start" : "items-end"}`}>
                  <span className={`text-[8px] font-bold uppercase mb-1 ${
                    msg.sender === "user" 
                      ? "opacity-50" 
                      : personalityMode === "roast" 
                        ? "text-[#00ff9f]" 
                        : personalityMode === "lovely" ? "text-[#ff4d6d]" : "text-[#3b82f6]"
                  }`}>
                    {msg.sender === "user" ? "USER_ID" : "IFFIKIRA_SYS"}
                  </span>
                  <div className={`px-3 py-2 text-xs rounded-sm max-w-[90%] border ${
                    msg.sender === "user" 
                      ? "bg-white/5 border-white/10 rounded-tl-none" 
                      : personalityMode === "roast" 
                        ? "bg-[#00ff9f]/10 border-[#00ff9f]/30 rounded-tr-none text-[#00ff9f]" 
                        : personalityMode === "lovely"
                          ? "bg-[#ff4d6d]/10 border-[#ff4d6d]/30 rounded-tr-none text-[#ff4d6d]"
                          : "bg-[#3b82f6]/10 border-[#3b82f6]/30 rounded-tr-none text-[#3b82f6]"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Remove the fixed History button and the aside sidebar if user wants it purely removed. 
          Alternatively, we can just not render them. */}

      {hasApiKey === false && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 text-center">
          <div className="max-w-md p-8 border-2 border-red-500 bg-red-500/10 rounded-sm">
            <h2 className="text-2xl font-bold mb-4">API KEY MISSING!</h2>
            <p className="text-sm opacity-80 mb-6">
              Mohammad Fahad, tune `.env` file nahi banayi ya API key nahi daali! 
              <br/><br/>
              <b>Instructions:</b><br/>
              1. Project root me `.env` file banao.<br/>
              2. Usme `GEMINI_API_KEY=your_key` likho.<br/>
              3. Server restart karo (`npm run dev`).
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
            >
              RECHECK CONFIG
            </button>
          </div>
        </div>
      )}

      {/* Matrix/Hacker Background Effect (Roast Only) */}
      {personalityMode === "roast" && (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,255,159,0.1)_0%,transparent_70%)]" />
          <div className="grid grid-cols-12 gap-4 h-full w-full opacity-10">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-full border-r border-[#00ff9f]/20" />
            ))}
          </div>
        </div>
      )}
      
      {/* Reddish Tech Background (Roast Only) */}
      {personalityMode === "roast" && (
         <div className="absolute inset-0 bg-gradient-to-t from-red-900/5 via-transparent to-transparent pointer-events-none" />
      )}

      {/* Normal Tech Background */}
      {personalityMode === "normal" && (
         <div className="absolute inset-0 bg-gradient-to-t from-blue-900/5 via-transparent to-transparent pointer-events-none" />
      )}

      {/* Header */}
      <header className={`absolute top-0 left-0 w-full flex justify-between items-center z-20 shrink-0 px-6 py-4 md:px-12 md:py-6 border-b backdrop-blur-sm ${
        personalityMode === "roast" ? "border-[#00ff9f]/10" : personalityMode === "lovely" ? "border-[#ff4d6d]/10" : "border-[#3b82f6]/10"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-sm border-2 flex items-center justify-center font-bold text-lg animate-pulse bg-black ${
            personalityMode === "roast" 
              ? "border-[#00ff9f] shadow-[0_0_10px_rgba(0,255,159,0.5)] text-[#00ff9f]" 
              : personalityMode === "lovely"
                ? "border-[#ff4d6d] shadow-[0_0_10px_rgba(255,77,109,0.5)] text-[#ff4d6d]"
                : "border-[#3b82f6] shadow-[0_0_10px_rgba(59,130,246,0.5)] text-[#3b82f6]"
          }`}>
            IF
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-[0.2em] glitch-text uppercase">
              {personalityMode === "roast" ? "IFFIKIRA_ROOT" : personalityMode === "lovely" ? "IFFIKIRA_LOVE" : "IFFIKIRA_NORM"}
            </h1>
            <span className="text-[10px] opacity-50 font-mono">
              {personalityMode === "roast" 
                ? "CONNECTION: SECURE // SASS: MAX" 
                : personalityMode === "lovely"
                  ? "HEARTBEAT: SYNCED // ROMANCE: 100%"
                  : "SYSTEM: STABLE // FRIENDSHIP: ACTIVE"}
            </span>
          </div>
          
          {/* Sys Info Display */}
          <div className="hidden md:flex flex-col ml-8 pl-4 border-l border-white/10 text-[9px] font-mono tracking-wider opacity-60">
            <div className="flex items-center gap-2">
              <span className={isOnline ? "text-green-500" : "text-red-500"}>●</span>
              <span>{isOnline ? "STATUS: ONLINE" : "STATUS: OFFLINE"}</span>
            </div>
            {sysInfo && (
              <>
                <div>IP: {sysInfo.ip}</div>
                <div>HOST: {sysInfo.hostname.toUpperCase()}</div>
                <div>OS: {sysInfo.platform.toUpperCase()}</div>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Vision Toggle */}
          <button
            onClick={() => setIsCameraActive(!isCameraActive)}
            className={`p-2 rounded-sm border-2 transition-all ${
              isCameraActive 
                ? (personalityMode === "roast" ? "border-[#00ff9f] bg-[#00ff9f] text-black shadow-[0_0_15px_rgba(0,255,159,0.5)]" : "border-[#ff4d6d] bg-[#ff4d6d] text-white")
                : "border-white/10 opacity-50 hover:opacity-100"
            }`}
            title="Toggle Vision (AI can see you)"
          >
            {isCameraActive ? <CameraIcon size={18} /> : <CameraOff size={18} />}
          </button>

          {/* Personality Toggle (Three Moods) */}
          <div className="hidden md:flex items-center gap-1 bg-black/40 p-1 border border-white/10 rounded-sm">
            {[
              { id: "normal", label: "NORMAL", color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/20", border: "border-[#3b82f6]/40" },
              { id: "roast", label: "ROAST", color: "text-[#00ff9f]", bg: "bg-[#00ff9f]/20", border: "border-[#00ff9f]/40" },
              { id: "lovely", label: "LOVELY", color: "text-[#ff4d6d]", bg: "bg-[#ff4d6d]/20", border: "border-[#ff4d6d]/40" }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setPersonalityMode(m.id as PersonalityMode);
                  resetSession();
                  if (liveSessionRef.current) liveSessionRef.current.stop();
                }}
                className={`px-3 py-1 text-[9px] font-bold tracking-widest transition-all rounded-[1px] border ${
                  personalityMode === m.id 
                    ? `${m.bg} ${m.color} ${m.border} shadow-[0_0_8px_rgba(0,0,0,0.5)]`
                    : "text-white/40 border-transparent hover:text-white/60"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="md:hidden">
             <button
              onClick={() => {
                const modes: PersonalityMode[] = ["normal", "roast", "lovely"];
                const currentIndex = modes.indexOf(personalityMode);
                const nextIndex = (currentIndex + 1) % modes.length;
                setPersonalityMode(modes[nextIndex]);
                resetSession();
                if (liveSessionRef.current) liveSessionRef.current.stop();
              }}
              className={`px-3 py-1.5 rounded-sm text-[10px] font-bold border-2 ${
                personalityMode === "roast" ? "border-[#00ff9f] text-[#00ff9f]" : personalityMode === "lovely" ? "border-[#ff4d6d] text-[#ff4d6d]" : "border-[#3b82f6] text-[#3b82f6]"
              }`}
            >
              MODE: {personalityMode.toUpperCase()}
            </button>
          </div>

          <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={async () => {
                if (confirm("Are you sure you want to clear the chat history?")) {
                  setMessages([]);
                  resetSession();
                  try { await fetch("/api/memory", { method: "DELETE" }); } catch(e) {}
                  localStorage.removeItem("iffikira_chat_history");
                }
              }}
              className="p-2 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-colors border border-white/10"
              title="Clear Chat History"
            >
              <Trash2 size={18} className="opacity-70" />
            </button>
          )}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX size={18} className="opacity-70" />
            ) : (
              <Volume2 size={18} className="opacity-70" />
            )}
          </button>
        </div>
      </div>
    </header>

      {/* Main Content - Visualizer & Chat */}
      <main className="absolute inset-0 flex flex-row items-center justify-between w-full h-full z-10 overflow-hidden pt-20 pb-24 px-4 md:px-12 pointer-events-none">
        
        {/* Left Column: IFFIKIRA Status */}
        <div className="flex w-[30%] lg:w-[25%] h-full flex-col justify-center gap-4 z-10">
          <div className="h-6">
            <AnimatePresence>
              {appState === "processing" && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`flex items-center gap-2 text-sm md:text-base italic font-mono ${
                    personalityMode === "roast" ? "text-[#00ff9f]/80" : personalityMode === "lovely" ? "text-[#ff4d6d]/80" : "text-[#3b82f6]/80"
                  }`}
                >
                  <Loader2 size={16} className="animate-spin" />
                  {personalityMode === "roast" ? "[SYSTEM] PROCESSING..." : personalityMode === "lovely" ? "BABU IS THINKING..." : "IFFIKIRA IS THINKING..."}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center Visualizer (Fixed Full Screen Background) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <Visualizer state={appState} />
        </div>

        {/* Right Column: User Status */}
        <div className="flex w-[30%] lg:w-[25%] h-full flex-col justify-center gap-4 z-10">
          <div className="h-6 flex justify-end">
            <AnimatePresence>
              {appState === "listening" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`flex items-center gap-2 text-sm md:text-base italic font-mono ${
                    personalityMode === "roast" ? "text-[#00ff9f]/80" : personalityMode === "lovely" ? "text-[#ff4d6d]/80" : "text-[#3b82f6]/80"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    personalityMode === "roast" ? "bg-[#00ff9f]" : personalityMode === "lovely" ? "bg-[#ff4d6d]" : "bg-[#3b82f6]"
                  }`} />
                  {personalityMode === "roast" ? "[USER] LISTENING..." : personalityMode === "lovely" ? "YOU SPEAK, I LISTEN..." : "LISTENING TO YOU..."}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </main>

      {/* Controls */}
      <footer className="absolute bottom-0 left-0 w-full flex flex-col items-center justify-center pb-6 md:pb-8 z-20 shrink-0 gap-4">

        <div className="flex items-center gap-4">
          <button
            onClick={toggleListening}
            className={`
              group relative flex items-center gap-3 px-8 py-4 rounded-sm font-bold tracking-widest transition-all duration-300 border-2
              ${
                isSessionActive
                  ? "bg-red-500/20 text-red-500 border-red-500 hover:bg-red-500/30"
                  : (personalityMode === "roast" 
                      ? "bg-black text-[#00ff9f] border-[#00ff9f] hover:bg-[#00ff9f]/10 shadow-[0_0_15px_rgba(0,255,159,0.2)]" 
                      : personalityMode === "lovely"
                        ? "bg-black text-[#ff4d6d] border-[#ff4d6d] hover:bg-[#ff4d6d]/10 shadow-[0_0_15px_rgba(255,77,109,0.2)]"
                        : "bg-black text-[#3b82f6] border-[#3b82f6] hover:bg-[#3b82f6]/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]")
              }
            `}
          >
            {isSessionActive ? (
              <>
                <MicOff size={20} />
                <span>{personalityMode === "roast" ? "END_SESSION" : personalityMode === "lovely" ? "EXIT_LOVE" : "STOP_CHAT"}</span>
              </>
            ) : (
              <>
                <Mic size={20} className="group-hover:animate-bounce" />
                <span>{personalityMode === "roast" ? "START_SESSION" : personalityMode === "lovely" ? "TALK_TO_ME" : "START_CHAT"}</span>
              </>
            )}
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileUpload}
          />

          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all ${
                uploadedImage ? "ring-2 " + (personalityMode === "roast" ? "ring-[#00ff9f]" : personalityMode === "lovely" ? "ring-[#ff4d6d]" : "ring-[#3b82f6]") : ""
              }`}
              title="Upload screenshot or image"
            >
              <div className="relative">
                <Paperclip size={20} className={uploadedImage ? (personalityMode === "roast" ? "text-[#00ff9f]" : personalityMode === "lovely" ? "text-[#ff4d6d]" : "text-[#3b82f6]") : "opacity-70"} />
                {uploadedImage && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
              </div>
            </button>


          </div>
        </div>
      </footer>
    </div>
  );
}
