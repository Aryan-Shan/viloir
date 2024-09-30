import { auth } from './firebase.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendEmailVerification 
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

// Handle Signup
document.getElementById('signupForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    if (!email.endsWith('@vitbhopal.ac.in')) {
        alert('Please use your college email (example.23BAI10383@vitbhopal.ac.in)');
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            sendEmailVerification(user).then(() => {
                alert('Verification email sent! Please verify your email.');
            });
        })
        .catch((error) => {
            alert(error.message);
        });
});

// Handle Login
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;

            if (!user.emailVerified) {
                alert('Please verify your email first.');
            } else {
                // Save user info in session storage to access on chat page
                sessionStorage.setItem('user', JSON.stringify(user));
                window.location.href = 'chat.html';
            }
        })
        .catch((error) => {
            alert(error.message);
        });
});
