/*
HolyOly Webchat Widget
Embed: <script src="https://holyoly.com/widget.js" data-channel-id="YOUR_ID"></script>
*/

(function () {
  "use strict";

  const API_URL = "https://holyoly.com/api/v1/webchat/message";
  const WIDGET_VERSION = "1.0.0";

  const CONFIG = {
    primaryColor: "#6c5ce7",
    secondaryColor: "#a29bfe",
    title: "HolyOly",
    subtitle: "Entrenamiento inteligente",
    placeholder: "Escribe tu mensaje...",
    welcomeMessage:
      "Hola! Soy el asistente de HolyOly. Te puedo ayudar con entrenamientos, nutricion, o cualquier duda. Como te llamas?",
  };

  let chatOpen = false;
  let sessionId = null;
  let widgetContainer = null;

  function createWidget() {
    const channel = document.querySelector("script[src*='widget.js']");
    const channelId = channel ? channel.dataset.channelId : null;

    const style = document.createElement("style");
    style.textContent = `
      .holyoly-fab {
        position: fixed; bottom: 20px; right: 20px; z-index: 9999;
        width: 60px; height: 60px; border-radius: 50%; border: none;
        background: ${CONFIG.primaryColor}; color: white;
        font-size: 24px; cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        transition: transform 0.2s;
      }
      .holyoly-fab:hover { transform: scale(1.1); }
      .holyoly-panel {
        position: fixed; bottom: 90px; right: 20px; z-index: 9999;
        width: 360px; max-width: calc(100vw - 40px);
        height: 500px; max-height: calc(100vh - 120px);
        background: white; border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        display: none; flex-direction: column;
        overflow: hidden; font-family: system-ui, sans-serif;
      }
      .holyoly-panel.open { display: flex; }
      .holyoly-header {
        background: ${CONFIG.primaryColor}; color: white;
        padding: 16px; display: flex; align-items: center; gap: 12px;
      }
      .holyoly-header-logo {
        width: 36px; height: 36px; border-radius: 50%;
        background: rgba(255,255,255,0.2); display: flex;
        align-items: center; justify-content: center; font-size: 18px;
      }
      .holyoly-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
      .holyoly-header p { margin: 0; font-size: 12px; opacity: 0.8; }
      .holyoly-close {
        margin-left: auto; background: none; border: none; color: white;
        font-size: 20px; cursor: pointer; padding: 4px;
      }
      .holyoly-messages {
        flex: 1; overflow-y: auto; padding: 16px;
        display: flex; flex-direction: column; gap: 8px;
        background: #f8f9fa;
      }
      .holyoly-msg {
        max-width: 80%; padding: 10px 14px; border-radius: 12px;
        font-size: 14px; line-height: 1.4; word-wrap: break-word;
      }
      .holyoly-msg.bot {
        background: white; color: #333; align-self: flex-start;
        border-bottom-left-radius: 4px;
      }
      .holyoly-msg.user {
        background: ${CONFIG.primaryColor}; color: white;
        align-self: flex-end; border-bottom-right-radius: 4px;
      }
      .holyoly-input-area {
        display: flex; gap: 8px; padding: 12px;
        border-top: 1px solid #eee; background: white;
      }
      .holyoly-input {
        flex: 1; border: 1px solid #ddd; border-radius: 24px;
        padding: 10px 16px; font-size: 14px; outline: none;
      }
      .holyoly-input:focus { border-color: ${CONFIG.primaryColor}; }
      .holyoly-send {
        width: 40px; height: 40px; border-radius: 50%;
        border: none; background: ${CONFIG.primaryColor}; color: white;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: opacity 0.2s;
      }
      .holyoly-send:hover { opacity: 0.8; }
      .holyoly-send:disabled { opacity: 0.5; cursor: not-allowed; }
      .holyoly-typing {
        align-self: flex-start; padding: 10px 14px;
        background: white; border-radius: 12px;
        font-size: 14px; color: #999; font-style: italic;
      }
    `;
    document.head.appendChild(style);

    widgetContainer = document.createElement("div");
    widgetContainer.innerHTML = `
      <button class="holyoly-fab" id="holyoly-fab" aria-label="Chat">💬</button>
      <div class="holyoly-panel" id="holyoly-panel">
        <div class="holyoly-header">
          <div class="holyoly-header-logo">🏋️</div>
          <div>
            <h3>${CONFIG.title}</h3>
            <p>${CONFIG.subtitle}</p>
          </div>
          <button class="holyoly-close" id="holyoly-close" aria-label="Close">×</button>
        </div>
        <div class="holyoly-messages" id="holyoly-messages"></div>
        <div class="holyoly-input-area">
          <input type="text" class="holyoly-input" id="holyoly-input" placeholder="${CONFIG.placeholder}" />
          <button class="holyoly-send" id="holyoly-send" aria-label="Send">➤</button>
        </div>
      </div>
    `;
    document.body.appendChild(widgetContainer);

    const fab = document.getElementById("holyoly-fab");
    const panel = document.getElementById("holyoly-panel");
    const close = document.getElementById("holyoly-close");
    const input = document.getElementById("holyoly-input");
    const send = document.getElementById("holyoly-send");
    const messages = document.getElementById("holyoly-messages");

    fab.addEventListener("click", toggleChat);
    close.addEventListener("click", toggleChat);

    send.addEventListener("click", sendMessage);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    function toggleChat() {
      chatOpen = !chatOpen;
      panel.classList.toggle("open", chatOpen);
      fab.textContent = chatOpen ? "✕" : "💬";

      if (chatOpen && !sessionId) {
        addMessage(CONFIG.welcomeMessage, "bot");
        sessionId = generateId();
      }
    }

    function addMessage(text, sender) {
      const msg = document.createElement("div");
      msg.className = `holyoly-msg ${sender}`;
      msg.textContent = text;
      messages.appendChild(msg);
      messages.scrollTop = messages.scrollHeight;
    }

    function showTyping() {
      const typing = document.createElement("div");
      typing.className = "holyoly-typing";
      typing.id = "holyoly-typing";
      typing.textContent = "Escribiendo...";
      messages.appendChild(typing);
      messages.scrollTop = messages.scrollHeight;
    }

    function hideTyping() {
      const el = document.getElementById("holyoly-typing");
      if (el) el.remove();
    }

    async function sendMessage() {
      const text = input.value.trim();
      if (!text) return;

      addMessage(text, "user");
      input.value = "";
      send.disabled = true;
      showTyping();

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            session_id: sessionId,
            channel_id: channelId,
            user_agent: navigator.userAgent,
          }),
        });

        const data = await response.json();
        hideTyping();

        if (data.response) {
          addMessage(data.response, "bot");
        } else if (data.error) {
          addMessage("Error: " + data.error, "bot");
        }
      } catch (error) {
        hideTyping();
        addMessage("Error de conexion. Intenta de nuevo.", "bot");
      }

      send.disabled = false;
      input.focus();
    }
  }

  function generateId() {
    return "wc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createWidget);
  } else {
    createWidget();
  }
})();
