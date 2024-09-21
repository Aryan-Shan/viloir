const signupLink = document.getElementById('switchToSignup');
const loginLink = document.getElementById('switchToLogin');
const loginFormContainer = document.getElementById('loginFormContainer');
const signupFormContainer = document.getElementById('signupFormContainer');

// Switch to Sign Up Form
signupLink.addEventListener('click', function (e) {
    e.preventDefault();
    loginFormContainer.classList.add('hidden');
    signupFormContainer.classList.remove('hidden');
});

// Switch to Login Form
loginLink.addEventListener('click', function (e) {
    e.preventDefault();
    signupFormContainer.classList.add('hidden');
    loginFormContainer.classList.remove('hidden');
});
