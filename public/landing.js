// landing.js
import { getDatabase, ref, onValue, set, onDisconnect } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

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

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Track the current user's connection status
onAuthStateChanged(auth, (user) => {
    if (user) {
        const userRef = ref(database, 'users/' + user.uid);
        const connectedRef = ref(database, '.info/connected');
        
        // Monitor connection state
        onValue(connectedRef, (snapshot) => {
            if (snapshot.val() === true) {
                // User is connected
                set(userRef, { connected: true });

                // Handle disconnection
                onDisconnect(userRef).set({ connected: false });
            } else {
                // User is disconnected
                set(userRef, { connected: false });
            }
        });

        // Display the number of online users
        displayOnlineUsers();
    } else {
        console.log('No user is logged in.');
    }
});

// Display the number of online users
function displayOnlineUsers() {
    const usersRef = ref(database, 'users');
    
    onValue(usersRef, (snapshot) => {
        const connectedUsers = snapshot.val();
        let count = 0;
        
        // Count users with 'connected: true'
        for (const userId in connectedUsers) {
            if (connectedUsers[userId].connected) {
                count++;
            }
        }

        // Update the UI with the count
        document.getElementById('onlineUsers').textContent = `Users online: ${count}`;
    });
}
