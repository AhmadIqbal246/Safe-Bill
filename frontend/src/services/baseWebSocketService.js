/**
 * Base WebSocket Service - Reusable WebSocket implementation
 * Can be extended for different features (notifications, chat, payments, etc.)
 */
class BaseWebSocketService {
  constructor(serviceName = "WebSocket") {
    this.serviceName = serviceName;
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.messageHandlers = new Map();
    this.isConnected = false;
    this.connectionParams = {};
  }

  connect(url, params = {}) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    // Store connection parameters for reconnects
    this.connectionParams = { url, params };

    try {
      this.socket = new WebSocket(url);
      this.setupEventHandlers();
    } catch (error) {
      console.error(`Failed to create ${this.serviceName} connection:`, error);
    }
  }

  setupEventHandlers() {
    this.socket.onopen = () => {
      console.log(`${this.serviceName} connected`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.onConnect();
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error(`Failed to parse ${this.serviceName} message:`, error);
      }
    };

    this.socket.onclose = (event) => {
      console.log(
        `${this.serviceName} disconnected:`,
        event.code,
        event.reason
      );
      this.isConnected = false;
      this.onDisconnect(event);
      this.handleReconnect();
    };

    this.socket.onerror = (error) => {
      console.error(`${this.serviceName} error:`, error);
      this.isConnected = false;
      this.onError(error);
    };
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect ${this.serviceName}... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        if (
          this.socket &&
          this.socket.readyState === WebSocket.CLOSED &&
          this.connectionParams.url
        ) {
          this.connect(this.connectionParams.url, this.connectionParams.params);
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error(`Max ${this.serviceName} reconnection attempts reached`);
    }
  }

  handleMessage(data) {
    const { type } = data;

    // Call specific handler if it exists
    if (this.messageHandlers.has(type)) {
      this.messageHandlers.get(type)(data);
    }

    // Call generic message handler
    if (this.messageHandlers.has("message")) {
      this.messageHandlers.get("message")(data);
    }
  }

  sendMessage(type, data = {}) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = {
        type,
        ...data,
      };
      this.socket.send(JSON.stringify(message));
    } else {
      console.error(`${this.serviceName} is not connected`);
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
      this.connectionParams = {};
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  // Override these methods in subclasses for custom behavior
  onConnect() {
    // Called when connection is established
  }

  onDisconnect(event) {
    // Called when connection is lost
    console.log(`${this.serviceName} disconnected:`, event.code, event.reason);
  }

  onError(error) {
    // Called when an error occurs
    console.error(`${this.serviceName} error:`, error);
  }
}

export default BaseWebSocketService;
