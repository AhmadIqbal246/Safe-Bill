import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Search, Clock, User } from 'lucide-react';
import { 
  closeContactList, 
  setSelectedContact, 
  toggleChat,
  markContactAsRead,
  fetchChatContacts
} from '../../../store/slices/ChatSlice';
import { formatDistanceToNow } from 'date-fns';

const ChatContactList = () => {
  const dispatch = useDispatch();
  const { 
    chatContacts, 
    chatContactsLoading, 
    chatContactsError, 
    isContactListOpen 
  } = useSelector(state => state.chat);

  const handleContactClick = (contact) => {
    // Mark contact as read when clicked
    if (contact.unread_count > 0) {
      dispatch(markContactAsRead(contact.id));
    }
    
    // Set selected contact and open chat
    dispatch(setSelectedContact(contact));
    dispatch(closeContactList());
    dispatch(toggleChat());
  };

  const handleClose = () => {
    dispatch(closeContactList());
  };

  if (!isContactListOpen) return null;
  console.log("Chat Contacts", chatContacts);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto">
          {chatContactsLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#01257D] mx-auto mb-2"></div>
              Loading contacts...
            </div>
          ) : chatContactsError ? (
            <div className="p-4 text-center text-red-500">
              <div className="mb-2">Error loading contacts: {chatContactsError}</div>
              <button 
                onClick={() => dispatch(fetchChatContacts())}
                className="px-3 py-1 bg-[#01257D] text-white rounded text-sm hover:bg-[#2346a0]"
              >
                Retry
              </button>
            </div>
          ) : chatContacts.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <User size={48} className="mx-auto mb-2 text-gray-300" />
              <p>No chat contacts yet</p>
              <p className="text-sm mb-4">Start a conversation by messaging someone from a project</p>
              
              {/* Debug info */}
              <div className="text-xs text-gray-400 border-t pt-3">
                <p>Debug: {chatContacts.length} contacts loaded</p>
                <p>Loading: {chatContactsLoading ? 'Yes' : 'No'}</p>
                <p>Error: {chatContactsError || 'None'}</p>
                <button 
                  onClick={() => dispatch(fetchChatContacts())}
                  className="mt-2 px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                >
                  Refresh Contacts
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {chatContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => handleContactClick(contact)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-[#E6F0FA] rounded-full flex items-center justify-center">
                        <span className="text-[#01257D] font-semibold text-lg">
                          {contact.contact_info.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {contact.contact_info.first_name && contact.contact_info.last_name
                            ? `${contact.contact_info.first_name} ${contact.contact_info.last_name}`
                            : contact.contact_info.username}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {/* Time */}
                          {contact.last_message_at && (
                            <span className="text-xs text-gray-500 flex items-center">
                              <Clock size={12} className="mr-1" />
                              {formatDistanceToNow(new Date(contact.last_message_at), { addSuffix: true })}
                            </span>
                          )}
                          
                          {/* Unread count */}
                          {contact.unread_count > 0 && (
                            <span className="bg-[#01257D] text-white text-xs font-bold rounded-full px-2 py-1 min-w-[20px] text-center">
                              {contact.unread_count > 99 ? '99+' : contact.unread_count}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Project name */}
                      <p className="text-xs text-[#01257D] font-medium truncate">
                        {contact.project_info.name}
                      </p>

                      {/* Last message preview */}
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {contact.last_message_text || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            {chatContacts.length} contact{chatContacts.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatContactList;
