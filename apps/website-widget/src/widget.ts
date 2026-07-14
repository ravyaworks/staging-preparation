interface WidgetConfig {
  widgetId: string;
  apiUrl: string;
  wsUrl: string;
  themeColor: string;
  position: 'left' | 'right';
  greetingMessage: string;
  primaryColor: string;
  font?: string;
  cornerRadius: number;
  darkMode: boolean;
  showBrand: boolean;
  autoOpenDelay: number;
  offlineMessage?: string;
  enableTypingIndicator: boolean;
  allowFileUpload: boolean;
  tenantId: string;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'bot';
  timestamp: string;
}

class ConversationWidget {
  private config: WidgetConfig;
  private container: HTMLDivElement;
  private iframe: HTMLIFrameElement | null = null;
  private ws: WebSocket | null = null;
  private messages: Message[] = [];
  private isOpen = false;
  private sessionId: string;

  constructor(config: Partial<WidgetConfig> & { widgetId: string; apiUrl: string; wsUrl: string; tenantId: string }) {
    this.config = {
      position: 'right',
      themeColor: '#2563eb',
      greetingMessage: 'Hello! How can I help you?',
      primaryColor: '#2563eb',
      cornerRadius: 12,
      darkMode: false,
      showBrand: true,
      autoOpenDelay: 0,
      enableTypingIndicator: true,
      allowFileUpload: false,
      ...config,
    };
    this.sessionId = `session_${crypto.randomUUID().replace(/-/g, '')}`;
    this.container = this.createContainer();
    this.connectWebSocket();
    this.loadMessages();
  }

  private createContainer(): HTMLDivElement {
    const existing = document.getElementById('cp-widget-container');
    if (existing) return existing as HTMLDivElement;

    const container = document.createElement('div');
    container.id = 'cp-widget-container';
    container.style.cssText = `
      position: fixed;
      ${this.config.position}: 20px;
      bottom: 20px;
      z-index: 2147483647;
      font-family: ${this.config.font || 'system-ui, -apple-system, sans-serif'};
    `;

    const launcher = document.createElement('button');
    launcher.id = 'cp-widget-launcher';
    launcher.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    `;
    launcher.style.cssText = `
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: ${this.config.primaryColor};
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
    `;
    launcher.onmouseenter = () => { launcher.style.transform = 'scale(1.1)'; };
    launcher.onmouseleave = () => { launcher.style.transform = 'scale(1)'; };
    launcher.onclick = () => this.toggle();

    container.appendChild(launcher);

    if (this.config.autoOpenDelay > 0) {
      setTimeout(() => this.open(), this.config.autoOpenDelay * 1000);
    }

    document.body.appendChild(container);
    return container;
  }

  private createChatWindow(): HTMLDivElement {
    const existing = document.getElementById('cp-widget-chat');
    if (existing) existing.remove();

    const chat = document.createElement('div');
    chat.id = 'cp-widget-chat';
    chat.style.cssText = `
      position: fixed;
      ${this.config.position}: 20px;
      bottom: 88px;
      width: 380px;
      height: 600px;
      max-height: calc(100vh - 120px);
      background: ${this.config.darkMode ? '#1e1e1e' : '#ffffff'};
      border-radius: ${this.config.cornerRadius}px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 2147483646;
      font-family: ${this.config.font || 'system-ui, -apple-system, sans-serif'};
      color: ${this.config.darkMode ? '#e0e0e0' : '#1a1a1a'};
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px;
      background: ${this.config.primaryColor};
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    const title = document.createElement('strong')
    title.textContent = this.config.greetingMessage
    header.appendChild(title)
    const closeBtn = document.createElement('button')
    closeBtn.id = 'cp-widget-close'
    closeBtn.style.cssText = 'background:none;border:none;color:white;cursor:pointer;font-size:20px;'
    closeBtn.textContent = '\u00D7'
    closeBtn.onclick = () => this.close()
    header.appendChild(closeBtn)
    header.querySelector('#cp-widget-close')!.onclick = () => this.close();

    const messages = document.createElement('div');
    messages.id = 'cp-widget-messages';
    messages.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

    const inputArea = document.createElement('div');
    inputArea.style.cssText = `
      padding: 12px 16px;
      border-top: 1px solid ${this.config.darkMode ? '#333' : '#e0e0e0'};
      display: flex;
      gap: 8px;
    `;

    const input = document.createElement('input');
    input.id = 'cp-widget-input';
    input.type = 'text';
    input.placeholder = 'Type a message...';
    input.style.cssText = `
      flex: 1;
      padding: 10px 14px;
      border: 1px solid ${this.config.darkMode ? '#444' : '#d0d0d0'};
      border-radius: 20px;
      outline: none;
      font-size: 14px;
      background: ${this.config.darkMode ? '#333' : '#f5f5f5'};
      color: ${this.config.darkMode ? '#e0e0e0' : '#1a1a1a'};
    `;
    input.onkeydown = (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        this.sendMessage(input.value.trim());
        input.value = '';
      }
    };

