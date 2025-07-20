// Bundled auth and navigation helpers

// ==== auth.js content ====
const GOOGLE_CLIENT_ID = '943692746860-dhc6ofk0rkl93s6ablfarv10fk1ghtnd.apps.googleusercontent.com';
const GOOGLE_REDIRECT_URI = `${window.location.origin}/auth.html`;

let currentUser = JSON.parse(localStorage.getItem('user')) || null;

// Procesa el fragmento OAuth (`#access_token=...`) que Discord devuelve cuando se usa response_type=token
async function processOAuthFragment() {
    const hash = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : '';
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    if (!accessToken) return;
    const state = params.get('state') || 'discord';
    try {
        let user = null;
        if (state === 'discord') {
            const resp = await fetch('https://discord.com/api/users/@me', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!resp.ok) throw new Error('Error al obtener perfil de Discord');
            const profile = await resp.json();
            let avatarUrl;
            if (profile.avatar) {
                avatarUrl = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`;
            } else {
                const index = profile.discriminator ? parseInt(profile.discriminator) % 5 : (parseInt(profile.id) >> 22) % 6;
                avatarUrl = `https://cdn.discordapp.com/embed/avatars/${index}.png`;
            }
            user = {
                id: profile.id,
                name: profile.global_name || profile.username,
                email: profile.email || '',
                picture: avatarUrl
            };
        } else {
            return;
        }
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('auth_token', accessToken);
        currentUser = user;
        history.replaceState(null, null, window.location.pathname + window.location.search);
    } catch (err) {
        console.error('Error procesando OAuth fragment:', err);
    }
}

async function initAuth() {
    await processOAuthFragment();
    currentUser = JSON.parse(localStorage.getItem('user')) || null;
    updateAuthUI();

    if (localStorage.getItem('auth_token') && !currentUser) {
        const userFromStorage = localStorage.getItem('user');
        if (userFromStorage) {
            currentUser = JSON.parse(userFromStorage);
            updateAuthUI();
        } else {
            localStorage.removeItem('auth_token');
            updateAuthUI();
        }
    }
}

function updateAuthUI() {
    if (window.updateAuthMenu) window.updateAuthMenu();
}

function loginWithGoogle() {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&response_type=token&scope=email%20profile&access_type=online`;
    window.location.href = authUrl;
}

function loginWithFacebook() {
    alert('Próximamente: Inicio de sesión con Facebook');
}

function logout() {
    currentUser = null;
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    updateAuthUI();
    window.location.href = 'index.html';
}

function requireAuth() {
    if (!currentUser) {
        window.location.href = 'auth.html?redirect=' + encodeURIComponent(window.location.pathname);
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', initAuth);

const DISCORD_CLIENT_ID = '1391252012561207386';
const DISCORD_REDIRECT_URI = "https://ruanerz.github.io/prob-gw/index.html";

function loginWithDiscord() {
    const authUrl = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=token&scope=identify&state=discord`;
    window.location.href = authUrl;
}

window.Auth = {
    get currentUser() { return currentUser; },
    initAuth,
    loginWithGoogle,
    loginWithFacebook,
    loginWithDiscord,
    logout,
    requireAuth
};

// ==== navigation.js partial content ====
function updateAuthMenu() {
    const loginBtn = document.getElementById('loginBtn');
    const userInfo = document.getElementById('userInfo');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isLoggedIn = !!localStorage.getItem('auth_token');

    document.querySelectorAll('[data-requires-login]')
        .forEach(link => {
            link.style.display = isLoggedIn ? '' : 'none';
        });

    if (isLoggedIn && user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (userInfo) {
            userInfo.style.display = 'block';
            userInfo.innerHTML = `
                <img src="${user.picture || 'https://via.placeholder.com/24'}" alt="avatar" style="width:24px;height:24px;border-radius:50%;vertical-align:middle;margin-right:5px;">
                ${user.name || 'Usuario'}
            `;
            userInfo.onclick = (e) => {
                e.preventDefault();
                showAccountModal();
            };
        }
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
    }
}

window.addEventListener('storage', updateAuthMenu);

function showAuthOptions() {
    let modal = document.getElementById('auth-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'auth-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <h3 style='margin-bottom:18px;color:#fff;'>Iniciar sesión</h3>
                <button id="google-login-btn" class="auth-btn google-btn">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" alt="google"> Google
                </button>
                <button id="facebook-login-btn" class="auth-btn facebook-btn">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/facebook/facebook-original.svg" alt="facebook"> Facebook
                </button>
                <button id="discord-login-btn" class="auth-btn discord-btn">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/discord/discord-original.svg" alt="discord"> Discord
                </button>
                <a href="login.html" class="auth-classic-link">¿Prefieres iniciar sesión clásico?</a>
                <button onclick="document.getElementById('auth-modal').remove()" class="auth-cancel-btn">Cancelar</button>
            </div>`;
        document.body.appendChild(modal);
        document.getElementById('google-login-btn').onclick = () => {
            if (window.Auth && window.Auth.loginWithGoogle) window.Auth.loginWithGoogle();
        };
        document.getElementById('facebook-login-btn').onclick = () => {
            if (window.Auth && window.Auth.loginWithFacebook) window.Auth.loginWithFacebook();
        };
        document.getElementById('discord-login-btn').onclick = () => {
            if (window.Auth && window.Auth.loginWithDiscord) window.Auth.loginWithDiscord();
        };
    }
}

function showAccountModal() {
    const existing = document.getElementById('account-modal');
    if (existing) return;

    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) return;

    const modal = document.createElement('div');
    modal.id = 'account-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="account-modal-content">
            <img src="${user.picture || 'https://via.placeholder.com/64'}" class="account-avatar" alt="avatar">
            <div class="account-name">${user.name || 'Usuario'}</div>
            <div class="account-email">${user.email || ''}</div>
            <a href="cuenta.html" class="account-link">Mi Cuenta</a>
            <button onclick="window.Auth && window.Auth.logout && window.Auth.logout()" class="logout-btn">Cerrar sesión</button>
            <button class="close-account-btn">Cerrar</button>
        </div>`;
    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });
    modal.querySelector('.close-account-btn').addEventListener('click', close);
}

window.updateAuthMenu = updateAuthMenu;
window.showAuthOptions = showAuthOptions;
window.showAccountModal = showAccountModal;
