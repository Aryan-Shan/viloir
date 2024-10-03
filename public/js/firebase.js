// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { getDatabase, ref, set, onDisconnect, onValue ,remove,update,push,onChildAdded,get} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

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

export { auth, database, ref, set, onDisconnect, onValue ,remove,update,push,onChildAdded,get};
