import React, { useContext, useEffect, useState} from 'react';
import io from 'socket.io-client';
import useSound from 'use-sound';
import config from '../../../config';
import LatestMessagesContext from '../../../contexts/LatestMessages/LatestMessages';
import TypingMessage from './TypingMessage';
import Header from './Header';
import Footer from './Footer';
import Message from './Message';
import '../styles/_messages.scss';
import initialMessages from '../../../common/constants/initialBottyMessage'

const socket = io(
  config.BOT_SERVER_ENDPOINT,
  { transports: ['websocket', 'polling', 'flashsocket'] }
);

function Messages() {
  const [playSend] = useSound(config.SEND_AUDIO_URL);
  const [playReceive] = useSound(config.RECEIVE_AUDIO_URL);
  const { setLatestMessage } = useContext(LatestMessagesContext);
  const [userCurrentMessage, setUserCurrentMessage] = useState(null);
  const [botMessage, setBotMessage] = useState(null);
  const [botTyping, setBotTyping] = useState(false);
  const [messages, setMessages] = useState([]);

  // For the initial message.
  useEffect(() => {
    setMessages([...messages, {
      id: Date.now(),
      user: "bot",
      message: initialMessages
    }]);
  }, []);


  // scroll to a particular id, called with id = 'endOfMessages'
  const scrollToBottom = (id) => {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  useEffect(() => {
    scrollToBottom('endOfMessages')
  }, [messages]);


  // actions that user performs
  const userActions = {
    sendMessage: () => {
      setMessages([...messages, userCurrentMessage]);
      setUserCurrentMessage(null);
      document.getElementById('user-message-input').value = null;
      playSend();
      setLatestMessage(userCurrentMessage.user, userCurrentMessage.message);
      socket.emit('user-message', userCurrentMessage.message);
    }, 

    onChangeMessage: (e) =>  {
      setUserCurrentMessage({
        ...userCurrentMessage,
        id: Date.now(),
        user: 'me',
        message: e.target.value
      });
    },
  }


  // actions that bot performs
  const botActions = {
    sendMessage: (mssg) => {
      const mssgObj = {
        id: Date.now(),
        user: 'bot',
        message: mssg
      }
      setBotTyping(false);
      setBotMessage(mssgObj);
      setLatestMessage(mssgObj.user, mssgObj.message);
    },
    botTyping: () => {
      setBotTyping(true);
    },
  }


  // handle bot message
  useEffect(() => {
    if (botMessage) {
      setMessages([...messages, botMessage]);
      playReceive();
    }
  }, [botMessage])


  // get wrapped message component
  const _getMessage = (curr) => {
    return Message({
      message: curr,
      botTyping: botTyping
    });    
  }


  // listen to socket changes
  useEffect(() => {
    socket.on('bot-message', botActions.sendMessage);
    socket.on('bot-typing', botActions.botTyping);
  }, [socket]);


  return (
    <div className="messages">
      <Header />
      <div className="messages__list" id="message-list">
        {messages.map((current, index) => _getMessage(current))}
        <div key={Date.now()} id='endOfMessages'></div>
      </div>
      {botTyping ? <TypingMessage/>: null}
      <Footer message={userCurrentMessage} sendMessage={userActions.sendMessage} onChangeMessage={(e) => userActions.onChangeMessage(e)} />
    </div>
  );
}

export default Messages;