    const sendBtn = document.createElement('button');
    sendBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="${this.config.primaryColor}" stroke="none">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
      </svg>
    `;
    sendBtn.style.cssText = `
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      display: flex;
      align-items: center;
    `;
    sendBtn.onclick = () => {
      if (input.value.trim()) {
        this.sendMessage(input.value.trim());
        input.value = '';
      }
    };

    if (this.config.allowFileUpload) {
      const uploadBtn = document.createElement('button');
      uploadBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="gray" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
      uploadBtn.style.cssText = sendBtn.style.cssText;
      inputArea.appendChild(uploadBtn);
    }

    inputArea.appendChild(input);
    inputArea.appendChild(sendBtn);

    chat.appendChild(header);
    chat.appendChild(messages);
    chat.appendChild(inputArea);

    document.body.appendChild(chat);
    return chat;
  }

  private toggle(): void {
    this.isOpen ? this.close() : this.open();
  }

  private open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    const chat = this.createChatWindow();
    this.renderMessages();
    const launcher = document.getElementById('cp-widget-launcher');
    if (launcher) launcher.style.display = 'none';
  }

  private close(): void {
    this.isOpen = false;
    const chat = document.getElementById('cp-widget-chat');
    if (chat) chat.remove();
    const launcher = document.getElementById('cp-widget-launcher');
    if (launcher) launcher.style.display = 'flex';
  }

  private connectWebSocket(): void {
    try {
      this.ws = new WebSocket(`${this.config.wsUrl}?tenantId=${this.config.tenantId}&userId=visitor:${this.sessionId}`);

      this.ws.onopen = () => {
        this.addMessage({ id: 'sys-1', content: this.config.greetingMessage, role: 'bot', timestamp: new Date().toISOString() });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.payload && data.payload.message) {
            this.addMessage({
              id: data.payload.message.id || `msg_${Date.now()}`,
              content: data.payload.message.content,
              role: 'bot',
              timestamp: data.payload.message.timestamp || new Date().toISOString(),
            });
          }
        } catch { /* ignore parse errors */ }
      };

      this.ws.onclose = () => {
        setTimeout(() => this.connectWebSocket(), 5000);
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      setTimeout(() => this.connectWebSocket(), 5000);
    }
  }

  private async sendMessage(content: string): Promise<void> {
    const message: Message = {
      id: `msg_${Date.now()}`,
      content,
      role: 'user',
      timestamp: new Date().toISOString(),
    };
    this.addMessage(message);

    try {
      const res = await fetch(`${this.config.apiUrl}/api/v1/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': this.config.tenantId },
        body: JSON.stringify({
          channelType: 'website',
          message: { conversationId: this.sessionId, content, type: 'text', role: 'user' },
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.messageId) {
        message.id = data.data.messageId;
      }
    } catch { /* message will still appear locally */ }
  }

  private addMessage(msg: Message): void {
    this.messages.push(msg);
    this.renderMessages();
  }

  private renderMessages(): void {
    const container = document.getElementById('cp-widget-messages');
    if (!container) return;

    container.textContent = ''
    for (const m of this.messages) {
      const div = document.createElement('div')
      div.style.cssText = `
        align-self: ${m.role === 'user' ? 'flex-end' : 'flex-start'};
        background: ${m.role === 'user' ? this.config.primaryColor : (this.config.darkMode ? '#333' : '#f0f0f0')};
        color: ${m.role === 'user' ? 'white' : (this.config.darkMode ? '#e0e0e0' : '#1a1a1a')};
        padding: 10px 14px;
        border-radius: 16px;
        border-bottom-${m.role === 'user' ? 'right' : 'left'}-radius: 4px;
        max-width: 80%;
        word-wrap: break-word;
        font-size: 14px;
        line-height: 1.4;
      `
      div.textContent = m.content
      container.appendChild(div)
    }

    container.scrollTop = container.scrollHeight;
  }

  private async loadMessages(): Promise<void> {
    try {
      const res = await fetch(`${this.config.apiUrl}/api/v1/channels/website/messages?conversationId=${this.sessionId}`, {
        headers: { 'x-tenant-id': this.config.tenantId },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        for (const m of data.data) {
          if (!this.messages.find(msg => msg.id === m.id)) {
            this.messages.push({ id: m.id, content: m.content, role: m.role, timestamp: m.timestamp });
          }
        }
        this.renderMessages();
      }
    } catch { /* no messages yet */ }
  }
}

export function init(config: Partial<WidgetConfig> & { widgetId: string; apiUrl: string; wsUrl: string; tenantId: string }): ConversationWidget {
  return new ConversationWidget(config);
}
