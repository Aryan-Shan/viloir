// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getDatabase, ref, onValue, runTransaction, onDisconnect } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

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

// Function to update connection status
function updateConnectionStatus(uid, status) {
  const userRef = ref(database, 'users/' + uid);

  runTransaction(userRef, (currentData) => {
    if (currentData === null) {
      return { connected: status };
    } else if (currentData.connected !== status) {
      return { ...currentData, connected: status };
    }
    return currentData; // No change
  }).catch((error) => {
    console.error('Transaction failed: ', error);
  });
}

// Function to monitor the number of online users
function getOnlineUsersCount() {
  const usersRef = ref(database, 'users/');
  onValue(usersRef, (snapshot) => {
    let onlineCount = 0;
    snapshot.forEach((childSnapshot) => {
      const userData = childSnapshot.val();
      if (userData && userData.connected === true) {
        onlineCount++;
      }
    });

    // Safely update the online users count in the DOM
    const onlineUsersElement = document.getElementById('onlineUsers');
    if (onlineUsersElement) {
      onlineUsersElement.innerText = onlineCount;
    } else {
      console.warn("Element with ID 'onlineUsers' not found!");
    }
  });
}

// Monitor auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    const uid = user.uid;
    const connectedRef = ref(database, '.info/connected');

    // Monitor connection state for the logged-in user only
    onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        updateConnectionStatus(uid, true);
        
        // Handle disconnection for this specific user
        const userRef = ref(database, `users/${uid}`);
        onDisconnect(userRef).update({ connected: false });
        
        // Fetch the current number of online users
        getOnlineUsersCount();
      } else {
        // If the connection state is false, update the status
        updateConnectionStatus(uid, false);
      }
    });
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
      sendEmailVerification(user)
        .then(() => {
          alert(`Account created successfully for ${user.email}! Please verify your email before logging in.`);
          window.location.href = 'index.html'; // Redirect to login page after signup
        })
        .catch((error) => {
          console.error("Verification Email Error: ", error.message);
          alert('Verification Email Error: ' + error.message);
        });
    })
    .catch((error) => {
      console.error("Signup Error: ", error.message);
      alert('Signup Error: ' + error.message);
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
      if (user.emailVerified) {
        alert(`Logged in successfully as ${user.email}!`);
        window.location.href = 'home.html'; // Redirect to home page after login
      } else {
        alert("Please verify your email before logging in.");
      }
    })
    .catch((error) => {
      console.error("Login Error: ", error.message);
      alert('Login Error: ' + error.message);
    });
});

// Handle Logout
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      const user = auth.currentUser;
      if (user) {
        // Disconnect the current user and update status before logging out
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

// Validate the email for college domain
function validateEmail(email) {
  const emailPattern = /^[a-zA-Z0-9._%+-]+\.([0-9]{2}[a-zA-Z]{3}[0-9]{5})@vitbhopal\.ac\.in$/;
  return emailPattern.test(email);
}
