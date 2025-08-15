class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.messageHandlers = new Map();
    this.isConnected = false;
  }

  connect(projectId, token) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = `${import.meta.env.VITE_WS_BASE_URL || 'ws://127.0.0.1:8000'}/ws/chat/project/${projectId}/?token=${token}`;
    
    try {
      this.socket = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  setupEventHandlers() {
    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.isConnected = false;
      this.handleReconnect();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnected = false;
    };
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.socket && this.socket.readyState === WebSocket.CLOSED) {
          this.connect(this.currentProjectId, this.currentToken);
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  handleMessage(data) {
    const { type, message } = data;
    
    switch (type) {
      case 'new.message':
        if (this.messageHandlers.has('newMessage')) {
          this.messageHandlers.get('newMessage')(message);
        }
        break;
      
      case 'typing':
        if (this.messageHandlers.has('typing')) {
          this.messageHandlers.get('typing')(data);
        }
        break;
      
      case 'read_receipt':
        if (this.messageHandlers.has('readReceipt')) {
          this.messageHandlers.get('readReceipt')(data);
        }
        break;
      
      default:
        console.log('Unknown message type:', type);
    }
  }

  sendMessage(content, clientMessageId) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = {
        type: 'send_message',
        content,
        client_message_id: clientMessageId
      };
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  sendTyping(isTyping) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = {
        type: 'typing',
        is_typing: isTyping
      };
      this.socket.send(JSON.stringify(message));
    }
  }

  markAsRead(lastMessageId) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = {
        type: 'read',
        last_read_message_id: lastMessageId
      };
      this.socket.send(JSON.stringify(message));
    }
  }

  on(event, handler) {
    this.messageHandlers.set(event, handler);
  }

  off(event) {
    this.messageHandlers.delete(event);
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      this.messageHandlers.clear();
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();
export default websocketService;
