import { getDatabase, ref, set, onValue, push } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { auth } from './app.js';

const database = getDatabase();

// Variables to handle local and remote video streams
let localStream;
let remoteStream;
let peerConnection;
const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// HTML elements
const userVideo = document.getElementById('userVideo');
const strangerVideo = document.getElementById('strangerVideo');
const holdButton = document.getElementById('holdButton');
const nextButton = document.getElementById('nextButton');
const onlineUsersRef = ref(database, 'users/');

// To keep track of hold status
let holdStatus = { user: false, stranger: false };

// Start video call process
async function startVideoCall() {
    try {
        // Get the user's media (audio and video)
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        userVideo.srcObject = localStream;

        // Initialize peer connection
        peerConnection = new RTCPeerConnection(configuration);

        // Add local stream tracks to peer connection
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        // Set up remote stream
        remoteStream = new MediaStream();
        strangerVideo.srcObject = remoteStream;

        // Handle incoming tracks from the remote peer
        peerConnection.ontrack = (event) => {
            event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignalingMessage({ 'ice': event.candidate });
            }
        };

        // Listen for offers/answers from Firebase signaling
        listenForSignaling();
        
        // Connect to a random user
        await connectToRandomUser();

    } catch (error) {
        console.error("Error starting video call:", error);
    }
}

// Connect to a random online user
async function connectToRandomUser() {
    try {
        const onlineUsers = await getOnlineUsers();
        if (onlineUsers.length === 0) {
            console.warn("No online users available for connection.");
            return;
        }

        const randomUserId = onlineUsers[Math.floor(Math.random() * onlineUsers.length)].uid;
        const signalingRef = ref(database, 'signaling/' + randomUserId);

        // Set up signaling reference for the selected random user
        onValue(signalingRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                handleSignalingData(data);
            }
        });

        // Send an offer to the random user
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        sendSignalingMessage({ 'offer': offer, userId: randomUserId });

    } catch (error) {
        console.error("Error connecting to a random user:", error);
    }
}

// Get online users from the database
async function getOnlineUsers() {
    return new Promise((resolve, reject) => {
        onValue(onlineUsersRef, (snapshot) => {
            const users = [];
            snapshot.forEach((childSnapshot) => {
                const userData = childSnapshot.val();
                if (userData && userData.connected) {
                    users.push({ uid: childSnapshot.key, ...userData });
                }
            });
            resolve(users);
        }, (error) => {
            console.error("Error fetching online users:", error);
            reject(error);
        });
    });
}

// Send signaling messages to Firebase
function sendSignalingMessage(message) {
    if (!message.userId) {
        console.error("User ID is missing in the signaling message.");
        return;
    }
    const signalingRef = push(ref(database, 'signaling/' + message.userId));
    set(signalingRef, message)
        .catch(error => console.error("Error sending signaling message:", error));
}

// Listen for signaling messages from Firebase
function listenForSignaling() {
    const signalingRef = ref(database, 'signaling/' + auth.currentUser.uid);
    onValue(signalingRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            handleSignalingData(data);
        }
    }, (error) => {
        console.error("Error listening for signaling messages:", error);
    });
}

// Handle signaling data
async function handleSignalingData(data) {
    try {
        if (data.ice) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.ice));
        } else if (data.offer) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            sendSignalingMessage({ 'answer': answer, userId: data.userId });
        } else if (data.answer) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
    } catch (error) {
        console.error("Error handling signaling data:", error);
    }
}

// Handle "Next" button to find a new peer
nextButton.addEventListener('click', () => {
    startVideoCall(); // Initialize a new video call with the next user
});

// Handle "Hold" button (locks the conversation)
holdButton.addEventListener('click', () => {
    if (!holdStatus.user) {
        holdStatus.user = true; // Set user's hold status to true
        console.log("You have held the conversation. Waiting for the stranger to hold...");
    }

    // Check if the stranger has also held the call
    if (holdStatus.stranger) {
        console.log("Both parties have held the conversation. Locking the call for 10 minutes.");
        nextButton.disabled = true; // Disable the next button
        setTimeout(() => {
            nextButton.disabled = false; // Re-enable after 10 minutes
            holdStatus.user = false; // Reset user's hold status
            holdStatus.stranger = false; // Reset stranger's hold status
            console.log("Hold period is over. You can connect to a new user.");
        }, 10 * 60 * 1000);
    }
});

// Function to handle the stranger's hold button (this should be called in your signaling logic)
function onStrangerHold() {
    holdStatus.stranger = true; // Set stranger's hold status to true
    console.log("Stranger has held the conversation.");
    // Check if the user has also held the call
    if (holdStatus.user) {
        console.log("Both parties have held the conversation. Locking the call for 10 minutes.");
        nextButton.disabled = true; // Disable the next button
        setTimeout(() => {
            nextButton.disabled = false; // Re-enable after 10 minutes
            holdStatus.user = false; // Reset user's hold status
            holdStatus.stranger = false; // Reset stranger's hold status
            console.log("Hold period is over. You can connect to a new user.");
        }, 10 * 60 * 1000);
    }
}

// Start the video call on page load
startVideoCall();
