let currentSessionId = Math.random().toString(36).substring(7);

export function resetSession() {
  currentSessionId = Math.random().toString(36).substring(7);
}

export async function getResponse(
  prompt: string, 
  history: { sender: "user" | "iffikira", text: string }[] = [], 
  mode: "roast" | "lovely" = "roast",
  image?: string // Base64 image data
): Promise<string> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, history, mode, sessionId: currentSessionId, image })
    });

    if (!res.ok) {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to get AI response");
      } else {
        const text = await res.text();
        throw new Error(`Server Error (${res.status}): ${text.substring(0, 100)}...`);
      }
    }

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error(`Invalid response format. Expected JSON but got: ${text.substring(0, 50)}...`);
    }

    const { text, functionCalls } = await res.json();

    // Handle Function Calls (if any)
    if (functionCalls && functionCalls.length > 0) {
      for (const call of functionCalls) {
        if (call.name === "controlWindows") {
          try {
            const result = await fetch("/api/local-execute", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(call.args)
            });

            if (!result.ok) {
              const errorText = await result.text();
              console.error("Local tool call failed with status:", result.status, errorText);
              throw new Error(`Server returned ${result.status}: ${errorText.substring(0, 100)}`);
            }

            const contentType = result.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const data = await result.json();
              // Send tool result back to model via the server
              return await getResponse(`[System Notification: Command executed. Result: ${JSON.stringify(data)}]`, history, mode);
            } else {
              const text = await result.text();
              throw new Error(`Server returned non-JSON response (${result.status}): ${text.substring(0, 50)}...`);
            }
          } catch (e: any) {
            console.error("Tool execution failed", e);
            return `Abe saale, bridge error: ${e.message}. Sun Mohammad Fahad, bridge connect kar pehle (python local_bridge.py). Bina bridge ke Windows control nahi hone wala. Agar tu cloud pe hai toh browser connection block kar raha hoga.`;
          }
        } else if (call.name === "openUploadWindow") {
          // Trigger the browser dialog via a custom event or state change. 
          // For now, we'll just return a message and handle it in App.tsx if needed
          window.dispatchEvent(new CustomEvent("open-upload-window"));
          return await getResponse(`[System Notification: User opened the upload window. Continue conversation as you wait for the file.]`, history, mode);
        }
      }
    }

    return text || "Ugh, fine. I have nothing to say.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return `Uff, Mohammad Fahad, mere server me locha ho gaya hai: ${error.message}. API key check kar .env file me!`;
  }
}

export async function getAudio(text: string): Promise<string | null> {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    if (!res.ok) throw new Error("TTS Failed");
    const { audioData } = await res.json();
    return audioData || null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
}
