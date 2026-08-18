import React, { useEffect, useRef, useState } from "react";
import { Camera, CameraOff } from "lucide-react";

interface CameraViewProps {
  onCapture: (base64: string) => void;
  isActive: boolean;
  mode: "roast" | "lovely";
}

export default function CameraView({ onCapture, isActive, mode }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 400, height: 300, frameRate: 15 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsReady(true);
      } catch (err) {
        console.error("Camera access denied", err);
      }
    }

    if (isActive) {
      startCamera();
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setIsReady(false);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive]);

  // Periodic capture when active
  useEffect(() => {
    if (!isActive || !isReady) return;

    const interval = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.6); // Compress for network
          const base64 = dataUrl.split(",")[1];
          onCapture(base64);
        }
      }
    }, 5000); // Capture frame every 5 seconds for vision context

    return () => clearInterval(interval);
  }, [isActive, isReady, onCapture]);

  if (!isActive) return null;

  return (
    <div className={`fixed top-24 right-6 z-50 group border-2 rounded-sm overflow-hidden backdrop-blur-md bg-black/40 ${
      mode === "roast" ? "border-[#00ff9f]/50 shadow-[0_0_15px_rgba(0,255,159,0.2)]" : "border-[#ff4d6d]/50 shadow-[0_0_15px_rgba(255,77,109,0.2)]"
    }`}>
      <div className="relative w-48 h-36">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          className="w-full h-full object-cover grayscale brightness-125 contrast-125"
        />
        <canvas ref={canvasRef} width={400} height={300} className="hidden" />
        
        {/* Tech Overlays */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-current" />
          <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-current" />
          <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-current" />
          <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-current" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none" />
        </div>
        
        <div className="absolute bottom-1 left-1 bg-black/60 px-1 py-0.5 text-[8px] font-bold tracking-widest uppercase">
          {mode === "roast" ? "CAM_01 // SECURE" : "BABU_EYES // ON"}
        </div>
      </div>
    </div>
  );
}
