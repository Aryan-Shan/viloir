import { database, ref, set, onValue, onChildAdded, push } from './firebase.js'; // Ensure this line is present

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const user = JSON.parse(sessionStorage.getItem('user'));

let localStream;
let peer; // PeerJS peer object
let currentCall; // Current PeerJS call

// Start the call when the page loads
window.onload = async () => {
    console.log("Page loaded, initializing PeerJS...");
    await initializePeer();
};

// Initialize PeerJS
async function initializePeer() {
    // Get local media stream
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    // Create a new Peer instance
    peer = new Peer(user.uid); // Use user ID as Peer ID

    // Handle incoming calls
    peer.on('call', (call) => {
        console.log("Incoming call from:", call.peer);
        answerCall(call);
    });

    // Handle errors
    peer.on('error', (err) => {
        console.error("Peer error:", err);
    });

    console.log("Peer initialized:", peer);
}

// Answer an incoming call
function answerCall(call) {
    console.log("Answering call...");
    call.answer(localStream); // Answer the call with the local stream

    // Set up remote stream
    call.on('stream', (remoteStream) => {
        console.log("Received remote stream.");
        remoteVideo.srcObject = remoteStream; // Set remote video stream
    });

    call.on('close', () => {
        console.log("Call ended.");
        remoteVideo.srcObject = null; // Clear remote video on call end
    });
}

// Connect to a random user
async function connectToRandomUser() {
    console.log("Connecting to a random online user...");
    const usersRef = ref(database, 'users');
    onValue(usersRef, snapshot => {
        const users = snapshot.val();
        const onlineUsers = Object.keys(users).filter(userId => users[userId].status === 'online' && userId !== user.uid);

        if (onlineUsers.length > 0) {
            const randomUserId = onlineUsers[Math.floor(Math.random() * onlineUsers.length)];
            console.log("Random user selected:", randomUserId);
            initiateCallWithUser(randomUserId);
        } else {
            console.log("No online users available.");
        }
    });
}

// Initiate call with the selected random user
function initiateCallWithUser(randomUserId) {
    console.log("Initiating call with user:", randomUserId);

    // Ensure that the peer object is defined before calling
    if (!peer) {
        console.error("Peer instance not initialized. Cannot initiate call.");
        return;
    }

    const call = peer.call(randomUserId, localStream); // Initiate a call to the random user

    call.on('stream', (remoteStream) => {
        console.log("Received remote stream.");
        remoteVideo.srcObject = remoteStream; // Set remote video stream
    });

    call.on('close', () => {
        console.log("Call ended.");
        remoteVideo.srcObject = null; // Clear remote video on call end
    });

    currentCall = call; // Store the current call
}

// 'Next' button functionality
document.getElementById('nextBtn').addEventListener('click', async () => {
    console.log("Next button clicked, disconnecting current call and connecting to a new user...");
    if (currentCall) {
        currentCall.close(); // Close the current call
    }
    await connectToRandomUser(); // Connect to a new random user
});
