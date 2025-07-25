// Bundled auth and navigation helpers

// ==== auth.js content ====
let currentUser = null;

async function fetchCurrentUser() {
    try {
        const r = await fetch('backend/api/user.php');
        if (!r.ok) return null;
        return r.json();
    } catch (e) {
        return null;
    }
}

async function initAuth() {
    currentUser = await fetchCurrentUser();
    updateAuthUI();
}

function updateAuthUI() {
    if (window.updateAuthMenu) window.updateAuthMenu();
}

function loginWithGoogle() {
    window.location.href = 'backend/auth.php?provider=google';
}


function logout() {
    currentUser = null;
    document.cookie = 'session_id=; path=/; max-age=0';
    updateAuthUI();
    window.location.href = '/';
}

function requireAuth() {
    if (!currentUser) {
        window.location.href = '/login';
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', initAuth);

const DISCORD_CLIENT_ID = '1391252012561207386';

function loginWithDiscord() {
    window.location.href = 'backend/auth.php?provider=discord';
}

window.Auth = {
    get currentUser() { return currentUser; },
    initAuth,
    loginWithGoogle,
    loginWithDiscord,
    logout,
    requireAuth
};

// ==== navigation.js partial content ====
// Theme manager and navigation creation
const ThemeManager = {
    init() {
        this.theme = localStorage.getItem('theme') || 'dark';
        this.applyTheme();
    },

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
    },

    applyTheme() {
        document.body.classList.toggle('light-theme', this.theme === 'light');
        document.body.classList.toggle('dark-theme', this.theme === 'dark');

        const bg = document.getElementById('bg-video');
        const overlay = document.getElementById('bg-overlay');
        if (bg) {
            bg.classList.toggle('dark', this.theme === 'dark');
        }
        if (overlay) {
            overlay.style.background = this.theme === 'dark'
                ? 'rgba(0,0,0,0.1)'
                : 'rgba(255,255,255,0.6)';
        }

        const themeButtons = document.querySelectorAll('.theme-toggle');
        themeButtons.forEach(btn => {
            btn.textContent = this.theme === 'dark' ? '🌙' : '☀️';
        });
    }
};

const navigationData = {
    menuItems: [
        { text: 'Inicio', href: '/', target: 'tab-detalles', class: '' },
        { text: 'Dones', href: '/dones', target: 'tab-crafteo', class: '' },
        { text: 'Comparativa', href: '/compare-craft', target: 'tab-comparativa', class: '', requiresLogin: true },
        { text: 'Fractales', href: '/fractales-gold', target: 'tab-fractales', class: '', requiresLogin: true },
        { text: 'Legendarias', href: '/leg-craft', target: 'tab-leg-craft', class: '' },
        { text: 'Forja Mística', href: '/forja-mistica', target: 'tab-forja-mistica', class: '' }
    ],
    rightMenuItems: [
        {
            text: '🌙',
            href: '#',
            target: '',
            class: 'right-btn theme-toggle',
            id: 'theme-toggle',
            onClick: (e) => {
                e.preventDefault();
                ThemeManager.toggleTheme();
            }
        },
        {
            text: 'Iniciar sesión',
            href: '#',
            target: '',
            class: 'right-btn',
            id: 'loginBtn',
            onClick: (e) => {
                e.preventDefault();
                window.location.href = '/login';
            }
        },
        {
            text: '',
            href: '#',
            target: '',
            class: 'right-btn',
            id: 'userInfo',
            style: 'display: none; padding: 0 10px;',
            onClick: (e) => {
                e.preventDefault();
                showAccountModal();
            }
        }
    ]
};
function updateAuthMenu() {
    const loginBtn = document.getElementById('loginBtn');
    const userInfo = document.getElementById('userInfo');
    const user = currentUser;
    const isLoggedIn = !!user;

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
                <button id="discord-login-btn" class="auth-btn discord-btn">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/discordjs/discordjs-original.svg" alt="discord"> Discord
                </button>
                <a href="/login" class="auth-classic-link">¿Prefieres iniciar sesión clásico?</a>
                <button onclick="document.getElementById('auth-modal').remove()" class="auth-cancel-btn">Cancelar</button>
            </div>`;
        document.body.appendChild(modal);
        document.getElementById('google-login-btn').onclick = () => {
            if (window.Auth && window.Auth.loginWithGoogle) window.Auth.loginWithGoogle();
        };
        document.getElementById('discord-login-btn').onclick = () => {
            if (window.Auth && window.Auth.loginWithDiscord) window.Auth.loginWithDiscord();
        };
    }
}

function showAccountModal() {
    const existing = document.getElementById('account-modal');
    if (existing) return;

    const user = currentUser;
    if (!user) return;

    const modal = document.createElement('div');
    modal.id = 'account-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="account-modal-content">
            <img src="${user.picture || 'https://via.placeholder.com/64'}" class="account-avatar" alt="avatar">
            <div class="account-name">${user.name || 'Usuario'}</div>
            <div class="account-email">${user.email || ''}</div>
            <a href="/cuenta" class="account-link">Mi Cuenta</a>
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

function createNavigation() {
    const nav = document.createElement('nav');
    nav.className = 'topbar item-tabs-bar';

    const menuCenter = document.createElement('div');
    menuCenter.className = 'menu-center';

    navigationData.menuItems.forEach(item => {
        const link = document.createElement('a');
        link.href = item.href;
        link.className = `item-tab ${item.class}`.trim();
        if (item.target) link.setAttribute('data-target', item.target);
        if (item.requiresLogin) link.setAttribute('data-requires-login', 'true');
        link.textContent = item.text;
        menuCenter.appendChild(link);
    });

    const menuRight = document.createElement('div');
    menuRight.className = 'menu-right';

    navigationData.rightMenuItems.forEach(item => {
        const link = document.createElement('a');
        link.href = item.href;
        link.className = `item-tab ${item.class}`.trim();
        if (item.target) link.setAttribute('data-target', item.target);
        if (item.id) link.id = item.id;
        link.textContent = item.text;
        if (item.onClick) link.addEventListener('click', item.onClick);
        menuRight.appendChild(link);
    });

    nav.appendChild(menuCenter);
    nav.appendChild(menuRight);

    return nav;
}

function initNavigation() {
    const header = document.querySelector('header');
    if (header) {
        const nav = createNavigation();
        header.insertBefore(nav, header.firstChild);
        ThemeManager.init();
        updateAuthMenu();
        nav.querySelectorAll('a.item-tab').forEach(link => {
            if (link.id !== 'userInfo') {
                link.addEventListener('click', () => {
                    const modal = document.getElementById('account-modal');
                    if (modal) modal.remove();
                });
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
} else {
    initNavigation();
}

window.updateAuthMenu = updateAuthMenu;
window.showAuthOptions = showAuthOptions;
window.showAccountModal = showAccountModal;
