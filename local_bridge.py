import os
import subprocess
import webbrowser
import time
import urllib.parse

try:
    from flask import Flask, request, jsonify
    from flask_cors import CORS
    import pyautogui
    import screen_brightness_control as sbc
except ImportError:
    print("Missing dependencies! Run: pip install flask flask-cors pyautogui screen-brightness-control")
    exit(1)

app = Flask(__name__)
CORS(app)

# ============================================================
# APP NAME → LAUNCH COMMAND MAPPING (Windows)
# ============================================================
APP_MAP = {
    # Browsers
    "chrome": "start chrome",
    "google chrome": "start chrome",
    "browser": "start chrome",
    "firefox": "start firefox",
    "edge": "start msedge",
    "microsoft edge": "start msedge",
    "brave": "start brave",

    # Microsoft Apps
    "notepad": "start notepad",
    "calculator": "start calc",
    "calc": "start calc",
    "paint": "start mspaint",
    "wordpad": "start wordpad",
    "cmd": "start cmd",
    "terminal": "start wt",
    "powershell": "start powershell",
    "task manager": "start taskmgr",
    "file explorer": "start explorer",
    "explorer": "start explorer",
    "settings": "start ms-settings:",
    "control panel": "start control",
    "snipping tool": "start snippingtool",

    # Media & Entertainment
    "spotify": "start spotify:",
    "vlc": "start vlc",
    "photos": "start ms-photos:",

    # Communication
    "telegram": "start telegram",
    "discord": "start discord",

    # Dev Tools
    "vscode": "start code",
    "vs code": "start code",
    "visual studio code": "start code",

    # Microsoft Office
    "word": "start winword",
    "excel": "start excel",
    "powerpoint": "start powerpnt",

    # Web Apps (open in browser)
    "youtube": "https://www.youtube.com",
    "yt": "https://www.youtube.com",
    "whatsapp": "https://web.whatsapp.com",
    "whatsapp web": "https://web.whatsapp.com",
    "instagram": "https://www.instagram.com",
    "facebook": "https://www.facebook.com",
    "twitter": "https://www.twitter.com",
    "x": "https://www.x.com",
    "netflix": "https://www.netflix.com",
    "amazon": "https://www.amazon.in",
    "gmail": "https://mail.google.com",
    "google": "https://www.google.com",
    "github": "https://www.github.com",
    "chatgpt": "https://chat.openai.com",
    "linkedin": "https://www.linkedin.com",
    "reddit": "https://www.reddit.com",
}


