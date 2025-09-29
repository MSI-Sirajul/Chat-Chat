// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB6HLqY8VgJDXGPJY7CYrawLTYHmHVgnpE",
  authDomain: "chit-chat-cbc58.firebaseapp.com",
  databaseURL: "https://chit-chat-cbc58-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chit-chat-cbc58",
  storageBucket: "chit-chat-cbc58.firebasestorage.app",
  messagingSenderId: "969756307967",
  appId: "1:969756307967:web:12a46ff754f895061c37ca",
  measurementId: "G-V9HNRLJS6K"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 2. DOM Elements
const app = document.getElementById('app');
const authPage = document.getElementById('auth-page');
const mainAppContent = document.getElementById('main-app-content');

// Auth elements
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const registerEmail = document.getElementById('register-email');
const registerName = document.getElementById('register-name');
const registerPassword = document.getElementById('register-password');
const registerBtn = document.getElementById('register-btn');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');

// Main app elements
const messagesTab = document.getElementById('messages-tab');
const callsTab = document.getElementById('calls-tab');
const messagesList = document.getElementById('messages-list');
const callsList = document.getElementById('calls-list');
const contactsPage = document.getElementById('contacts-page');
const profilePage = document.getElementById('profile-page');
const navHome = document.getElementById('nav-home');
const navContacts = document.getElementById('nav-contacts');
const navProfile = document.getElementById('nav-profile');
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const logoutBtn = document.getElementById('logout-btn');


let currentActiveTab = 'messages'; // For messages/calls
let currentActiveNav = 'home'; // For bottom nav

// 3. Helper Functions for UI Management
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function showContentTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
}

function updateToggleNavButtons(activeButtonId) {
    document.querySelectorAll('.toggle-nav button').forEach(button => {
        button.classList.remove('active');
    });
    document.getElementById(activeButtonId).classList.add('active');
}

function updateBottomNavButtons(activeButtonId) {
    document.querySelectorAll('.bottom-nav button').forEach(button => {
        button.classList.remove('active');
    });
    document.getElementById(activeButtonId).classList.add('active');
}

// 4. Firebase Authentication Logic
// Handle user state changes
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in.
        console.log("User logged in:", user.email);
        showPage('main-app-content');
        loadUserProfile(user.uid);
        renderMessages(); // Initial data load
        renderCalls();
        updateBottomNavButtons('nav-home'); // Ensure home is active
        showContentTab(currentActiveTab === 'messages' ? 'messages-list' : 'calls-list');
        updateToggleNavButtons(currentActiveTab === 'messages' ? 'messages-tab' : 'calls-tab');

    } else {
        // User is signed out.
        console.log("User logged out.");
        showPage('auth-page');
    }
});

loginBtn.addEventListener('click', async () => {
    try {
        await auth.signInWithEmailAndPassword(loginEmail.value, loginPassword.value);
    } catch (error) {
        alert(error.message);
    }
});

registerBtn.addEventListener('click', async () => {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(registerEmail.value, registerPassword.value);
        // Add user data to Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            name: registerName.value,
            email: registerEmail.value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        alert(error.message);
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
    } catch (error) {
        alert(error.message);
    }
});

showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginSection.style.display = 'none';
    registerSection.style.display = 'block';
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginSection.style.display = 'block';
    registerSection.style.display = 'none';
});

// 5. Navigation and Tab Switching
messagesTab.addEventListener('click', () => {
    currentActiveTab = 'messages';
    showContentTab('messages-list');
    updateToggleNavButtons('messages-tab');
});

callsTab.addEventListener('click', () => {
    currentActiveTab = 'calls';
    showContentTab('calls-list');
    updateToggleNavButtons('calls-tab');
});

navHome.addEventListener('click', () => {
    currentActiveNav = 'home';
    // When on home, show either messages or calls based on last active toggle
    showContentTab(currentActiveTab === 'messages' ? 'messages-list' : 'calls-list');
    updateToggleNavButtons(currentActiveTab === 'messages' ? 'messages-tab' : 'calls-tab'); // Re-activate correct toggle button
    updateBottomNavButtons('nav-home');
    document.querySelector('.toggle-nav').style.display = 'flex'; // Show toggle nav
});

navContacts.addEventListener('click', () => {
    currentActiveNav = 'contacts';
    showContentTab('contacts-page');
    updateBottomNavButtons('nav-contacts');
    document.querySelector('.toggle-nav').style.display = 'none'; // Hide toggle nav
    renderContacts();
});

navProfile.addEventListener('click', () => {
    currentActiveNav = 'profile';
    showContentTab('profile-page');
    updateBottomNavButtons('nav-profile');
    document.querySelector('.toggle-nav').style.display = 'none'; // Hide toggle nav
    // Profile details are loaded on auth state change, but ensure it's up-to-date
    if (auth.currentUser) {
        loadUserProfile(auth.currentUser.uid);
    }
});


// 6. Data Rendering Functions (Firestore Interactions)

async function loadUserProfile(uid) {
    try {
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists) {
            const userData = doc.data();
            profileName.textContent = userData.name || 'N/A';
            profileEmail.textContent = userData.email || 'N/A';
        } else {
            console.log("No such user document!");
        }
    } catch (error) {
        console.error("Error loading profile:", error);
    }
}

