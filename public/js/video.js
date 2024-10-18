import { database, ref, get, set, onValue } from './firebase.js';

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const connectedUserDisplay = document.getElementById('Connected_user');
const loadingGifPath = '../assets/icon.gif';  // Path to your loading gif

let localStream = null;
let peer = null;
let currentCall = null;
let currentUser = JSON.parse(sessionStorage.getItem('user')); // Store current user info
let lastConnectedUserId = null;  // Track the last connected user for one call only
let busy = false;  // Flag to prevent concurrent connection attempts

// Initialize the app when the page loads
window.onload = async () => {
    await initializePeerJS();
    initializeInCallField();  // Set inCall to false at page load
};

// Initialize PeerJS and set up local video stream
async function initializePeerJS() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;

        peer = new Peer(currentUser.uid);

        peer.on('call', handleIncomingCall);
        peer.on('error', (err) => {
            console.error('PeerJS error:', err);
        });

    } catch (error) {
        console.error('Error initializing PeerJS or getting local media:', error);
    }
}

// Initialize the 'inCall' field for the user
function initializeInCallField() {
    const userStatusRef = ref(database, `users/${currentUser.uid}`);
    set(userStatusRef, {
        ...currentUser,
        status: 'online',
        inCall: false   // Initialize the inCall field as false
    }).catch((err) => {
        console.error('Error initializing inCall field:', err);
    });
}

// Handle incoming call
function handleIncomingCall(call) {
    displayLoading();

    // If there's an existing call, close it first
    if (currentCall) {
        currentCall.close();  // Ensure the current call is closed before handling the new one
        resetRemoteVideo();
    }

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

            // Store the last connected user (overwrite the previous one)
            lastConnectedUserId = call.peer;  // Track the current user only
        });

        call.on('error', (err) => {
            console.error('Call error:', err);
            resetRemoteVideo();
            updateUserCallStatus(currentUser.uid, false);
            updateUserCallStatus(call.peer, false);
        });

        currentCall = call;  // Set the current call
    });
}

// Only initiate a call when the "Next" button is clicked
function connectToNewRandomUser() {
    if (busy) {
        return; // Prevent concurrent connection attempts
    }

    displayLoading();
    busy = true; // Set busy flag

    const usersRef = ref(database, 'users');
    get(usersRef).then(snapshot => {
        const users = snapshot.val();
        const onlineUsers = Object.keys(users).filter(uid => 
            uid !== currentUser.uid &&  // Exclude current user
            uid !== lastConnectedUserId &&  // Exclude the last connected user
            users[uid].status === 'online' && 
            users[uid].inCall === false
        );

        if (onlineUsers.length > 0) {
            const randomUserId = onlineUsers[Math.floor(Math.random() * onlineUsers.length)];
            initiateOutgoingCall(randomUserId);
        } else {
            busy = false; // Reset busy flag
            connectedUserDisplay.textContent = "No available users to connect.";
        }
    }).catch((err) => {
        console.error('Error fetching users:', err);
        busy = false; // Reset busy flag in case of error
    });
}

// Initiate an outgoing call to the selected user
function initiateOutgoingCall(targetUserId) {
    if (!peer) {
        console.error('PeerJS not initialized.');
        return;
    }

    // If there's an existing call, close it first
    if (currentCall) {
        currentCall.close();  // Ensure any existing call is closed before starting a new one
        resetRemoteVideo();
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

            // Store the last connected user (overwrite the previous one)
            lastConnectedUserId = targetUserId;  // Track the current user only
            busy = false; // Reset busy flag
        });

        call.on('error', (err) => {
            console.error('Error during call:', err);
            resetRemoteVideo();
            updateUserCallStatus(currentUser.uid, false);
            updateUserCallStatus(targetUserId, false);
            busy = false; // Reset busy flag
        });

        currentCall = call;  // Set the current call
    });
}

// Update the user's inCall status in Firebase
function updateUserCallStatus(userId, inCall) {
    const userStatusRef = ref(database, `users/${userId}/inCall`);
    set(userStatusRef, inCall).catch((err) => {
        console.error('Failed to update inCall status:', err);
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
            console.error('Could not fetch email for user:', userId);
        }
    });
}

// Reset remote video when a call ends
function resetRemoteVideo() {
    remoteVideo.srcObject = null;
    connectedUserDisplay.textContent = "Disconnected.";
}

// Display loading overlay while waiting for remote stream
function displayLoading() {
    document.getElementById('loadingOverlay').style.display = 'block';  // Show the loading overlay
}

// Hide the loading overlay once the stream is ready
function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';  // Hide the loading overlay
}

// "Next" button functionality to end the current call and connect to a new random user
document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentCall) {
        currentCall.close();  // End the current call
        currentCall = null;  // Reset the currentCall to null after closing
    }
    connectToNewRandomUser();  // Connect to a new random user only when "Next" button is clicked
});
