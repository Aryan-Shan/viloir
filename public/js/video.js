import { getDatabase, ref, set, onValue, push } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-database.js";
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

// Start video call process
async function startVideoCall() {
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
}

// Send signaling messages to Firebase
function sendSignalingMessage(message) {
    const signalingRef = push(ref(database, 'signaling'));
    set(signalingRef, message);
}

// Listen for signaling messages from Firebase
function listenForSignaling() {
    const signalingRef = ref(database, 'signaling');
    onValue(signalingRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            handleSignalingData(data);
        }
    });
}

// Handle signaling data
async function handleSignalingData(data) {
    if (data.ice) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.ice));
    } else if (data.offer) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        sendSignalingMessage({ 'answer': answer });
    } else if (data.answer) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
}

// Handle "Next" button to find a new peer
nextButton.addEventListener('click', () => {
    startVideoCall(); // Initialize a new video call with the next user
});

// Handle "Hold" button (locks the conversation)
holdButton.addEventListener('click', () => {
    holdButton.disabled = true; // Disable the hold button after it's clicked
    setTimeout(() => {
        holdButton.disabled = false; // Re-enable after 10 minutes
    }, 10 * 60 * 1000);
});

// Start the video call on page load
startVideoCall();
