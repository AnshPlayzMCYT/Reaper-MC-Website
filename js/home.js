import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const loginDisplayArea = document.getElementById('login-display-area');
const defaultSkinUrl = 'https://mc-heads.net/avatar/MHF_Steve/40';

const renderLoginUI = async (user) => {
    if (user) {
        // User is signed in.
        // Fetch custom claims to get rank
        const idTokenResult = await user.getIdTokenResult(true);
        const rank = idTokenResult.claims.rank || 'Member';

        // Styling for rank badge
        let rankBadgeHtml = '';
        if (rank !== 'Member') {
            let rankClass = 'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ml-2 ';
            if (rank === 'VIP') rankClass += 'bg-primary/20 text-primary border border-primary/30';
            else if (rank === 'VIP+') rankClass += 'bg-secondary/20 text-secondary border border-secondary/30';
            else if (rank === 'MVP') rankClass += 'bg-pink-500/20 text-pink-500 border border-pink-500/30';
            else if (rank === 'MVP+') rankClass += 'bg-blue-500/20 text-blue-500 border border-blue-500/30';
            else if (rank === 'Legend') rankClass += 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
            else if (rank === 'Immortal') rankClass += 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/30';
            
            rankBadgeHtml = `<span class="${rankClass}">${rank}</span>`;
        }

        // We set the displayName to the Minecraft username at signup.
        const displayName = user.displayName || user.email.split('@')[0];

        loginDisplayArea.innerHTML = `
            <div class="flex items-center space-x-3">
                <img src="https://mc-heads.net/avatar/${displayName}/40" class="h-10 w-10 rounded-md" style="image-rendering: pixelated;" onerror="this.src='${defaultSkinUrl}'">
                <div class="flex flex-col">
                    <span class="font-semibold text-white flex items-center">${displayName} ${rankBadgeHtml}</span>
                </div>
            </div>
            <button id="logout-btn" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors">Logout</button>
        `;

        document.getElementById('logout-btn').addEventListener('click', () => {
            // Create a custom modal
            const modalHtml = `
                <div id="custom-logout-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div class="bg-brand-light border border-brand-border rounded-xl shadow-2xl p-6 max-w-sm w-full animate-fade-in-up">
                        <div class="text-center">
                            <i class="ri-logout-circle-r-line text-4xl text-red-500 mb-2"></i>
                            <h3 class="text-xl font-bold text-white mb-2">Confirm Logout</h3>
                            <p class="text-sm text-brand-text mb-6">Are you sure you want to log out of your account?</p>
                        </div>
                        <div class="flex gap-3">
                            <button id="cancel-logout" class="flex-1 bg-brand-darkest hover:bg-brand-dark border border-brand-border text-white py-2 rounded-lg font-semibold transition-colors">Cancel</button>
                            <button id="confirm-logout" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold transition-colors">Logout</button>
                        </div>
                    </div>
                </div>
            `;

            // Insert modal into body
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            const modalElement = document.getElementById('custom-logout-modal');
            const cancelBtn = document.getElementById('cancel-logout');
            const confirmBtn = document.getElementById('confirm-logout');

            // Handle Cancel
            cancelBtn.addEventListener('click', () => {
                modalElement.remove();
            });

            // Handle Confirm
            confirmBtn.addEventListener('click', async () => {
                modalElement.remove();
                try {
                    await signOut(auth);
                } catch (error) {
                    console.error("Error signing out:", error);
                }
            });
        });
    } else {
        // User is signed out.
        loginDisplayArea.innerHTML = `
            <a href="/login" class="bg-secondary hover:bg-secondary/80 text-white px-5 py-2 rounded-md font-bold transition-colors w-full sm:w-auto inline-block text-center">Please Login</a>
        `;
    }
};

// Start listening for auth state changes
onAuthStateChanged(auth, (user) => {
    renderLoginUI(user);
});
