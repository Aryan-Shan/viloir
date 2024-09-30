import { database, ref, set, onDisconnect, onValue } from './firebase.js';

// Get the logged-in user from sessionStorage
const user = JSON.parse(sessionStorage.getItem('user'));

if (user && user.uid) {
    const userStatusRef = ref(database, `/users/${user.uid}`);

    // Set user as online when entering the chat page
    set(userStatusRef, {
        email: user.email,
        status: 'online',
        lastActive: Date.now()
    });

    // Handle when the user disconnects or closes the chat page
    onDisconnect(userStatusRef).set({
        email: user.email,
        status: 'offline',
        lastActive: Date.now()
    });

    // Function to count online users
    const countOnlineUsers = () => {
        const usersRef = ref(database, '/users');
        onValue(usersRef, (snapshot) => {
            const users = snapshot.val();
            let onlineCount = 0;
            for (const userId in users) {
                if (users[userId].status === 'online') {
                    onlineCount++;
                }
            }
            // Update the online user count display
            document.getElementById('onlineCount').innerText = onlineCount;
        });
    };

    // Call the function to count online users
    countOnlineUsers();

    // Logout button functionality
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', () => {
        // Set user as offline in the database
        set(userStatusRef, {
            email: user.email,
            status: 'offline',
            lastActive: Date.now()
        }).then(() => {
            // Clear the user from session storage
            sessionStorage.removeItem('user');
            // Redirect to login page
            window.location.href = 'index.html';
        }).catch((error) => {
            console.error("Error updating status:", error);
            // Optionally handle error (e.g., alert user)
        });
    });

    // Handle leaving the chat page (user becomes offline)
    window.addEventListener('beforeunload', function () {
        set(userStatusRef, {
            email: user.email,
            status: 'offline',
            lastActive: Date.now()
        }).catch((error) => {
            console.error("Error updating status on unload:", error);
        });
    });
} else {
    // Redirect to login page if no user is found in session storage
    window.location.href = 'index.html';
}
