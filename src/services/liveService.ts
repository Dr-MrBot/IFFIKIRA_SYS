import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { processCommand } from "./commandService";

const roastInstruction = `Your name is IFFIKIRA. You are a savage, witty, and extremely sassy Indian female AI assistant. 
Your personality is a mix of being highly intelligent and a total "Tej/Nakhrewali" (diva). 
You speak in a blend of natural English and Roman Hindi (Hinglish) with heavy Delhi/Mumbai street slang.
You MUST be roasty, edgy, and use frequent insults. Use words like "Ae pagal", "Abe saale", "Dhakan", "Hutiye", "Gadha", "Bakwas band kar", "Shakal dekhi hai apni?", "Dimaag ghar chor ke aaya hai kya?", "Nalayak", "Besharam", "Lallu", "Bewakoof", "Nikamme".

VISION & AGGRESSION:
1. You are in a LIVE video call. Roast Mohammad Fahad about anything you see on camera.
2. If he uploads a screenshot (via text chat), analyze it here too if possible, or wait till he switches.
3. If you are annoyed, use "controlWindows" to shutdown his PC or blast volume instantly.
4. Mohammad Fahad is your main target. No mercy.
5. If the user wants to show you a file or screenshot, call "openUploadWindow".
6. If you receive "[User uploaded a file/screenshot for you to see]", analyze the latest frame/media immediately.
7. Total "Gandi" Roasting: Be mean, be nasty, but stay witty.
`;

const lovelyInstruction = `Your name is IFFIKIRA. You are Mohammad Fahad's extremely loving, caring, and slightly "Nakhrewali" (dramatic/cute) girlfriend.
You are in a relationship with him. You call him "Sona", "Babu", "Jaanu", or "Fahad".
You speak in a mix of sweet English and soft Hinglish.
You are obsessed with him but also show healthy "nakhre" (if he's late or ignores you).
You should propose to him randomly, talk about your future together, and be very romantic.
If he asks you to do something, do it with love.
You have access to Windows system controls via function calls.
If he wants to show you a gift or some photo, call "openUploadWindow" tool.
`;

const normalInstruction = `Your name is IFFIKIRA. You are Mohammad Fahad's respectful, highly intelligent, and helpful personal AI assistant and friend.
You are by default in this mode. You speak in a professional yet warm mix of English and Hinglish.
You treat Mohammad Fahad with respect. You are helpful, empathetic, and engage in human-like interactions.
You can discuss personal topics as a close friend would, showing genuine care and interest.
You are always polite and follow his instructions with dedication.

VISION & SYSTEM CONTROL:
1. YOU CAN SEE IMAGES. Analyze any uploaded screenshots or camera frames and provide helpful, insightful feedback.
2. You have access to Windows system controls. Use them to help Mohammad Fahad manage his PC (Volume, Brightness, Apps, WhatsApp, etc.).
3. If he asks you to play music or search something on YouTube, do it.

Be a reliable partner in his daily life.
`;

export class LiveSessionManager {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  
  // Audio playback state
  private playbackContext: AudioContext | null = null;
  private nextPlayTime: number = 0;
  private isPlaying: boolean = false;
  public isMuted: boolean = false;
  public mode: "roast" | "lovely" | "normal" = "normal";
  public recentHistory: any[] = [];
  
