import React, { useEffect, useState } from "react";
import { Button, message } from "antd";
import {
  getUsers,
  countNewMessages,
  findChatMessages,
  findChatMessage,
} from "../util/ApiUtil";
import { useRecoilValue, useRecoilState } from "recoil";
import {
  loggedInUser,
  chatActiveContact,
  chatMessages,
} from "../atom/globalState";
import ScrollToBottom from "react-scroll-to-bottom";
import "./Chat.css";

import sha256 from 'crypto-js/sha256';
import hmacSHA512 from 'crypto-js/hmac-sha512';
import Base64 from 'crypto-js/enc-base64';

var stompClient = null;
const Chat = (props) => {
  const currentUser = useRecoilValue(loggedInUser);
  const [text, setText] = useState("");
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useRecoilState(chatActiveContact);
  const [messages, setMessages] = useRecoilState(chatMessages);
  const [writingVisible, setwritingVisible] = useState(false);
  const [writingTimeout, setwritingTimeout] = useState(false);



  useEffect(() => {
    if (localStorage.getItem("accessToken") === null) {
      props.history.push("/login");
    }
    connect();
    loadContacts();
  }, []);

  useEffect(() => {
    if (activeContact === undefined) return;
    findChatMessages(activeContact.id, currentUser.id).then((msgs) =>
      setMessages(msgs)
    );
    loadContacts();
  }, [activeContact]);

  const connect = () => {
    const Stomp = require("stompjs");
    var SockJS = require("sockjs-client");
    SockJS = new SockJS("http://207.154.208.203:8080/ws");
    stompClient = Stomp.over(SockJS);
    if(currentUser.id)
     stompClient.connect({}, onConnected, onError);
    else 
      props.history.push("/login");
  };
  const onclose = () =>{
    stompClient.disconnect();
    props.history.push("/login");
  }
  
  const onConnected = () => {
    console.log("connected");
    console.log(currentUser);

    var json = JSON.stringify({
      sesionId:"",
      userId:currentUser.id,
      status:"",
      date:"",
  });
    stompClient.send( "/app/SaveSessionUser", {}, json)  ;
    stompClient.subscribe(
      "/user/" + currentUser.id + "/queue/messages",
      onMessageReceived
    );
    stompClient.subscribe(
      "/user/" + currentUser.id + "/queue/writing",
      writeMethod
    );
    stompClient.subscribe(
      "/user/" + currentUser.id + "/queue/seen",
      seenMsgMethod
    );
  };
  const writeMethod = (msg) => {
    setwritingVisible(true);
    setTimeout(function(){
      setwritingVisible(false);
    },3000)
  }
  


  const onError = (err) => {
    debugger
    console.log(err);
  };
  
  const onMessageReceived = (msg) => {
    const notification = JSON.parse(msg.body);
    const active = JSON.parse(sessionStorage.getItem("recoil-persist"))
    if(active.chatActiveContact.id === notification.senderId){
      const newMessages = JSON.parse(sessionStorage.getItem("recoil-persist")).chatMessages;
      newMessages.push(notification);
      setMessages(newMessages);
      setseen(activeContact,"3");
    } else {
      message.info("Received a new message from " + notification.senderName);
      setseen(activeContact,"2");
    }
    loadContacts();
  };



  const sendMessage = (msg) => {
    if (stompClient.connected & msg.trim() !== "") {
      const message = {
        senderId: currentUser.id,
        recipientId: activeContact.id,
        senderName: currentUser.name,
        recipientName: activeContact.name,
        content: msg,
        timestamp: new Date(),
        status:"1"
      };
      const newMessages = [...messages];
      newMessages.push(message);
      setMessages(newMessages);
      stompClient.send("/app/chat", {}, JSON.stringify(message));
    }else alert("Mesaj gitmedi")
  };


  const seenMsgMethod = (msg) => {
    debugger
      var item = JSON.parse(msg.body);
      if(item.processType == "3" && activeContact.id == item.senderId){
          const newMessages = JSON.parse(sessionStorage.getItem("recoil-persist")).chatMessages;
          newMessages.forEach(element => {element.status = "3"});
          setMessages(newMessages);
      }else{
          const newMessages = JSON.parse(sessionStorage.getItem("recoil-persist")).chatMessages;
          newMessages.forEach(element => { if(element.status == "1" )element.status = "2"});
          setMessages(newMessages);
        console.log("ileti geldi")
      }
     
  }

  const setseen = (activeContact2,status) => {
      if(activeContact2 && currentUser && activeContact2.id && currentUser.id ){
        const message = {
          msgId:"",
          chatId:"",
          senderId:currentUser.id,
          recipientId:activeContact2.id,
          processType :status,
        };
        stompClient.send("/app/seenmessage", {}, JSON.stringify(message));
      }
  };

  

  const write = (msg) => {

    if ( !writingTimeout  && msg.trim() !== "") {
      setwritingTimeout(true)
      const message = {
        chatId:"",
        senderId:currentUser.id,
        recipientId:activeContact.id,
        processType :"1",
      };
      stompClient.send("/app/writingmessage", {}, JSON.stringify(message));
      setTimeout(function(){
        setwritingTimeout(false);
      },3000)
    }
    
  };

  const loadContacts = () => {
    const promise = getUsers().then((users) =>
      users.map((contact) =>
        countNewMessages(contact.id, currentUser.id).then((count) => {
          if(count > 0)  setseen(contact,"2");
         
          contact.newMessages = count;
          return contact;
        })
      )
    );

    promise.then((promises) =>
      Promise.all(promises).then((users) => {
        setContacts(users);
        if (activeContact === undefined && users.length > 0) {
          setActiveContact(users[0]);
        }
      })
    );
  };


  return (
    <div id="frame">
      <div id="sidepanel">
        <div id="profile">
          <div class="wrap">
            <img
              id="profile-img"
              src={currentUser.profilePicture}
              class="online"
              alt=""
            />
            <p>{currentUser.name}</p>
            <div id="status-options">
              <ul>
                <li id="status-online" class="active">
                  <span class="status-circle"></span> <p>Online</p>
                </li>
                <li id="status-away">
                  <span class="status-circle"></span> <p>Away</p>
                </li>
                <li id="status-busy">
                  <span class="status-circle"></span> <p>Busy</p>
                </li>
                <li id="status-offline">
                  <span class="status-circle"></span> <p>Offline</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div id="search" />
        <div id="contacts">
          <ul>
            {contacts.map((contact) => (
              <li
                onClick={() => {
                
                  setActiveContact(contact)
                  setseen(contact ,"3");
                }
                } 
                class={
                  activeContact && contact.id === activeContact.id
                    ? "contact active"
                    : "contact"
                }
              >
                <div class="wrap">
                  <span class="contact-status online"></span>
                  <img id={contact.id} src={contact.profilePicture} alt="" />
                  <div class="meta">
                    <p class="name">{contact.name}</p>
                    {contact.newMessages !== undefined &&
                      contact.newMessages > 0 && (
                        <p class="preview">
                          {contact.newMessages} new messages
                        </p>
                      )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div id="bottom-bar">
          <button id="addcontact"onClick={() => {
                onclose();
              }}>
            <i class="fa fa-user fa-fw" aria-hidden="true"></i>{" "}
            <span>çıkış</span>
          </button>
          <button id="settings">
            <i class="fa fa-cog fa-fw" aria-hidden="true"></i>{" "}
            <span>Settings</span>
          </button>
        </div>
      </div>
      <div class="content">
        <div class="contact-profile">
          <img src={activeContact && activeContact.profilePicture} alt="" />
          <p>{activeContact && activeContact.name}</p>
          {writingVisible ? <p  > Yazıyor...</p> :<p  ></p> } 
        </div>
       
        <ScrollToBottom className="messages">
          <ul>
            {messages.map((msg) => (
              <li class={msg.senderId === currentUser.id ? "sent" : "replies"}>
                {msg.senderId !== currentUser.id && (
                  <img src={activeContact.profilePicture} alt="" />
                )}
                <p>{msg.content}  {
                msg.senderId === currentUser.id && msg.status == "3" ? <i class="fa fa-check"  style={{color:"blue"}} aria-hidden="true"></i> :
                msg.senderId === currentUser.id && msg.status == "2" ? <i class="fa fa-check"  style={{color:"red"}} aria-hidden="true"></i> 
                : <i class="fa fa-check"></i> } 
                  
                </p>

                 
              </li>
            ))}
          </ul>
        </ScrollToBottom>
        <div class="message-input">
          <div class="wrap">
            <input
              name="user_input"
              size="large"
              placeholder="Write your message..."
              value={text}
              onChange={(event) => {
                write(text);
                setText(event.target.value)
              }}
              onKeyPress={(event) => {
                if (event.key === "Enter") {
                  sendMessage(text);
                  setText("");
                }
              }}
            />

            <Button
              icon={<i class="fa fa-paper-plane" aria-hidden="true"></i>}
              onClick={() => {
                sendMessage(text);
                setText("");
              }}
            />
          </div>
        </div>
      </div>
      <text  >Mesajlar uçtan uça şifreli değildir haberiniz ola</text>
    </div>
  );
};

export default Chat;
