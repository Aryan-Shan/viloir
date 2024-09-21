

// Login form event listener
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert('Login successful');
            console.log(userCredential);
            // Redirect to dashboard or main app page
        })
        .catch((error) => {
            console.error(error);
            alert(error.message);
        });
});

// Signup form event listener
document.getElementById('signup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert('Signup successful');
            console.log(userCredential);
            // Redirect to dashboard or main app page
        })
        .catch((error) => {
            console.error(error);
            alert(error.message);
        });
});

// Toggle between login and signup forms
document.getElementById('toggle-signup').addEventListener('click', () => {
    document.querySelector('.form-container').classList.add('hidden');
    document.getElementById('signup-container').classList.remove('hidden');
});

document.getElementById('toggle-login').addEventListener('click', () => {
    document.getElementById('signup-container').classList.add('hidden');
    document.querySelector('.form-container').classList.remove('hidden');
});
