// landing.js
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";

// Firebase configuration (copy from register.js)
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

// Call the function to display online users
displayOnlineUsers();
