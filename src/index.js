import React from "react";
import ReactDOM from "react-dom";
import { RecoilRoot } from "recoil";
import recoilPersist from "recoil-persist";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";

{/* <script src="https://www.gstatic.com/firebasejs/8.2.4/firebase-app.js"></script>


  // Your web app's Firebase configuration
  var firebaseConfig = {
    apiKey: "AIzaSyDdYyChYJPKWYI9iqQaSoMstCRPchgeVzw",
    authDomain: "chat-ca615.firebaseapp.com",
    projectId: "chat-ca615",
    storageBucket: "chat-ca615.appspot.com",
    messagingSenderId: "524698568025",
    appId: "1:524698568025:web:b7fcd25240cfce21193848"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig); */}


const { RecoilPersist, updateState } = recoilPersist([], {
  key: "recoil-persist",
  storage: sessionStorage,
});

ReactDOM.render(
  <RecoilRoot initializeState={updateState}>
    <RecoilPersist />
    <App />
  </RecoilRoot>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