@app.route('/execute', methods=['POST'])
def execute_command():
    data = request.json
    command = data.get('command')
    value = data.get('value', '').strip()
    silent = data.get('silent', False)

    try:
        # ========================
        # VOLUME CONTROL
        # ========================
        if command == 'volume':
            if value.isdigit():
                target = int(value)
                if target >= 90:
                    pyautogui.press('volumeup', presses=50)
                elif target <= 10:
                    pyautogui.press('volumemute')
                else:
                    # Rough approximation: reset to 0 then press up
                    pyautogui.press('volumedown', presses=50)
                    pyautogui.press('volumeup', presses=target // 2)
                return jsonify({"status": "success", "message": f"Volume set to ~{value}%"})

            val_lower = value.lower()
            if 'increase' in val_lower or 'up' in val_lower:
                presses = 10
                parts = value.split()
                for p in parts:
                    if p.isdigit():
                        presses = int(p) // 2
                        break
                pyautogui.press('volumeup', presses=presses)
            elif 'decrease' in val_lower or 'down' in val_lower:
                presses = 10
                parts = value.split()
                for p in parts:
                    if p.isdigit():
                        presses = int(p) // 2
                        break
                pyautogui.press('volumedown', presses=presses)
            elif 'mute' in val_lower:
                pyautogui.press('volumemute')
            elif 'max' in val_lower or 'full' in val_lower:
                pyautogui.press('volumeup', presses=50)
            return jsonify({"status": "success", "message": f"Volume adjusted: {value}"})

        # ========================
        # BRIGHTNESS CONTROL
        # ========================
        elif command == 'brightness':
            sbc.set_brightness(int(value))
            return jsonify({"status": "success", "message": f"Brightness set to {value}%"})

        # ========================
        # SCREENSHOT
        # ========================
        elif command == 'screenshot':
            os.makedirs('screenshots', exist_ok=True)
            path = f"screenshots/ss_{os.urandom(4).hex()}.png"
            pyautogui.screenshot(path)
            os.startfile('screenshots')
            return jsonify({"status": "success", "message": "Screenshot taken and saved in /screenshots folder"})

        # ========================
        # TYPING
        # ========================
        elif command == 'typing':
            pyautogui.write(value, interval=0.05)
            pyautogui.press('enter')
            return jsonify({"status": "success", "message": f"Typed: {value}"})

        # ========================
        # OPEN APP — Smart mapping
        # ========================
        elif command == 'open_app':
            app_lower = value.lower().strip()
            
            # Check our app map first
            if app_lower in APP_MAP:
                target = APP_MAP[app_lower]
                if target.startswith("http"):
                    # It's a URL — open in default browser
                    webbrowser.open(target)
                else:
                    # It's a system command
                    subprocess.Popen(target, shell=True)
                return jsonify({"status": "success", "message": f"Opening {value}"})
            
            # If value looks like a URL
            if '.' in app_lower or app_lower.startswith('http'):
                url = value if value.startswith('http') else f"https://{value}"
                webbrowser.open(url)
                return jsonify({"status": "success", "message": f"Opening {url} in browser"})
            
            # If value looks like a YouTube search (e.g., "youtube: faded alan walker")
            if app_lower.startswith("youtube:") or app_lower.startswith("yt:"):
                search_query = value.split(":", 1)[1].strip()
                encoded = urllib.parse.quote(search_query)
                url = f"https://www.youtube.com/results?search_query={encoded}"
                webbrowser.open(url)
                return jsonify({"status": "success", "message": f"Searching YouTube for: {search_query}"})
            
            # Last resort: try running as-is
            try:
                subprocess.Popen(f"start {value}", shell=True)
                return jsonify({"status": "success", "message": f"Trying to open: {value}"})
            except Exception:
                return jsonify({"status": "error", "message": f"Could not open '{value}'. App not found in system."}), 400

        # ========================
        # CLOSE APP
        # ========================
        elif command == 'close_app':
            app_lower = value.lower().strip()
            # Add .exe if not present
            target = value if value.endswith('.exe') else f"{value}.exe"
            subprocess.run(f"taskkill /f /im {target}", shell=True, capture_output=True)
            return jsonify({"status": "success", "message": f"Closing {value}"})

        # ========================
        # YOUTUBE SEARCH
        # ========================
        elif command == 'youtube_search':
            search_query = value.strip()
            if not search_query:
                return jsonify({"status": "error", "message": "No search query provided"}), 400
            encoded = urllib.parse.quote(search_query)
            url = f"https://www.youtube.com/results?search_query={encoded}"
            webbrowser.open(url)
            return jsonify({"status": "success", "message": f"Searching YouTube for: {search_query}"})

        # ========================
        # WHATSAPP MESSAGE
        # ========================
        elif command == 'whatsapp_message':
            # Expected format: "Contact Name | Message"
            if '|' in value:
                parts = value.split('|', 1)
                contact = parts[0].strip()
                message = parts[1].strip()
                encoded_msg = urllib.parse.quote(message)
                # Open WhatsApp Web with pre-filled message search
                url = f"https://web.whatsapp.com"
                webbrowser.open(url)
                # Wait for WhatsApp to load, then use pyautogui to search & type
                time.sleep(5)
                # Search for contact
                pyautogui.hotkey('ctrl', 'f')  # Open search in WhatsApp Web
                time.sleep(1)
                pyautogui.write(contact, interval=0.05)
                time.sleep(2)
                pyautogui.press('enter')  # Select contact
                time.sleep(1)
                # Type message
                pyautogui.write(message, interval=0.03)
                time.sleep(0.5)
                pyautogui.press('enter')  # Send
                return jsonify({"status": "success", "message": f"WhatsApp message sent to {contact}: {message}"})
            else:
                # Just open WhatsApp
                webbrowser.open("https://web.whatsapp.com")
                return jsonify({"status": "success", "message": "WhatsApp Web opened"})

        # ========================
        # SHUTDOWN
        # ========================
        elif command == 'shutdown':
            os.system("shutdown /s /t 6")
            return jsonify({"status": "success", "message": "PC SHUTTING DOWN IN 6 SECONDS! BYE BYE MOHAMMAD FAHAD!"})

        # ========================
        # STATUS CHECK (for bridge health)
        # ========================
        elif command == 'status':
            return jsonify({"status": "success", "message": "Bridge is alive and running!"})

        return jsonify({"status": "error", "message": f"Unknown command: {command}"}), 400

    except Exception as e:
        print(f"[BRIDGE ERROR] {command}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == '__main__':
    print("=" * 50)
    print("  IFFIKIRA Local Bridge v2.0")
    print("  Running on http://localhost:5000")
    print("=" * 50)
    print(f"  Loaded {len(APP_MAP)} app shortcuts")
    print("  Commands: volume, brightness, screenshot, typing,")
    print("            open_app, close_app, youtube_search,")
    print("            whatsapp_message, shutdown, status")
    print("=" * 50)
    app.run(port=5000, debug=False)