// Example: Render messages
async function renderMessages() {
    // Clear existing messages
    messagesList.innerHTML = '<p class="empty-state">No recent messages.</p>'; // Default empty state

    const currentUserId = auth.currentUser ? auth.currentUser.uid : null;
    if (!currentUserId) return;

    try {
        // Fetch messages relevant to the current user
        // This is a simplified example. In a real app, you'd have chat rooms, direct messages etc.
        // For 'recent messages', you might query messages where current user is sender OR receiver
        const querySnapshot = await db.collection('messages')
                                     .where('participants', 'array-contains', currentUserId)
                                     .orderBy('timestamp', 'desc')
                                     .limit(10) // Get N recent messages
                                     .get();

        if (querySnapshot.empty) {
            messagesList.innerHTML = '<p class="empty-state">No recent messages.</p>';
            return;
        }

        messagesList.innerHTML = ''; // Clear empty state if messages exist

        const messageDocs = querySnapshot.docs;
        for (const doc of messageDocs) {
            const msg = doc.data();
            let otherUserId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;

            // Fetch other user's data for display
            const otherUserDoc = await db.collection('users').doc(otherUserId).get();
            const otherUserData = otherUserDoc.exists ? otherUserDoc.data() : { name: 'Unknown', avatar: 'https://via.placeholder.com/50/FF0000/FFFFFF?text=?' }; // Placeholder for missing user

            const listItem = document.createElement('div');
            listItem.className = 'list-item';
            listItem.innerHTML = `
                <img src="${otherUserData.avatar || 'https://via.placeholder.com/50/4CAF50/FFFFFF?text=' + (otherUserData.name ? otherUserData.name[0] : '?')}" alt="${otherUserData.name}">
                <div class="details">
                    <h4>${otherUserData.name}</h4>
                    <p>${msg.content.substring(0, 30)}${msg.content.length > 30 ? '...' : ''}</p>
                </div>
                <div class="time">${msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
            `;
            messagesList.appendChild(listItem);
        }

    } catch (error) {
        console.error("Error rendering messages:", error);
        messagesList.innerHTML = '<p class="empty-state">Error loading messages.</p>';
    }
}

// Example: Render calls (similar structure to messages)
async function renderCalls() {
    callsList.innerHTML = '<p class="empty-state">No recent calls.</p>'; // Default empty state

    const currentUserId = auth.currentUser ? auth.currentUser.uid : null;
    if (!currentUserId) return;

    try {
        const querySnapshot = await db.collection('calls')
                                     .where('participants', 'array-contains', currentUserId)
                                     .orderBy('timestamp', 'desc')
                                     .limit(10)
                                     .get();

        if (querySnapshot.empty) {
            callsList.innerHTML = '<p class="empty-state">No recent calls.</p>';
            return;
        }

        callsList.innerHTML = '';

        for (const doc of querySnapshot.docs) {
            const call = doc.data();
            let otherUserId = call.callerId === currentUserId ? call.receiverId : call.callerId;

            const otherUserDoc = await db.collection('users').doc(otherUserId).get();
            const otherUserData = otherUserDoc.exists ? otherUserDoc.data() : { name: 'Unknown', avatar: 'https://via.placeholder.com/50/FF0000/FFFFFF?text=?' };

            const listItem = document.createElement('div');
            listItem.className = 'list-item';
            listItem.innerHTML = `
                <img src="${otherUserData.avatar || 'https://via.placeholder.com/50/2196F3/FFFFFF?text=' + (otherUserData.name ? otherUserData.name[0] : '?')}" alt="${otherUserData.name}">
                <div class="details">
                    <h4>${otherUserData.name}</h4>
                    <p>${call.type} call (${call.duration || 'N/A'})</p>
                </div>
                <div class="time">${call.timestamp ? new Date(call.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
            `;
            callsList.appendChild(listItem);
        }

    } catch (error) {
        console.error("Error rendering calls:", error);
        callsList.innerHTML = '<p class="empty-state">Error loading calls.</p>';
    }
}

async function renderContacts() {
    const contactsListElement = document.getElementById('contacts-list');
    contactsListElement.innerHTML = '<p class="empty-state">No contacts found.</p>';

    const currentUserId = auth.currentUser ? auth.currentUser.uid : null;
    if (!currentUserId) return;

    try {
        // In a real app, users would have a 'contacts' subcollection or array.
        // For this example, let's just fetch all users for simplicity.
        const usersSnapshot = await db.collection('users').get();

        if (usersSnapshot.empty) {
            return;
        }

        contactsListElement.innerHTML = '';
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            if (doc.id !== currentUserId) { // Don't list self as a contact
                const listItem = document.createElement('div');
                listItem.className = 'list-item';
                listItem.innerHTML = `
                    <img src="${userData.avatar || 'https://via.placeholder.com/50/FFC107/FFFFFF?text=' + (userData.name ? userData.name[0] : '?')}" alt="${userData.name}">
                    <div class="details">
                        <h4>${userData.name}</h4>
                        <p>${userData.email}</p>
                    </div>
                `;
                contactsListElement.appendChild(listItem);
            }
        });

    } catch (error) {
        console.error("Error rendering contacts:", error);
        contactsListElement.innerHTML = '<p class="empty-state">Error loading contacts.</p>';
    }
}

// Initial setup when script loads
if (!auth.currentUser) {
    showPage('auth-page');
}
