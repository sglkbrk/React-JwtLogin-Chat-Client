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

var stompClient = null;
const Chat = (props) => {
  const currentUser = useRecoilValue(loggedInUser);
  const [text, setText] = useState("");
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useRecoilState(chatActiveContact);
  const [messages, setMessages] = useRecoilState(chatMessages);

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
    stompClient.connect({name:"burak"}, onConnected, onError);
  };
  const onclose = () =>{
    stompClient.disconnect();
  }
  const onConnected = () => {
    console.log("connected");
    console.log(currentUser);
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
    console.log(msg);
    console.log("Yazıyor");
  }
  const seenMsgMethod = (msg) => {
    console.log(msg);
    console.log("Görüldü");
  }
  const onError = (err) => {
    console.log(err);
  };

  const onMessageReceived = (msg) => {
    const notification = JSON.parse(msg.body);
    const active = JSON.parse(sessionStorage.getItem("recoil-persist"))
    if(active.chatActiveContact.id === notification.senderId){
      debugger
      const newMessages = JSON.parse(sessionStorage.getItem("recoil-persist")).chatMessages;
      newMessages.push(notification);
      setMessages(newMessages);
      seen(notification);
    } else {
      message.info("Received a new message from " + notification.senderName);
    }
    loadContacts();
  };

  const sendMessage = (msg) => {
    if (msg.trim() !== "") {
      const message = {
        senderId: currentUser.id,
        recipientId: activeContact.id,
        senderName: currentUser.name,
        recipientName: activeContact.name,
        content: msg,
        timestamp: new Date(),
      };
      stompClient.send("/app/chat", {}, JSON.stringify(message));

      const newMessages = [...messages];
      newMessages.push(message);
      setMessages(newMessages);
    }
  };

  const seen = (msg) => {
    if (msg) {
      if(activeContact && currentUser && activeContact.id && currentUser.id ){
        const message = {
          msgId:msg.id,
          chatId:msg.id,
          senderId:currentUser.id,
          recipientId:activeContact.id,
          processType :"2",
        };
        stompClient.send("/app/seenmessage", {}, JSON.stringify(message));
      }
      
    }
  };

  const write = (msg) => {
    if (msg.trim() !== "") {
      const message = {
        chatId:"",
        senderId:currentUser.id,
        recipientId:activeContact.id,
        processType :"1",
      };
      stompClient.send("/app/writingmessage", {}, JSON.stringify(message));
    }
  };

  const loadContacts = () => {
    const promise = getUsers().then((users) =>
      users.map((contact) =>
        countNewMessages(contact.id, currentUser.id).then((count) => {
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
    return
    var users = [
      {
        id :"1",
        username :"burak",
        password :"123",
        email :"123",
        createdAt :"123",
        updatedAt :"123",
        active :"X",
        userProfile :"123",
        roles :"1",
        newMessages:[]
      },
      {
        id :"2",
        username :"asd",
        password :"123",
        email :"asd",
        createdAt :"123",
        updatedAt :"123",
        active :"X",
        userProfile :"123",
        roles :"1",
        newMessages:[]
      },
     
    ]
    setContacts(users)
    users.map((contact) =>
        countNewMessages(contact.id, currentUser.id).then((count) => {
          contact.newMessages = count;
          return contact;
        })
    )
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
                onClick={() => setActiveContact(contact)}
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
        </div>
        <ScrollToBottom className="messages">
          <ul>
            {messages.map((msg) => (
              <li class={msg.senderId === currentUser.id ? "sent" : "replies"}>
                {msg.senderId !== currentUser.id && (
                  <img src={activeContact.profilePicture} alt="" />
                )}
                <p>{msg.content}</p>
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
    </div>
  );
};

export default Chat;
