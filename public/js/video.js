import { database, ref, onValue, set } from './firebase.js';

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const nextBtn = document.getElementById('nextBtn');

// Get the logged-in user from sessionStorage
const user = JSON.parse(sessionStorage.getItem('user'));

// Variables to hold the peer connection and the remote user
let peerConnection;
let currentRemoteUserId = null;
const iceCandidateQueue = []; // Store incoming ICE candidates

// Configuration for ICE servers (STUN/TURN)
const iceServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }, // STUN server for NAT traversal
    ]
};

// Function to start the connection
async function startConnection(remoteUserId) {
    // Create a new peer connection
    peerConnection = new RTCPeerConnection(iceServers);

    // Get local media stream
    try {
        const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream; // Display local video

        // Add local tracks to the peer connection
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        // Handle remote stream when received
        peerConnection.ontrack = (event) => {
            remoteVideo.srcObject = event.streams[0]; // Display remote video
        };

        // Collect ICE candidates from Firebase
        collectIceCandidates(remoteUserId);

        // Create and send the offer to the remote user
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        // Save the offer to Firebase under the room for the remote user
        const roomRef = ref(database, `/rooms/${remoteUserId}`);
        await set(roomRef, {
            offer: {
                type: offer.type,  // The type of the SDP message (offer)
                sdp: offer.sdp     // The actual SDP string
            },
            userId: user.uid, // Store the ID of the user initiating the call
            timestamp: Date.now() // Add a timestamp for reference
        });

        // Listen for updates on the room (e.g., answers)
        onValue(roomRef, async (snapshot) => {
            const data = snapshot.val();
            if (data && data.answer) {
                console.log('Answer received:', data.answer);
                const answer = new RTCSessionDescription(data.answer);
                await peerConnection.setRemoteDescription(answer);
                processIceCandidateQueue(); // Process queued candidates after remote description is set
            }
        });

        // Handle ICE candidate event to send to Firebase
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                const candidate = event.candidate.toJSON(); // Convert to JSON format
                console.log('New ICE candidate:', candidate);
                // Save the ICE candidate to Firebase under the remote user's room
                set(ref(database, `/rooms/${remoteUserId}/candidates/${Date.now()}`), candidate);
            }
        };

        // Handle ICE connection state changes
        peerConnection.oniceconnectionstatechange = () => {
            if (peerConnection.iceConnectionState === 'disconnected') {
                console.log('Remote user disconnected.');
                disconnectCurrentUser(); // Handle disconnection
            }
        };
    } catch (error) {
        console.error('Error accessing media devices:', error);
    }
}

// Function to collect ICE candidates from Firebase
async function collectIceCandidates(remoteUserId) {
    const candidatesRef = ref(database, `/rooms/${remoteUserId}/candidates`);
    
    // Listen for changes in the candidates
    onValue(candidatesRef, (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const candidateData = childSnapshot.val(); // Get candidate data
            const candidate = new RTCIceCandidate(candidateData); // Create ICE candidate
            console.log('Received ICE candidate:', candidate);
            if (peerConnection.remoteDescription) {
                peerConnection.addIceCandidate(candidate).catch(error => {
                    console.error("Error adding ICE candidate:", error);
                });
            } else {
                iceCandidateQueue.push(candidate); // Queue the incoming candidate
            }
        });
    });
}

// Process the queued ICE candidates after setting the remote description
function processIceCandidateQueue() {
    console.log('Processing ICE candidate queue:', iceCandidateQueue);
    while (iceCandidateQueue.length > 0) {
        const candidate = iceCandidateQueue.shift(); // Get the first candidate from the queue
        peerConnection.addIceCandidate(candidate).catch((error) => {
            console.error("Error adding ICE candidate:", error);
        });
    }
}

// Function to disconnect from the current user
async function disconnectCurrentUser() {
    if (peerConnection) {
        peerConnection.close(); // Close the peer connection
        peerConnection = null;
        currentRemoteUserId = null;
        remoteVideo.srcObject = null; // Clear remote video
    }
}

// Function to connect to a random online user
async function connectToRandomUser() {
    disconnectCurrentUser(); // Disconnect from the current user
    const onlineUsersRef = ref(database, '/users');

    // Listen for online users
    onValue(onlineUsersRef, async (snapshot) => {
        const users = snapshot.val();
        // Filter for online users excluding the current user
        const onlineUsers = Object.keys(users).filter(userId => users[userId].status === 'online' && userId !== user.uid);
        
        if (onlineUsers.length > 0) {
            // Select a random user from the online users
            const randomUserId = onlineUsers[Math.floor(Math.random() * onlineUsers.length)];
            await startConnection(randomUserId); // Start connection with the selected user
            currentRemoteUserId = randomUserId; // Store the ID of the connected remote user
        } else {
            console.log('No online users available.');
        }
    });
}

// Event listener for the "Next" button
nextBtn.addEventListener('click', () => {
    connectToRandomUser(); // Connect to a random user when the button is clicked
});

// Connect to a random user on page load
connectToRandomUser();
