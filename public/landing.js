import { getDatabase, ref, onValue, runTransaction, onDisconnect, set, push } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDkg90BY6ioCqh7dM3KJnfwWq_xqeGRw6A",
    authDomain: "viloir.firebaseapp.com",
    projectId: "viloir",
    storageBucket: "viloir.appspot.com",
    messagingSenderId: "889475158742",
    appId: "1:889475158742:web:5d54324e3d0696048e2f77",
    measurementId: "G-FQF7WW4LZK"
  };
  
  // Initialize Firebase app
  const app = initializeApp(firebaseConfig);
  const database = getDatabase(app);
  const auth = getAuth(app);
  
  let localStream;
  let peerConnection;
  let currentUserId;
  
  const servers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  };
  
  // Update user's connection status
  function updateConnectionStatus(uid, status) {
    const userRef = ref(database, `users/${uid}`);
    set(userRef, { connected: status, busy: false }); // Initial state: not busy
  }
  
  // Track user connection state
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUserId = user.uid;
      updateConnectionStatus(currentUserId, true);
  
      // Get user media
      getUserMedia();
  
      // Handle disconnection
      handleDisconnection();
  
      // Listen for offers and answers
      listenForOffer();
      listenForAnswer();
  
      // Display online users
      displayOnlineUsers();
    } else {
      console.log("No user is logged in.");
    }
  });
  
  // Get user's audio/video stream
  function getUserMedia() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        document.getElementById("userVideo").srcObject = stream;
        localStream = stream;
        findStranger(); // Look for a stranger to chat with
      })
      .catch((error) => console.error("Error accessing media devices:", error));
  }
  
  // Find a random user for video chat
  function findStranger() {
    const availableUsersRef = ref(database, "availableUsers");
  
    onValue(availableUsersRef, (snapshot) => {
      const users = snapshot.val();
      let strangerFound = false;
  
      if (users) {
        for (const userId in users) {
          if (userId !== currentUserId && !users[userId].busy) {
            connectToStranger(userId);
            strangerFound = true;
            break;
          }
        }
      }
  
      if (!strangerFound) {
        addCurrentUserToQueue(); // Add user to waiting queue if no stranger found
      }
    });
  }
  
  // Connect to a random stranger
  function connectToStranger(strangerId) {
    peerConnection = new RTCPeerConnection(servers);
  
    // Add local stream tracks to peer connection
    localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));
  
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendIceCandidate(strangerId, event.candidate);
      }
    };
  
    // Handle receiving remote stream
    peerConnection.ontrack = (event) => {
      document.getElementById("strangerVideo").srcObject = event.streams[0];
    };
  
    // Mark both users as busy
    markUserAsBusy(currentUserId);
    markUserAsBusy(strangerId);
  
    // Create an offer for connection
    peerConnection.createOffer()
      .then((offer) => {
        peerConnection.setLocalDescription(offer);
        sendOffer(strangerId, offer);
      })
      .catch((error) => console.error("Error creating offer:", error));
  }
  
  // Mark user as busy in database
  function markUserAsBusy(userId) {
    const userRef = ref(database, `users/${userId}`);
    set(userRef, { connected: true, busy: true });
  }
  
  // Mark user as available
  function markUserAsAvailable(userId) {
    const userRef = ref(database, `users/${userId}`);
    set(userRef, { connected: true, busy: false });
  }
  
  // Send offer to stranger
  function sendOffer(strangerId, offer) {
    const offerRef = ref(database, `users/${strangerId}/offer`);
    set(offerRef, { offer, from: currentUserId });
  }
  
  // Listen for incoming offers
  function listenForOffer() {
    const offerRef = ref(database, `users/${currentUserId}/offer`);
  
    onValue(offerRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.offer) {
        peerConnection = new RTCPeerConnection(servers);
  
        // Add local stream tracks to peer connection
        localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));
  
        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            sendIceCandidate(data.from, event.candidate);
          }
        };
  
        // Handle receiving remote stream
        peerConnection.ontrack = (event) => {
          document.getElementById("strangerVideo").srcObject = event.streams[0];
        };
  
        // Set remote offer and create an answer
        peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
          .then(() => peerConnection.createAnswer())
          .then((answer) => {
            peerConnection.setLocalDescription(answer);
            sendAnswer(data.from, answer);
          })
          .catch((error) => console.error("Error creating answer:", error));
      }
    });
  }
  
  // Send answer to stranger
  function sendAnswer(strangerId, answer) {
    const answerRef = ref(database, `users/${strangerId}/answer`);
    set(answerRef, { answer, from: currentUserId });
  }
  
  // Listen for answers to offers
  function listenForAnswer() {
    const answerRef = ref(database, `users/${currentUserId}/answer`);
  
    onValue(answerRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.answer) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });
  }
  
  // Send ICE candidate to stranger
  function sendIceCandidate(strangerId, candidate) {
    const candidateRef = ref(database, `users/${strangerId}/candidate`);
    push(candidateRef, { candidate, from: currentUserId });
  }
  
  // Add current user to waiting queue
  function addCurrentUserToQueue() {
    const userQueueRef = ref(database, `availableUsers/${currentUserId}`);
    set(userQueueRef, { waiting: true, busy: false });
  }
  
  // Handle disconnection
  function handleDisconnection() {
    const userRef = ref(database, `availableUsers/${currentUserId}`);
    onDisconnect(userRef).remove();
  }
  
  // Display online users
  function displayOnlineUsers() {
    const usersRef = ref(database, "users");
  
    onValue(usersRef, (snapshot) => {
      const connectedUsers = snapshot.val();
      let count = 0;
  
      for (const userId in connectedUsers) {
        if (connectedUsers[userId].connected && !connectedUsers[userId].busy) {
          count++;
        }
      }
  
      document.getElementById("onlineUsers").textContent = `Users online: ${count}`;
    });
  }
  
  // Next Chat Button functionality
  document.getElementById("nextChatBtn").addEventListener("click", () => {
    if (peerConnection) {
      peerConnection.close();
    }
  
    markUserAsAvailable(currentUserId);
    findStranger();
  });