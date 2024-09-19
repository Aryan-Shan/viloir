// Firebase initialization and auth logic

// Helper function to validate college email
function isCollegeEmail(email) {
    const domain = email.split('@')[1];
    return domain === "vitbhopal.ac.in";
}

// Sign up function
document.getElementById('signup-btn').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!isCollegeEmail(email)) {
        alert('Please use a valid college email');
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            const user = userCredential.user;
            db.collection('users').doc(user.uid).set({
                email: user.email,
                username: user.email.split('@')[0],
                uid: user.uid
            });
            alert('Signup successful!');
        })
        .catch(error => {
            console.error('Error signing up:', error);
            alert(error.message);
        });
});

// Login function
document.getElementById('login-btn').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!isCollegeEmail(email)) {
        alert('Please use a valid college email');
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            alert('Login successful!');
        })
        .catch(error => {
            console.error('Error logging in:', error);
            alert(error.message);
        });
});
