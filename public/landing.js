import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";

// Initialize Firebase app (reuse firebaseConfig from register.js)
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Display the number of online users
function displayOnlineUsers() {
    const usersRef = ref(database, 'users');
    
    onValue(usersRef, (snapshot) => {
        const users = snapshot.val();
        let onlineCount = 0;
        
        for (let userId in users) {
            if (users[userId].online) {
                onlineCount++;
            }
        }
        
        document.getElementById('onlineUsers').textContent = `Users online: ${onlineCount}`;
    });
}

// Call the function to display online users
displayOnlineUsers();
