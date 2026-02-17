// ===== SAMPLE SNIPPETS (Pre-loaded) =====
const defaultSnippets = [
    {
        id: 1,
        title: "Responsive Navbar - HTML & CSS",
        language: "html",
        code: `<nav class="navbar">
  <div class="logo">MySite</div>
  <ul class="nav-links">
    <li><a href="#home">Home</a></li>
    <li><a href="#about">About</a></li>
    <li><a href="#contact">Contact</a></li>
  </ul>
  <div class="burger">
    <div class="line1"></div>
    <div class="line2"></div>
    <div class="line3"></div>
  </div>
</nav>`,
        date: "2025-01-15"
    },
    {
        id: 2,
        title: "Fetch API Example",
        language: "javascript",
        code: `async function fetchUsers() {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/users');
        
        if (!response.ok) {
            throw new Error(\`HTTP error! status: \${response.status}\`);
        }
        
        const users = await response.json();
        
        users.forEach(user => {
            console.log(\`Name: \${user.name}, Email: \${user.email}\`);
        });
        
        return users;
    } catch (error) {
        console.error('Failed to fetch users:', error);
    }
}

fetchUsers();`,
        date: "2025-01-16"
    },
    {
        id: 3,
        title: "Python Quick Sort",
        language: "python",
        code: `def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    return quick_sort(left) + middle + quick_sort(right)

# Example usage
numbers = [64, 34, 25, 12, 22, 11, 90]
sorted_numbers = quick_sort(numbers)
print(f"Sorted: {sorted_numbers}")`,
        date: "2025-01-17"
    }
];

// ===== AUTHORIZATION SETTINGS =====
const CORRECT_CODE = '12345678'; // Change this to your 8-digit code

