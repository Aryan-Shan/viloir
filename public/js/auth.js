import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    sendEmailVerification // Import sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getDatabase, ref, runTransaction, onDisconnect, onValue } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

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
const auth = getAuth(app);
const database = getDatabase(app);

// Function to update the user's connection status using transactions
function updateConnectionStatus(uid, status) {
    const userRef = ref(database, 'users/' + uid);
    runTransaction(userRef, (currentData) => {
        if (currentData === null) {
            return { connected: status };
        } else if (currentData.connected !== status) { // Only update if the status has changed
            currentData.connected = status;
            return currentData;
        }
        return; // Return undefined to indicate no change
    });
}


// Function to get the number of online users
function getOnlineUsersCount() {
    const usersRef = ref(database, 'users/');
    onValue(usersRef, (snapshot) => {
        let onlineCount = 0;
        snapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val();
            if (userData && userData.connected) {
                onlineCount++;
            }
        });
        document.getElementById('onlineUsers').innerText = onlineCount; // Update online users count on the home page
    });
}

// Handle user login and connection status
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Set up the user reference
        const userRef = ref(database, 'users/' + user.uid);

        // Monitor the connection state
        const connectedRef = ref(database, '.info/connected');
        onValue(connectedRef, (snapshot) => {
            if (snapshot.val() === true) {
                updateConnectionStatus(user.uid, true);
                onDisconnect(userRef).set({ connected: false });
            }
        });

        // Call to get online users count when a user logs in
        getOnlineUsersCount();
    } else {
        console.log('User is logged out');
    }
});


// Handle Signup
document.getElementById('signupForm')?.addEventListener('submit', function (event) {
    event.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    if (!validateEmail(email)) {
        alert("Invalid email format! Please use your college email (e.g., firstname.23BDS80088@vitbhopal.ac.in)");
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            // Send email verification
            sendEmailVerification(user)
                .then(() => {
                    alert(`Account created successfully for ${user.email}! Please verify your email before logging in.`);
                    window.location.href = 'index.html'; // Redirecting to login page after signup
                });
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Signup Error: ", errorCode, errorMessage);
            alert('Signup Error: ' + errorMessage);
        });
});

// Handle Login
document.getElementById('loginForm')?.addEventListener('submit', function (event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            // Check if email is verified
            if (user.emailVerified) {
                alert(`Logged in successfully as ${user.email}!`);
                window.location.href = 'home.html'; // Redirecting to home.html after successful login
            } else {
                alert("Please verify your email before logging in.");
            }
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Login Error: ", errorCode, errorMessage);
            alert('Login Error: ' + errorMessage);
        });
});

// Handle Logout
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            const user = auth.currentUser; // Get current user
            if (user) {
                // Update the user's connection status to false before logging out
                updateConnectionStatus(user.uid, false);
            }
            signOut(auth)
                .then(() => {
                    console.log('User logged out');
                    window.location.href = "index.html"; // Redirect to login page after logout
                })
                .catch((error) => {
                    console.error("Logout Error: ", error.message);
                });
        });
    } else {
        console.error("Logout button not found!");
    }
});

// Validate the email for college domain (example: firstname.23BDS80088@vitbhopal.ac.in)
function validateEmail(email) {
    const emailPattern = /^[a-zA-Z0-9._%+-]+\.([0-9]{2}[a-zA-Z]{3}[0-9]{5})@vitbhopal\.ac\.in$/; // Customize the regex as per your college domain
    return emailPattern.test(email);
}
