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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

let localStream;
let peerConnection;
let currentUserId;
const servers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

// Function to update the user's connection status
function updateConnectionStatus(uid, status) {
    const userRef = ref(database, `users/${uid}`);

    runTransaction(userRef, (currentData) => {
        if (currentData === null) {
            return { connected: status, busy: false }; // Initial state: not busy
        } else {
            currentData.connected = status;
            return currentData;
        }
    }, { applyLocally: false });
}

// Track the current user's connection status
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        updateConnectionStatus(user.uid, true);

        // Get user's video stream
        getUserMedia();

        // Handle disconnection
        handleDisconnection();

        // Listen for offers and answers
        listenForOffer();
        listenForAnswer();

        // Display the number of online users
        displayOnlineUsers();
    } else {
        console.log('No user is logged in.');
    }
});

// Get the local video stream
function getUserMedia() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            document.getElementById('userVideo').srcObject = stream;
            localStream = stream;

            // Look for another user to chat with
            findStranger();
        })
        .catch(error => console.error('Error accessing media devices.', error));
}

// Find a random stranger for video chat
function findStranger() {
    const availableUsersRef = ref(database, 'availableUsers');

    onValue(availableUsersRef, (snapshot) => {
        const users = snapshot.val();

        if (users) {
            let strangerFound = false;

            for (let userId in users) {
                if (userId !== currentUserId && !users[userId].busy) {
                    connectToStranger(userId);
                    strangerFound = true;
                    break;
                }
            }

            if (!strangerFound) {
                addCurrentUserToQueue();
            }
        } else {
            addCurrentUserToQueue();
        }
    });
}

// Connect to a random stranger
function connectToStranger(strangerId) {
    peerConnection = new RTCPeerConnection(servers);

    // Add local stream to the peer connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Set up ICE candidates
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            // Send candidate to the stranger
            sendIceCandidate(strangerId, event.candidate);
        }
    };

    // Handle receiving remote stream
    peerConnection.ontrack = event => {
        document.getElementById('strangerVideo').srcObject = event.streams[0];
    };

    // Mark both users as busy
    markUserAsBusy(currentUserId);
    markUserAsBusy(strangerId);

    // Create an offer to connect
    peerConnection.createOffer().then(offer => {
        peerConnection.setLocalDescription(offer);
        sendOffer(strangerId, offer);
    });
}

// Mark user as busy in the database
function markUserAsBusy(userId) {
    const userRef = ref(database, `users/${userId}`);
    set(userRef, { connected: true, busy: true });
}

// Mark the user as available
function markUserAsAvailable(userId) {
    const userRef = ref(database, `users/${userId}`);
    set(userRef, { connected: true, busy: false });
}

// Send offer to stranger
function sendOffer(strangerId, offer) {
    const offerRef = ref(database, `users/${strangerId}/offer`);
    set(offerRef, { offer, from: currentUserId });
}

// Listen for an incoming offer
function listenForOffer() {
    const offerRef = ref(database, `users/${currentUserId}/offer`);
    
    onValue(offerRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.offer) {
            peerConnection = new RTCPeerConnection(servers);

            // Add local stream to the peer connection
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

            // Set up ICE candidates
            peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    sendIceCandidate(data.from, event.candidate);
                }
            };

            // Handle receiving remote stream
            peerConnection.ontrack = event => {
                document.getElementById('strangerVideo').srcObject = event.streams[0];
            };

            // Set remote offer and create an answer
            peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
                .then(() => peerConnection.createAnswer())
                .then(answer => {
                    peerConnection.setLocalDescription(answer);
                    sendAnswer(data.from, answer);
                });
        }
    });
}

// Send answer to the stranger
function sendAnswer(strangerId, answer) {
    const answerRef = ref(database, `users/${strangerId}/answer`);
    set(answerRef, { answer, from: currentUserId });
}

// Listen for an answer to the offer
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

// Add current user to the waiting queue
function addCurrentUserToQueue() {
    const userQueueRef = ref(database, `availableUsers/${currentUserId}`);
    set(userQueueRef, { waiting: true, busy: false });
}

// Handle disconnection
function handleDisconnection() {
    const userRef = ref(database, `availableUsers/${currentUserId}`);
    onDisconnect(userRef).remove();
}

// Display the number of online users
function displayOnlineUsers() {
    const usersRef = ref(database, 'users');

    onValue(usersRef, (snapshot) => {
        const connectedUsers = snapshot.val();
        let count = 0;

        // Count users who are connected and not busy
        for (const userId in connectedUsers) {
            if (connectedUsers[userId].connected && !connectedUsers[userId].busy) {
                count++;
            }
        }

        // Update the UI with the count
        document.getElementById('onlineUsers').textContent = `Users online: ${count}`;
    });
}

// Next Chat Button functionality
document.getElementById('nextChatBtn').addEventListener('click', () => {
    // Close the current peer connection
    if (peerConnection) {
        peerConnection.close();
    }

    // Mark both users as available again
    markUserAsAvailable(currentUserId);

    // Find a new stranger to chat with
    findStranger();
});
