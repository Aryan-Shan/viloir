// Firebase initialization and auth logic (Firebase v9 modular syntax)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-firestore.js";

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper function to validate college email
function isCollegeEmail(email) {
    const domain = email.split('@')[1];
    return domain === "vitbhopal.ac.in";
}

// Sign up function
document.getElementById('signup-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Validate email and password
    if (!isCollegeEmail(email)) {
        alert('Please use a valid college email');
        return;
    }
    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }

    // Disable button to prevent multiple submissions
    document.getElementById('signup-btn').disabled = true;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store user details in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            username: user.email.split('@')[0],
            uid: user.uid
        });
        alert('Signup successful!');
    } catch (error) {
        console.error('Error signing up:', error);
        alert(error.message);
    } finally {
        // Re-enable button
        document.getElementById('signup-btn').disabled = false;
    }
});

// Login function
document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Validate email
    if (!isCollegeEmail(email)) {
        alert('Please use a valid college email');
        return;
    }

    // Disable button to prevent multiple submissions
    document.getElementById('login-btn').disabled = true;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert('Login successful!');
    } catch (error) {
        console.error('Error logging in:', error);
        alert(error.message);
    } finally {
        // Re-enable button
        document.getElementById('login-btn').disabled = false;
    }
});
