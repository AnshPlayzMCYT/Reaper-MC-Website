import { auth } from "./firebase-config.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    getAdditionalUserInfo
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {

    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const googleBtn = document.getElementById('google-login-btn');
    const errorBox = document.getElementById('auth-error');
    const successBox = document.getElementById('auth-success');

    const showError = (message) => {
        if (errorBox) {
            errorBox.textContent = message;
            errorBox.classList.remove('hidden');
        }
    };

    const hideError = () => {
        if (errorBox) {
            errorBox.classList.add('hidden');
        }
    };

    const showSuccess = () => {
        if (successBox) {
            successBox.classList.remove('hidden');
        }
    };

    const hideSuccess = () => {
        if (successBox) {
            successBox.classList.add('hidden');
        }
    };

    const toggleLoading = (buttonId, isLoading) => {
        const btn = document.getElementById(buttonId);
        if (!btn) return;
        const textSpan = btn.querySelector('span');
        const spinner = btn.querySelector('i');

        if (isLoading) {
            if (textSpan) textSpan.classList.add('opacity-0');
            if (spinner) spinner.classList.remove('hidden');
            btn.disabled = true;
            btn.classList.add('opacity-75');
        } else {
            if (textSpan) textSpan.classList.remove('opacity-0');
            if (spinner) spinner.classList.add('hidden');
            btn.disabled = false;
            btn.classList.remove('opacity-75');
        }
    };

    const showMinecraftUsernamePrompt = (user) => {
        const modalHtml = `
            <div id="mc-username-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                <div class="bg-brand-light border border-brand-border rounded-xl shadow-2xl p-6 max-w-md w-full animate-fade-in-up">
                    <div class="text-center mb-6">
                        <img src="https://static.readdy.ai/image/77fb13bf09ca7e6cd3a010ee816e6478/b15e1ab27f31f6972fd10171fc3fdcd7.png" alt="Reaper MC Logo" class="w-16 mx-auto mb-4 drop-shadow-lg">
                        <h3 class="text-2xl font-black text-white mb-2">Minecraft Username</h3>
                        <p class="text-sm text-brand-text">Please enter your Minecraft username to complete your registration. This is required to receive store items.</p>
                    </div>
                    
                    <div id="mc-modal-error" class="hidden bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md mb-4 text-center"></div>

                    <form id="mc-username-form" class="space-y-4">
                        <div>
                            <input type="text" id="modal-mc-username" required
                                class="w-full bg-brand-darkest border border-brand-border rounded-lg py-3 px-4 text-white focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors"
                                placeholder="e.g. Notch">
                        </div>
                        <button type="submit" id="mc-modal-submit-btn"
                            class="w-full bg-secondary hover:bg-secondary/90 text-white font-bold py-3 rounded-lg transition-transform active:scale-95 flex items-center justify-center">
                            <span id="mc-modal-text">Complete Registration</span>
                            <i id="mc-modal-spinner" class="ri-loader-4-line animate-spin hidden ml-2"></i>
                        </button>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const formElement = document.getElementById('mc-username-form');
        const inputElement = document.getElementById('modal-mc-username');
        const errorBox = document.getElementById('mc-modal-error');
        const submitBtn = document.getElementById('mc-modal-submit-btn');
        const submitText = document.getElementById('mc-modal-text');
        const submitSpinner = document.getElementById('mc-modal-spinner');

        const showModalError = (message) => {
            errorBox.textContent = message;
            errorBox.classList.remove('hidden');
        };

        const hideModalError = () => {
            errorBox.classList.add('hidden');
        };

        const toggleModalLoading = (isLoading) => {
            if (isLoading) {
                submitText.classList.add('opacity-0');
                submitSpinner.classList.remove('hidden');
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-75');
            } else {
                submitText.classList.remove('opacity-0');
                submitSpinner.classList.add('hidden');
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-75');
            }
        };

        formElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideModalError();

            const username = inputElement.value.trim();
            if (!username) {
                showModalError("Minecraft Username is required.");
                return;
            }

            toggleModalLoading(true);
            try {
                await updateProfile(user, {
                    displayName: username
                });
                // Success! Redirect.
                window.location.href = 'index.html';
            } catch (error) {
                toggleModalLoading(false);
                console.error("Error setting username:", error);
                showModalError(error.message);
            }
        });
    };

    // --- Google Auth ---
    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            hideError();
            hideSuccess();
            const provider = new GoogleAuthProvider();
            try {
                const userCredential = await signInWithPopup(auth, provider);
                const additionalUserInfo = getAdditionalUserInfo(userCredential);

                if (additionalUserInfo && additionalUserInfo.isNewUser) {
                    showMinecraftUsernamePrompt(userCredential.user);
                } else {
                    window.location.href = 'index.html';
                }
            } catch (error) {
                console.error("Google Auth Error:", error);
                showError(error.message);
            }
        });
    }

    // --- Forgot Password Flow ---
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError();
            hideSuccess();

            const email = document.getElementById('reset-email').value;

            toggleLoading('reset-btn', true);
            try {
                await sendPasswordResetEmail(auth, email);
                toggleLoading('reset-btn', false);
                showSuccess();
                forgotPasswordForm.reset();
            } catch (error) {
                toggleLoading('reset-btn', false);
                console.error("Error sending reset email:", error);

                if (error.code === 'auth/user-not-found') {
                    showError("No account found with that email address.");
                } else if (error.code === 'auth/invalid-email') {
                    showError("Invalid email address format.");
                } else {
                    showError("Failed to send reset email. Please try again.");
                }
            }
        });
    }

    // --- Email & Password Sign Up ---
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError();
            hideSuccess();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const mcUsername = document.getElementById('mc-username').value;

            if (!mcUsername) {
                showError("Minecraft Username is required.");
                return;
            }

            toggleLoading('signup-btn', true);
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                // Update the user's profile to store their Minecraft Username as their display name
                await updateProfile(userCredential.user, {
                    displayName: mcUsername
                });

                // Success! Redirect.
                window.location.href = 'index.html';
            } catch (error) {
                toggleLoading('signup-btn', false);
                console.error("Error signing up:", error);

                // Friendly error messages
                if (error.code === 'auth/email-already-in-use') {
                    showError("This email is already registered. Try logging in.");
                } else if (error.code === 'auth/weak-password') {
                    showError("Password should be at least 6 characters.");
                } else {
                    showError(error.message);
                }
            }
        });
    }

    // --- Email & Password Login ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError();
            hideSuccess();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            toggleLoading('login-btn', true);
            try {
                await signInWithEmailAndPassword(auth, email, password);
                // Success! Redirect.
                window.location.href = 'index.html';
            } catch (error) {
                toggleLoading('login-btn', false);
                console.error("Error logging in:", error);

                if (error.code === 'auth/invalid-credential') {
                    showError("Invalid email or password.");
                } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                    showError("Invalid email or password.");
                } else {
                    showError(error.message);
                }
            }
        });
    }
});
