import { database, ref, set, onValue, onChildAdded, push } from './firebase.js'; // Ensure this line is present

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const connectedUserElement = document.getElementById('Connected_user'); // Element to show connected user's email
const loadingGif = '../assets/loading.gif'; // Path to your loading gif
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
        // Fetch email of the caller from Firebase and display it
        getUserEmail(call.peer, (email) => {
            connectedUserElement.textContent = `Connected with: ${email}`;
        });
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
    displayLoadingGif(); // Show loading gif when answering call
    call.answer(localStream); // Answer the call with the local stream

    // Set up remote stream
    call.on('stream', (remoteStream) => {
        console.log("Received remote stream.");
        hideLoadingGif(); // Hide loading gif once stream is received
        remoteVideo.srcObject = remoteStream; // Set remote video stream
    });

    call.on('close', () => {
        console.log("Call ended.");
        hideLoadingGif(); // Hide loading gif if call ends abruptly
        remoteVideo.srcObject = null; // Clear remote video on call end
    });
}

// Connect to a random user
async function connectToRandomUser() {
    console.log("Connecting to a random online user...");
    displayLoadingGif(); // Show loading gif while connecting to a random user
    const usersRef = ref(database, 'users');
    onValue(usersRef, snapshot => {
        const users = snapshot.val();
        const onlineUsers = Object.keys(users).filter(userId => users[userId].status === 'online' && userId !== user.uid);

        if (onlineUsers.length > 0) {
            const randomUserId = onlineUsers[Math.floor(Math.random() * onlineUsers.length)];
            const randomUserEmail = users[randomUserId].email; // Get the email of the random user
            console.log(`Random user selected: ${randomUserId} (${randomUserEmail})`);
            connectedUserElement.textContent = `Connected with: ${randomUserEmail}`; // Display connected user's email
            initiateCallWithUser(randomUserId);
        } else {
            console.log("No online users available.");
            connectedUserElement.textContent = "No online users available.";
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

    // Fetch email of the random user from Firebase and display it for the caller
    getUserEmail(randomUserId, (email) => {
        connectedUserElement.textContent = `Connected with: ${email}`;
    });

    const call = peer.call(randomUserId, localStream); // Initiate a call to the random user

    call.on('stream', (remoteStream) => {
        console.log("Received remote stream.");
        hideLoadingGif(); // Hide loading gif once stream is received
        remoteVideo.srcObject = remoteStream; // Set remote video stream
    });

    call.on('close', () => {
        console.log("Call ended.");
        hideLoadingGif(); // Hide loading gif if call ends abruptly
        remoteVideo.srcObject = null; // Clear remote video on call end
    });

    currentCall = call; // Store the current call
}

// Show a loading gif while waiting for the remote stream
function displayLoadingGif() {
    remoteVideo.src = loadingGif; // Show loading gif in place of remote video
}

// Hide the loading gif once the stream is ready
function hideLoadingGif() {
    remoteVideo.src = ''; // Clear the loading gif
}

// Function to fetch user email from Firebase
function getUserEmail(userId, callback) {
    const userRef = ref(database, `users/${userId}/email`);
    onValue(userRef, (snapshot) => {
        const email = snapshot.val();
        if (email) {
            console.log(`Fetched email for user ${userId}: ${email}`);
            callback(email);
        } else {
            console.error(`Could not fetch email for user ${userId}`);
        }
    });
}

// 'Next' button functionality
document.getElementById('nextBtn').addEventListener('click', async () => {
    console.log("Next button clicked, disconnecting current call and connecting to a new user...");
    if (currentCall) {
        currentCall.close(); // Close the current call
    }
    await connectToRandomUser(); // Connect to a new random user
});
