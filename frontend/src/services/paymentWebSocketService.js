class PaymentWebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.messageHandlers = new Map();
    this.isConnected = false;
  }

  connect(token, inviteToken) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    // Store context for reconnects
    this.currentToken = token;
    this.currentInviteToken = inviteToken;

    const wsUrl = `${import.meta.env.VITE_WS_BASE_URL || 'ws://127.0.0.1:8000'}/ws/payments/status/?token=${token}&invite_token=${inviteToken}`;
    
    try {
      this.socket = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to create Payment WebSocket connection:', error);
    }
  }

  setupEventHandlers() {
    this.socket.onopen = () => {
      console.log('Payment WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Request current payment status
      this.getPaymentStatus();
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Failed to parse Payment WebSocket message:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log('Payment WebSocket disconnected:', event.code, event.reason);
      this.isConnected = false;
      this.handleReconnect();
    };

    this.socket.onerror = (error) => {
      console.error('Payment WebSocket error:', error);
      this.isConnected = false;
    };
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect Payment WebSocket... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.socket && this.socket.readyState === WebSocket.CLOSED) {
          this.connect(this.currentToken, this.currentInviteToken);
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max Payment WebSocket reconnection attempts reached');
    }
  }

  handleMessage(data) {
    const { type } = data;
    
    switch (type) {
      case 'payment_status_update':
        if (this.messageHandlers.has('paymentStatusUpdate')) {
          this.messageHandlers.get('paymentStatusUpdate')(data.data);
        }
        break;
      
      case 'project_status_update':
        if (this.messageHandlers.has('projectStatusUpdate')) {
          this.messageHandlers.get('projectStatusUpdate')(data.data);
        }
        break;
      
      case 'pong':
        // Handle ping response
        break;
      
      default:
        console.log('Unknown Payment WebSocket message type:', type);
    }
  }

  getPaymentStatus() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = {
        type: 'get_payment_status'
      };
      this.socket.send(JSON.stringify(message));
    }
  }

  ping() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = {
        type: 'ping'
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
const paymentWebSocketService = new PaymentWebSocketService();
export default paymentWebSocketService;
