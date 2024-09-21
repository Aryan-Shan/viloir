import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-analytics.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

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
const analytics = getAnalytics(app);
const auth = getAuth(app);

// Handle Sign Up
document.getElementById('signupForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Account created successfully
            alert('Account created successfully!');
            window.location.href = 'landing.html';  // Redirect to landing page after signup
        })
        .catch((error) => {
            // Show error message
            alert('Error: ' + error.message);
        });
});

// Handle Login
document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Login successful
            alert('Logged in successfully!');
            window.location.href = 'landing.html';  // Redirect to landing page after login
        })
        .catch((error) => {
            // Show error message
            alert('Login Error: ' + error.message);
        });
});