// ===== FIREBASE INITIALIZATION =====
const firebaseConfig = {
  apiKey: "AIzaSyCtNJqxLQXatyQpO3D6wCTzvZjEZMVv5N4",
  authDomain: "code-share-4022e.firebaseapp.com",
  projectId: "code-share-4022e",
  storageBucket: "code-share-4022e.firebasestorage.app",
  messagingSenderId: "585527758604",
  appId: "1:585527758604:web:8ecfed69e3219d28f74329"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const snippetsCollection = db.collection('snippets');

// ===== INITIALIZE =====
let snippets = [];
let isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

// ===== DOM ELEMENTS =====
const snippetsContainer = document.getElementById('snippetsContainer');
const addBtn = document.getElementById('addBtn');
const snippetTitle = document.getElementById('snippetTitle');
const snippetLanguage = document.getElementById('snippetLanguage');
const snippetCode = document.getElementById('snippetCode');
const searchInput = document.getElementById('searchInput');
const filterLanguage = document.getElementById('filterLanguage');
const toast = document.getElementById('toast');
const authBtn = document.getElementById('authBtn');
const authModal = document.getElementById('authModal');
const authCode = document.getElementById('authCode');
const submitCode = document.getElementById('submitCode');
const cancelAuth = document.getElementById('cancelAuth');
const closeModal = document.getElementById('closeModal');
const errorMsg = document.getElementById('errorMsg');
const addSection = document.getElementById('addSection');

// ===== RENDER SNIPPETS =====
function renderSnippets(filter = 'all', search = '') {
    // Filter and search
    let filtered = snippets.filter(snippet => {
        const matchLang = filter === 'all' || snippet.language === filter;
        const matchSearch = snippet.title.toLowerCase().includes(search.toLowerCase()) ||
                            snippet.code.toLowerCase().includes(search.toLowerCase());
        return matchLang && matchSearch;
    });

    // If no snippets
    if (filtered.length === 0) {
        snippetsContainer.innerHTML = `
            <div class="empty-state">
                <div class="icon">📭</div>
                <h3>No snippets found</h3>
                <p>Try a different search or add a new snippet!</p>
            </div>
        `;
        return;
    }

    // Build HTML
    snippetsContainer.innerHTML = filtered.map(snippet => {
        // Map language to Prism class
        const prismLang = getPrismLanguage(snippet.language);
        // Escape HTML in code
        const escapedCode = escapeHtml(snippet.code);

        return `
        <div class="snippet-card" data-id="${snippet.id}">
            <div class="snippet-header">
                <span class="snippet-title">${escapeHtml(snippet.title)}</span>
                <div class="snippet-meta">
                    <span class="language-badge">${snippet.language}</span>
                    <button class="btn-copy" onclick="copyCode(${snippet.id}, this)">
                        📋 Copy
                    </button>
                    <button class="btn-delete" onclick="deleteSnippet(${snippet.id})">
                        🗑️
                    </button>
                </div>
            </div>
            <div class="snippet-code">
                <pre><code class="language-${prismLang}">${escapedCode}</code></pre>
            </div>
        </div>
        `;
    }).join('');

    // Re-highlight with Prism
    Prism.highlightAll();
    
    // Update delete buttons visibility
    updateDeleteButtons();
}

// ===== UPDATE DELETE BUTTONS =====
function updateDeleteButtons() {
    const deleteButtons = document.querySelectorAll('.btn-delete');
    deleteButtons.forEach(btn => {
        btn.style.display = isAuthenticated ? 'block' : 'none';
    });
}

// ===== HELPER: Escape HTML =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== HELPER: Map language to Prism class =====
function getPrismLanguage(lang) {
    const map = {
        'html': 'markup',
        'css': 'css',
        'javascript': 'javascript',
        'python': 'python',
        'java': 'java',
        'cpp': 'cpp',
        'csharp': 'csharp',
        'php': 'php',
        'sql': 'sql',
        'bash': 'bash',
        'json': 'json'
    };
    return map[lang] || 'markup';
}

// ===== COPY CODE =====
function copyCode(id, button) {
    const snippet = snippets.find(s => s.id === id);
    if (!snippet) return;

    navigator.clipboard.writeText(snippet.code).then(() => {
        // Button feedback
        button.innerHTML = '✅ Copied!';
        button.classList.add('copied');
        
        // Show toast
        showToast();

        // Reset button after 2s
        setTimeout(() => {
            button.innerHTML = '📋 Copy';
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        // Fallback for older browsers
        fallbackCopy(snippet.code);
        button.innerHTML = '✅ Copied!';
        button.classList.add('copied');
        showToast();
        setTimeout(() => {
            button.innerHTML = '📋 Copy';
            button.classList.remove('copied');
        }, 2000);
    });
}

// ===== FALLBACK COPY =====
function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

// ===== SHOW TOAST =====
function showToast() {
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// ===== ADD SNIPPET =====
addBtn.addEventListener('click', () => {
    if (!isAuthenticated) {
        showToastMessage('❌ You must unlock access first!');
        openAuthModal();
        return;
    }

    const title = snippetTitle.value.trim();
    const language = snippetLanguage.value;
    const code = snippetCode.value.trim();

    if (!title || !code) {
        alert('Please fill in both the title and code!');
        return;
    }

    const newSnippet = {
        title,
        language,
        code,
        date: new Date().toISOString().split('T')[0],
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    snippetsCollection.add(newSnippet)
        .then(() => {
            showToastMessage('✅ Code snippet added successfully!');
            snippetTitle.value = '';
            snippetCode.value = '';
        })
        .catch(error => {
            console.error('Error adding snippet:', error);
            showToastMessage('❌ Failed to add snippet!');
        });
});

// ===== DELETE SNIPPET =====
function deleteSnippet(id) {
    if (!isAuthenticated) {
        showToastMessage('❌ You must unlock access first!');
        openAuthModal();
        return;
    }
    if (!confirm('Are you sure you want to delete this snippet?')) return;
    
    snippetsCollection.doc(id).delete()
        .then(() => {
            showToastMessage('✅ Snippet deleted!');
        })
        .catch(error => {
            console.error('Error deleting snippet:', error);
            showToastMessage('❌ Failed to delete snippet!');
        });
}

// ===== SAVE TO FIREBASE =====
function saveSnippets() {
    // Firestore saves happen in add and delete functions
    // This is kept for compatibility
}

// ===== SEARCH & FILTER EVENTS =====
searchInput.addEventListener('input', () => {
    renderSnippets(filterLanguage.value, searchInput.value);
});

filterLanguage.addEventListener('change', () => {
    renderSnippets(filterLanguage.value, searchInput.value);
});

// ===== PREVENT EDITING CODE BLOCKS =====
document.addEventListener('keydown', function(e) {
    // If user is focused inside a code block, prevent typing
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'CODE' || activeEl.tagName === 'PRE')) {
        if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
        }
    }
});

// ===== DISABLE contenteditable on code elements =====
const observer = new MutationObserver(() => {
    document.querySelectorAll('pre, code').forEach(el => {
        el.setAttribute('contenteditable', 'false');
    });
});

observer.observe(document.body, { childList: true, subtree: true });

// ===== AUTHENTICATION FUNCTIONS =====
function updateAuthUI() {
    if (isAuthenticated) {
        authBtn.textContent = '🔓 Logout';
        authBtn.classList.add('logout');
        addSection.style.display = 'block';
        addBtn.disabled = false;
    } else {
        authBtn.textContent = '🔐 Access Code';
        authBtn.classList.remove('logout');
        addSection.style.display = 'none';
        addBtn.disabled = true;
    }
}

function openAuthModal() {
    if (isAuthenticated) {
        // Logout
        isAuthenticated = false;
        localStorage.setItem('isAuthenticated', 'false');
        updateAuthUI();
        showToastMessage('Logged out successfully!');
    } else {
        // Open login modal
        authModal.classList.add('show');
        authCode.value = '';
        errorMsg.textContent = '';
        authCode.focus();
    }
}

function closeAuthModal() {
    authModal.classList.remove('show');
    errorMsg.textContent = '';
    authCode.value = '';
}

function verifyCode() {
    const enteredCode = authCode.value.trim();
    
    if (enteredCode.length !== 8) {
        errorMsg.textContent = 'Code must be exactly 8 digits!';
        return;
    }
    
    if (enteredCode === CORRECT_CODE) {
        isAuthenticated = true;
        localStorage.setItem('isAuthenticated', 'true');
        updateAuthUI();
        closeAuthModal();
        showToastMessage('✅ Access granted! You can now add code snippets.');
    } else {
        errorMsg.textContent = '❌ Incorrect code. Try again!';
        authCode.value = '';
        authCode.focus();
    }
}

function showToastMessage(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// ===== AUTHENTICATION EVENT LISTENERS =====
authBtn.addEventListener('click', openAuthModal);
submitCode.addEventListener('click', verifyCode);
cancelAuth.addEventListener('click', closeAuthModal);
closeModal.addEventListener('click', closeAuthModal);

authCode.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        verifyCode();
    }
});

// ===== CLOSE MODAL ON BACKGROUND CLICK =====
authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
        closeAuthModal();
    }
});

// ===== FIRESTORE REAL-TIME LISTENING =====
snippetsCollection.orderBy('timestamp', 'desc').onSnapshot(
    (snapshot) => {
        snippets = [];
        snapshot.forEach((doc) => {
            snippets.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        if (snippets.length === 0) {
            // Add default snippets if database is empty
            defaultSnippets.forEach(snippet => {
                snippetsCollection.add({
                    title: snippet.title,
                    language: snippet.language,
                    code: snippet.code,
                    date: snippet.date,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
        }
        
        renderSnippets(filterLanguage.value, searchInput.value);
    },
    (error) => {
        console.error('Firebase error:', error);
        showToastMessage('⚠️ Could not connect to database!');
    }
);

// ===== INITIAL RENDER =====
updateAuthUI();