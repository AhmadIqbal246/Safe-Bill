import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  sendTextMessage, 
  fetchMessages, 
  connectToProjectChat, 
  disconnectFromProjectChat 
} from '../../../store/slices/ChatSlice';
import websocketService from '../../../services/websocketService';
import { formatDistanceToNow } from 'date-fns';
import { X, Paperclip, Send } from 'lucide-react';
import { closeChat } from '../../../store/slices/ChatSlice';

// Helper function to get current user ID
const getCurrentUserId = () => {
  const user = sessionStorage.getItem('user');
  return user ? JSON.parse(user).user_id : null;
};

const ChatWindow = () => {
  const dispatch = useDispatch();
  const { 
    selectedContact, 
    isChatOpen, 
    messages, 
    messagesLoading 
  } = useSelector(state => state.chat);
  
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const projectId = selectedContact?.project_info?.id;

  useEffect(() => {
    if (isChatOpen && projectId) {
      // Fetch existing messages
      dispatch(fetchMessages(projectId));
      
      // Connect to WebSocket for real-time updates
      dispatch(connectToProjectChat({ projectId }));
    }
    
    // Cleanup: disconnect when chat closes
    return () => {
      if (!isChatOpen) {
        dispatch(disconnectFromProjectChat());
      }
    };
  }, [isChatOpen, projectId, dispatch]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // If chat is open and there are messages, mark the latest as read
    if (isChatOpen && projectId) {
      const list = messages[projectId] || [];
      if (list.length > 0) {
        const last = list[list.length - 1];
        if (last && last.id) {
          websocketService.markAsRead(last.id);
        }
      }
    }
  }, [messages, projectId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !projectId) return;

    const messageData = {
      content: newMessage.trim(),
      client_message_id: Date.now().toString(),
    };

    try {
      await dispatch(sendTextMessage({ projectId, messageData })).unwrap();
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Handle file upload logic here
      console.log('File selected:', file);
    }
  };

  const handleClose = () => {
    dispatch(closeChat());
  };

  if (!isChatOpen || !selectedContact) return null;

  const currentMessages = messages[projectId] || [];
  const contactName = selectedContact.contact_info.first_name && selectedContact.contact_info.last_name
    ? `${selectedContact.contact_info.first_name} ${selectedContact.contact_info.last_name}`
    : selectedContact.contact_info.username;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#E6F0FA] rounded-full flex items-center justify-center">
              <span className="text-[#01257D] font-semibold">
                {contactName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{contactName}</h2>
              <p className="text-sm text-gray-500">{selectedContact.project_info.name}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messagesLoading ? (
            <div className="text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#01257D] mx-auto mb-2"></div>
              Loading messages...
            </div>
          ) : currentMessages.length === 0 ? (
            <div className="text-center text-gray-500">
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            currentMessages.map((message) => {
              const currentUserId = getCurrentUserId();
              const isCurrentUserMessage = message.sender === currentUserId;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUserMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isCurrentUserMessage
                        ? 'bg-[#01257D] text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <p className="text-sm break-words">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      isCurrentUserMessage
                        ? 'text-blue-100'
                        : 'text-gray-500'
                    }`}>
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {/* <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Attach file"
            >
              <Paperclip size={20} />
            </button> */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
            />
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="p-2 bg-[#01257D] text-white rounded-lg hover:bg-[#2346a0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send message"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
