let localStream;
let remoteStream;
let peerConnection;

const configuration = {
    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302'
        }
    ]
};

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

const startCallBtn = document.getElementById('startCallBtn');
const endCallBtn = document.getElementById('endCallBtn');

startCallBtn.addEventListener('click', startCall);
endCallBtn.addEventListener('click', endCall);

async function startCall() {
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
            // Send the ICE candidate to the other peer
            // You need to implement a signaling mechanism
        }
    };

    // Create offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Send the offer to the other peer
    // Implement a signaling mechanism here

    startCallBtn.disabled = true;
    endCallBtn.disabled = false;
}

function endCall() {
    peerConnection.close();
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;

    startCallBtn.disabled = false;
    endCallBtn.disabled = true;
}
