import { database, ref, get, set, onValue } from './firebase.js';

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const connectedUserDisplay = document.getElementById('Connected_user');
const loadingGifPath = '../assets/loading.gif';  // Path to your loading gif

let localStream = null;
let peer = null;
let currentCall = null;
let currentUser = JSON.parse(sessionStorage.getItem('user')); // Store current user info

// Initialize the app when the page loads
window.onload = async () => {
    await initializePeerJS();
    initializeInCallField();  // Set inCall to false at page load
};

// Initialize PeerJS and set up local video stream
async function initializePeerJS() {
    try {
        // Get local video/audio stream
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;

        // Initialize PeerJS with user ID
        peer = new Peer(currentUser.uid);

        // Handle incoming calls
        peer.on('call', handleIncomingCall);

        // Handle errors
        peer.on('error', (err) => {
            connectToNewRandomUser();
        });

    } catch (error) {
        // Handle error if necessary
    }
}

// Initialize the 'inCall' field for the user to track whether they are in a call
function initializeInCallField() {
    const userStatusRef = ref(database, `users/${currentUser.uid}`);
    set(userStatusRef, {
        ...currentUser,
        status: 'online',
        inCall: false   // Initialize the inCall field as false
    }).catch((err) => {
        // Handle error if necessary
    });
}

// Handle incoming call
function handleIncomingCall(call) {
    displayLoading();

    // Fetch and display caller's email
    getUserEmail(call.peer, (callerEmail) => {
        connectedUserDisplay.textContent = `Connected with: ${callerEmail}`;

        // Set both users to "inCall"
        updateUserCallStatus(currentUser.uid, true);
        updateUserCallStatus(call.peer, true);

        // Answer the call with local stream
        call.answer(localStream);

        // Handle remote stream
        call.on('stream', (remoteStream) => {
            hideLoading();
            remoteVideo.srcObject = remoteStream;
        });

        call.on('close', () => {
            resetRemoteVideo();
            updateUserCallStatus(currentUser.uid, false);  // Set inCall to false after call ends
            updateUserCallStatus(call.peer, false);
            connectToNewRandomUser();
        });

        call.on('error', (err) => {
            resetRemoteVideo();
            updateUserCallStatus(currentUser.uid, false);
            updateUserCallStatus(call.peer, false);
            connectToNewRandomUser();
        });

        currentCall = call;
    });
}

// Connect to a random available user (who is not in a call)
function connectToNewRandomUser() {
    displayLoading();

    const usersRef = ref(database, 'users');
    get(usersRef).then(snapshot => {
        const users = snapshot.val();
        const onlineUsers = Object.keys(users).filter(uid => 
            uid !== currentUser.uid && users[uid].status === 'online' && users[uid].inCall === false
        );

        if (onlineUsers.length > 0) {
            const randomUserId = onlineUsers[Math.floor(Math.random() * onlineUsers.length)];
            initiateOutgoingCall(randomUserId);
        } else {
            setTimeout(connectToNewRandomUser, 5000);  // Retry after 5 seconds
        }
    }).catch((err) => {
        // Handle error if necessary
    });
}

// Initiate an outgoing call to the selected user
function initiateOutgoingCall(targetUserId) {
    if (!peer) {
        return;
    }

    displayLoading();

    // Fetch and display the email of the user being called
    getUserEmail(targetUserId, (targetUserEmail) => {
        connectedUserDisplay.textContent = `Connecting with: ${targetUserEmail}`;

        // Set both users to "inCall"
        updateUserCallStatus(currentUser.uid, true);
        updateUserCallStatus(targetUserId, true);

        const call = peer.call(targetUserId, localStream);
        call.on('stream', (remoteStream) => {
            hideLoading();
            remoteVideo.srcObject = remoteStream;
        });

        call.on('close', () => {
            resetRemoteVideo();
            updateUserCallStatus(currentUser.uid, false);
            updateUserCallStatus(targetUserId, false);
            connectToNewRandomUser();
        });

        call.on('error', (err) => {
            resetRemoteVideo();
            updateUserCallStatus(currentUser.uid, false);
            updateUserCallStatus(targetUserId, false);
            connectToNewRandomUser();
        });

        currentCall = call;
    });
}

// Update the user's inCall status in Firebase
function updateUserCallStatus(userId, inCall) {
    const userStatusRef = ref(database, `users/${userId}/inCall`);
    set(userStatusRef, inCall).catch((err) => {
        // Handle error if necessary
    });
}

// Fetch user email from Firebase by their ID
function getUserEmail(userId, callback) {
    const userRef = ref(database, `users/${userId}/email`);
    onValue(userRef, (snapshot) => {
        const email = snapshot.val();
        if (email) {
            callback(email);
        } else {
            // Handle error if necessary
        }
    });
}

// Reset remote video when a call ends
function resetRemoteVideo() {
    remoteVideo.srcObject = null;
    connectedUserDisplay.textContent = "Disconnected.";
}

// Display loading gif while waiting for remote stream
function displayLoading() {
    remoteVideo.src = loadingGifPath;
}

// Hide the loading gif once the stream is ready
function hideLoading() {
    remoteVideo.src = '';  // Clear the loading gif
}

// "Next" button functionality to end the current call and connect to a new random user
document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentCall) {
        currentCall.close();  // End the current call
    }
    connectToNewRandomUser();  // Connect to a new random user
});
