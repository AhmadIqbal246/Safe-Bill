import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/';

export const aiApiService = {
  /**
   * Fetches the full chat history for a session from the Django backend.
   */
  async getChatHistory(sessionId) {
    const token = sessionStorage.getItem('access');
    const response = await axios.get(`${API_BASE_URL}api/ai/sessions/${sessionId}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Fetches list of all chat sessions for the current user.
   */
  async listSessions() {
    const token = sessionStorage.getItem('access');
    const response = await axios.get(`${API_BASE_URL}api/ai/sessions/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Main function to handle streaming RAG responses.
   * Leverages browser's Fetch Stream API for real-time output.
   */
  async sendMessageStream(message, sessionId, onChunk, onComplete, onError) {
    const token = sessionStorage.getItem('access');

    try {
      const response = await fetch(`${API_BASE_URL}api/ai/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message,
          session_id: sessionId
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullText += chunk;
        if (onChunk) onChunk(chunk);
      }

      if (onComplete) onComplete(fullText);
    } catch (err) {
      if (onError) onError(err);
      console.error('Streaming error:', err);
    }
  }
};
