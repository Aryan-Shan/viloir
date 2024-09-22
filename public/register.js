import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getDatabase, ref, set, onDisconnect } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

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

// Function to set user status in the Realtime Database
function setUserStatus(userId, isOnline) {
    set(ref(database, 'users/' + userId), {
        online: isOnline,
        lastActive: isOnline ? Date.now() : null
    });
}

// Handle user signup
document.getElementById('signupForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            // Set user as online in Realtime Database
            setUserStatus(user.uid, true);

            // Handle disconnection
            const userRef = ref(database, 'users/' + user.uid);
            onDisconnect(userRef).set({
                online: false,
                lastActive: Date.now()
            });

            alert('Account created successfully!');
            window.location.href = 'Pages/home.html';
        })
        .catch((error) => {
            alert('Error: ' + error.message);
        });
});

// Handle user login
document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            // Set user as online in Realtime Database
            setUserStatus(user.uid, true);

            // Handle disconnection
            const userRef = ref(database, 'users/' + user.uid);
            onDisconnect(userRef).set({
                online: false,
                lastActive: Date.now()
            });

            alert('Logged in successfully!');
            window.location.href = 'Pages/home.html';
        })
        .catch((error) => {
            alert('Login Error: ' + error.message);
        });
});

// Handle user logout
document.getElementById('logoutBtn').addEventListener('click', function () {
    const user = auth.currentUser;
    if (user) {
        setUserStatus(user.uid, false); // Set user offline before logging out
    }
    signOut(auth).then(() => {
        window.location.href = "../index.html"; // Redirect to login page
    });
});
