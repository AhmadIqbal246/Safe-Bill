import React from 'react';
import { MessageCircle, RefreshCw } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleContactList, fetchChatContacts } from '../../../store/slices/ChatSlice';

const ChatButton = () => {
  const dispatch = useDispatch();
  const { chatContacts, isContactListOpen, chatContactsLoading } = useSelector(state => state.chat);
  
  // Calculate total unread messages
  const totalUnread = chatContacts.reduce((sum, contact) => sum + contact.unread_count, 0);

  const handleClick = () => {
    if (!isContactListOpen) {
      // Fetch chat contacts when opening for the first time
      dispatch(fetchChatContacts());
    }
    dispatch(toggleContactList());
  };

  const handleRefresh = (e) => {
    e.stopPropagation();
    dispatch(fetchChatContacts());
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={handleClick}
        className="relative bg-[#01257D] hover:bg-[#2346a0] text-white rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
        title="Chat"
      >
        <MessageCircle size={24} className="text-white" />
        
        {/* Unread message indicator */}
        {totalUnread > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
            {totalUnread > 99 ? '99+' : totalUnread}
          </div>
        )}
        
        {/* Hover effect */}
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-full transition-opacity duration-200"></div>
      </button>

      {/* Debug info - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-20 right-0 bg-white border border-gray-200 rounded-lg p-2 text-xs text-gray-600 shadow-lg min-w-[200px]">
          <div className="font-semibold mb-1">Debug Info:</div>
          <div>Contacts: {chatContacts.length}</div>
          <div>Unread: {totalUnread}</div>
          <div>Loading: {chatContactsLoading ? 'Yes' : 'No'}</div>
          <button
            onClick={handleRefresh}
            className="mt-2 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 flex items-center gap-1"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatButton;
