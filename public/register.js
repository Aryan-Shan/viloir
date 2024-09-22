import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getDatabase, ref, set, runTransaction, onDisconnect } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// Firebase configuration
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
        } else {
            currentData.connected = status;
            return currentData;
        }
    }, { applyLocally: false });
}

// Handle user login
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Delay to prevent multiple simultaneous connections
        setTimeout(() => {
            updateConnectionStatus(user.uid, true);
        }, 100); // Adding a small delay for stability

        // Handle disconnection
        const userRef = ref(database, 'users/' + user.uid);
        onDisconnect(userRef).set({ connected: false });
    } else {
        console.log('User logged out');
    }
});

// Handle Signup
document.getElementById('signupForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    createUserWithEmailAndPassword(auth, email, password)
        .then(() => {
            alert('Account created successfully!');
            window.location.href = 'Pages/home.html';
        })
        .catch((error) => {
            alert('Error: ' + error.message);
        });
});

// Handle Login
document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            alert('Logged in successfully!');
            window.location.href = 'Pages/home.html';
        })
        .catch((error) => {
            alert('Login Error: ' + error.message);
        });
});

// Handle Logout
document.getElementById('logoutBtn').addEventListener('click', function () {
    signOut(auth).then(() => {
        console.log('User logged out');
        window.location.href = "../index.html"; // Redirect to login page
    });
});
