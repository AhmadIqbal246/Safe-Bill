import React from 'react';
import ChatButton from './ChatButton';
import ChatContactList from './ChatContactList';
import ChatWindow from './ChatWindow';

const Chat = () => {
  return (
    <>
      <ChatButton />
      <ChatContactList />
      <ChatWindow />
    </>
  );
};

export default Chat;