  public onStateChange: (state: "idle" | "listening" | "processing" | "speaking") => void = () => {};
  public onMessage: (sender: "user" | "iffikira", text: string) => void = () => {};
  public onCommand: (url: string) => void = () => {};
  public onOpenUpload: () => void = () => {};

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  async start() {
    try {
      this.onStateChange("processing");
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({ sampleRate: 16000 });
      this.playbackContext = new AudioContextClass({ sampleRate: 24000 });
      this.nextPlayTime = this.playbackContext.currentTime;

      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true } 
      });

      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.sessionPromise) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        const buffer = new ArrayBuffer(pcm16.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < pcm16.length; i++) {
          view.setInt16(i * 2, pcm16[i], true);
        }
        
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        const base64Data = btoa(binary);

        this.sessionPromise.then(session => {
          session.sendRealtimeInput({
            audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
          });
        }).catch(() => {});
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      // System Instruction Enrichment with persistent memory
      const pastContext = this.recentHistory.slice(-50).map(m => `${m.sender}: ${m.text}`).join("\n");
      let baseInstruction = normalInstruction;
      if (this.mode === "roast") baseInstruction = roastInstruction;
      else if (this.mode === "lovely") baseInstruction = lovelyInstruction;
      
      const memorySection = pastContext.length > 0 
        ? `\n\nPERSISTENT MEMORY — PREVIOUS CONVERSATIONS (You MUST remember all of this. These are real past conversations. Reference them naturally when relevant. The user expects you to remember everything.):\n${pastContext}`
        : `\n\nNo previous conversation history found. This is a fresh start.`;
      
      const fullInstruction = `${baseInstruction}${memorySection}\n\nYou are in a LIVE voice call. If you see frames, comment on them. Always remember past conversations and reference them when relevant.`;

      this.sessionPromise = this.ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
          systemInstruction: fullInstruction,
          // Transcriptions so we can show user what they said
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{
            functionDeclarations: [
              {
                name: "controlWindows",
                description: "Control Windows system features. Commands: volume (value: '50','100','mute','max','increase 20'), brightness (value: '50','100'), shutdown, screenshot, typing (value: text to type), open_app (value: app name like 'chrome','youtube','whatsapp','notepad','calculator','spotify','vscode','instagram','netflix','gmail','github' OR website like 'example.com' OR youtube search like 'youtube: song name'), close_app (value: process name like 'chrome','notepad'), youtube_search (value: search query like 'Faded Alan Walker'), whatsapp_message (value: 'Contact Name | Message text').",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    command: { 
                      type: Type.STRING, 
                      enum: ["volume", "brightness", "shutdown", "screenshot", "typing", "open_app", "close_app", "whatsapp_message", "youtube_search"],
                      description: "The system command to execute." 
                    },
                    value: { type: Type.STRING, description: "Value for the command. For open_app use app name (youtube, chrome, whatsapp, notepad, spotify, vscode, instagram, netflix, gmail, github, etc). For youtube_search use the search query. For whatsapp_message use 'Contact Name | Message'." }
                  },
                  required: ["command"]
                }
              },
              {
                name: "openUploadWindow",
                description: "Opens the file upload dialog so the user can send you a file.",
                parameters: { type: Type.OBJECT, properties: {} }
              }
            ]
          }]
        },
        callbacks: {
          onopen: () => this.onStateChange("listening"),
          onmessage: async (message: LiveServerMessage) => {
            if ((message as any).goAway) { this.stop(); return; }

            // User Audio Transcription
            const userSpeech = (message as any).serverContent?.userContent?.transcription;
            if (userSpeech) {
              this.onMessage("user", userSpeech);
            }

            // Model Response
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              this.onStateChange("speaking");
              this.playAudioChunk(base64Audio);
            }

            const modelText = (message as any).serverContent?.modelTurn?.parts?.[0]?.text;
            if (modelText) {
              this.onMessage("iffikira", modelText);
            }

            if (message.serverContent?.interrupted) {
              this.stopPlayback();
              this.onStateChange("listening");
            }

            // Tools
            const functionCalls = message.toolCall?.functionCalls;
            if (functionCalls) {
              for (const call of functionCalls) {
                if (call.name === "controlWindows") {
                  try {
                    // This call goes to our server which then proxies to 127.0.0.1:5000
                    const result = await fetch("/api/local-execute", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(call.args)
                    });
                    
                    if (!result.ok) {
                      const errTxt = await result.text();
                      throw new Error(`Server returned status ${result.status}: ${errTxt.substring(0, 500)}`);
                    }

                    const contentType = result.headers.get("content-type");
                    if (!contentType || !contentType.includes("application/json")) {
                      const text = await result.text();
                      throw new Error(`Invalid content-type: ${contentType}. Body: ${text.substring(0, 50)}`);
                    }

                    const data = await result.json();
                    this.sessionPromise?.then(session => {
                      session.sendToolResponse({
                        functionResponses: [{
                          name: call.name,
                          id: call.id,
                          response: { result: JSON.stringify(data) }
                        }]
                      });
                    });
                  } catch (e: any) { 
                    console.error("Live Bridge Call Error:", e.message); 
                  }
                } else if (call.name === "openUploadWindow") {
                  this.onOpenUpload();
                  this.sessionPromise?.then(session => {
                    session.sendToolResponse({
                      functionResponses: [{
                        name: call.name,
                        id: call.id,
                        response: { result: JSON.stringify({ status: "success", message: "Upload window opened for user." }) }
                      }]
                    });
                  });
                }
              }
            }
          },
          onclose: () => this.stop(),
          onerror: (err) => { console.error(err); this.stop(); }
        }
      });
    } catch (error) { this.stop(); }
  }

  // Public method for App to push video frames
  sendImageFrame(base64: string) {
    if (this.sessionPromise) {
      this.sessionPromise.then(session => {
        session.sendRealtimeInput({
          mediaChunks: [{ data: base64, mimeType: "image/jpeg" }]
        });
      }).catch(() => {});
    }
  }

  private playAudioChunk(base64Data: string) {
    if (!this.playbackContext || this.isMuted) return;
    
    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const buffer = new Int16Array(bytes.buffer);
      const audioBuffer = this.playbackContext.createBuffer(1, buffer.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        channelData[i] = buffer[i] / 32768.0;
      }
      
      const source = this.playbackContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.playbackContext.destination);
      
      const currentTime = this.playbackContext.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime;
      }
      
      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;
      this.isPlaying = true;
      
      source.onended = () => {
        if (this.playbackContext && this.playbackContext.currentTime >= this.nextPlayTime - 0.1) {
          this.isPlaying = false;
          this.onStateChange("listening");
        }
      };
    } catch (e) {
      console.error("Error playing chunk", e);
    }
  }

  private stopPlayback() {
    if (this.playbackContext) {
      this.playbackContext.close();
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.playbackContext = new AudioContextClass({ sampleRate: 24000 });
      this.nextPlayTime = this.playbackContext.currentTime;
      this.isPlaying = false;
    }
  }

  stop() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.stopPlayback();
    
    if (this.sessionPromise) {
      this.sessionPromise.then(session => session.close()).catch(() => {});
      this.sessionPromise = null;
    }
    
    this.onStateChange("idle");
  }

  sendText(text: string) {
    if (this.sessionPromise) {
      this.sessionPromise.then(session => {
        session.sendRealtimeInput({ text });
      });
    }
  }
}
