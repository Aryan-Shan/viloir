import { database, ref, onValue, set } from './firebase.js';

let localStream;
let remoteStream;
let peerConnection;
let currentStrangerId;
let holdTimer = null;
let holdClicks = 0;
const holdDuration = 600000; // 10 minutes in milliseconds

const configuration = {
    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302'
        }
    ]
};

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

const holdBtn = document.getElementById('holdBtn');
const nextBtn = document.getElementById('nextBtn');

// Loading animation setup
const showLoading = () => {
    remoteVideo.style.display = 'none';
    // Create and show loading animation
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingDiv';
    loadingDiv.innerHTML = '<p>Connecting to a stranger...</p>';
    loadingDiv.classList.add('loading-animation');
    document.getElementById('videoContainer').appendChild(loadingDiv);
};

const hideLoading = () => {
    // Remove loading animation
    const loadingDiv = document.getElementById('loadingDiv');
    if (loadingDiv) {
        loadingDiv.remove();
    }
    remoteVideo.style.display = 'block';
};

async function startCall() {
    // Fetch online users
    const usersRef = ref(database, '/users');
    showLoading();
    
    onValue(usersRef, async (snapshot) => {
        const users = snapshot.val();
        const onlineUsers = Object.keys(users).filter(userId => users[userId].status === 'online' && userId !== user.uid);

        if (onlineUsers.length === 0) {
            alert('No online users available.');
            hideLoading();
            return;
        }

        // Pick a random online user
        currentStrangerId = onlineUsers[Math.floor(Math.random() * onlineUsers.length)];
        alert(`Connected to stranger with ID: ${currentStrangerId}`);

        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;

        peerConnection = new RTCPeerConnection(configuration);

        // Add local tracks to peer connection
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        peerConnection.ontrack = event => {
            if (!remoteStream) {
                remoteStream = new MediaStream();
                remoteVideo.srcObject = remoteStream;
            }
            remoteStream.addTrack(event.track);
        };

        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                // Send the ICE candidate to the stranger
                // This requires signaling logic (Firebase or another method)
            }
        };

        // Create offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        // Send the offer to the stranger
        // Implement signaling mechanism here (e.g., using Firebase)

        hideLoading();
    });

    nextBtn.disabled = false;
}

// Hold functionality
holdBtn.addEventListener('click', () => {
    holdClicks++;
    
    if (holdClicks === 1) {
        alert("You are on hold. Waiting for the other user to confirm.");
    }

    if (holdClicks === 2) {
        holdBtn.disabled = true;
        nextBtn.disabled = true;
        alert("Both users confirmed hold. Next button is disabled for 10 minutes.");

        holdTimer = setTimeout(() => {
            holdBtn.disabled = false;
            nextBtn.disabled = false;
            holdClicks = 0;
        }, holdDuration);
    }
});

// Next functionality
nextBtn.addEventListener('click', () => {
    if (peerConnection) {
        peerConnection.close();
    }

    // Reset video streams
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;

    // Connect to a new random stranger
    startCall();
});

// Handle call end (disconnect from stranger)
function endCall() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
    alert("Disconnected from the current stranger.");

    // Reset state
    currentStrangerId = null;
    hideLoading();
    startCall();
}

// Initiate call on page load
window.addEventListener('load', startCall);
