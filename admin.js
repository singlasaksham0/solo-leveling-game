// ===================================
// ADMIN PANEL - SOLO LEVELING GAME
// ===================================

// Admin State
const adminState = {
    isLoggedIn: false,
    currentPage: 1,
    itemsPerPage: 20,
    currentFilter: '',
    currentSearch: '',
    allQuestions: []
};

// IndexedDB
let db;
const DB_NAME = 'SoloLevelingGame';
const DB_VERSION = 1;

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    await initDB();
    setupEventListeners();
    checkLoginStatus();
});

// Initialize IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains('questions')) {
                const objectStore = db.createObjectStore('questions', { keyPath: 'id', autoIncrement: true });
                objectStore.createIndex('class', 'class', { unique: false });
            }
        };
    });
}

// ===================================
// EVENT LISTENERS
// ===================================

function setupEventListeners() {
    // Login
    document.getElementById('login-btn')?.addEventListener('click', handleLogin);
    document.getElementById('admin-password')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    
    // Navigation
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            switchTab(tab);
        });
    });
    
    // File upload
    document.getElementById('file-input')?.addEventListener('change', handleFileSelect);
    document.getElementById('import-btn')?.addEventListener('click', handleFileImport);
    
    // JSON import
    document.getElementById('import-json-btn')?.addEventListener('click', handleJSONImport);
    
    // Add question
    document.getElementById('add-question-btn')?.addEventListener('click', handleAddQuestion);
    
    // Search and filter
    document.getElementById('search-btn')?.addEventListener('click', handleSearch);
    document.getElementById('filter-class')?.addEventListener('change', handleFilter);
    document.getElementById('clear-all-btn')?.addEventListener('click', handleClearAll);
    
    // Pagination
    document.getElementById('prev-page')?.addEventListener('click', () => changePage(-1));
    document.getElementById('next-page')?.addEventListener('click', () => changePage(1));
    
    // Export
    document.getElementById('export-json-btn')?.addEventListener('click', () => exportData('json'));
    document.getElementById('export-csv-btn')?.addEventListener('click', () => exportData('csv'));
    document.getElementById('export-txt-btn')?.addEventListener('click', () => exportData('txt'));
    document.getElementById('export-class-btn')?.addEventListener('click', exportByClass);
    
    // Edit modal
    document.getElementById('save-edit-btn')?.addEventListener('click', saveEdit);
    document.getElementById('cancel-edit-btn')?.addEventListener('click', closeEditModal);
}

// ===================================
// LOGIN/LOGOUT
// ===================================

function checkLoginStatus() {
    const loggedIn = localStorage.getItem('adminLoggedIn');
    if (loggedIn === 'true') {
        adminState.isLoggedIn = true;
        showDashboard();
    }
}

function handleLogin() {
    const password = document.getElementById('admin-password').value;
    const correctPassword = 'admin123'; // In production, use proper authentication
    
    if (password === correctPassword) {
        adminState.isLoggedIn = true;
        localStorage.setItem('adminLoggedIn', 'true');
        showDashboard();
    } else {
        alert('Incorrect password!');
    }
}

function handleLogout() {
    adminState.isLoggedIn = false;
    localStorage.removeItem('adminLoggedIn');
    location.reload();
}

function showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    loadAllQuestions();
}

// ===================================
// TAB NAVIGATION
// ===================================

function switchTab(tabName) {
    // Update nav buttons
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    // Load data if needed
    if (tabName === 'manage') {
        loadAllQuestions();
    }
}

// ===================================
// FILE HANDLING
// ===================================

let selectedFile = null;

function handleFileSelect(event) {
    selectedFile = event.target.files[0];
    if (selectedFile) {
        document.getElementById('file-name').textContent = `Selected: ${selectedFile.name}`;
        document.getElementById('import-btn').disabled = false;
    }
}

async function handleFileImport() {
    if (!selectedFile) return;
    
    const fileType = selectedFile.name.split('.').pop().toLowerCase();
    const statusDiv = document.getElementById('import-status');
    
    try {
        let questions = [];
        
        if (fileType === 'json') {
            questions = await parseJSON(selectedFile);
        } else if (fileType === 'csv') {
            questions = await parseCSV(selectedFile);
        } else if (fileType === 'txt') {
            questions = await parseTXT(selectedFile);
        } else if (fileType === 'pdf') {
            questions = await parsePDF(selectedFile);
        } else {
            throw new Error('Unsupported file type');
        }
        
        await importQuestions(questions);
        
        statusDiv.className = 'import-status success';
        statusDiv.textContent = `✓ Successfully imported ${questions.length} questions!`;
        
        selectedFile = null;
        document.getElementById('file-name').textContent = '';
        document.getElementById('file-input').value = '';
        document.getElementById('import-btn').disabled = true;
        
        loadAllQuestions();
    } catch (error) {
        statusDiv.className = 'import-status error';
        statusDiv.textContent = `✗ Error: ${error.message}`;
    }
}

// Parse JSON file
function parseJSON(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                resolve(Array.isArray(data) ? data : [data]);
            } catch (error) {
                reject(new Error('Invalid JSON format'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// Parse CSV file
function parseCSV(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const lines = e.target.result.split('\n');
                const questions = [];
                
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    
                    const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
                    if (parts.length >= 6) {
                        questions.push({
                            class: parts[0],
                            question: parts[1],
                            options: [parts[2], parts[3], parts[4], parts[5]],
                            answer: parts[6] || parts[2]
                        });
                    }
                }
                
                resolve(questions);
            } catch (error) {
                reject(new Error('Invalid CSV format'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// Parse TXT file
function parseTXT(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const questions = [];
                const blocks = text.split('\n\n');
                
                for (const block of blocks) {
                    const lines = block.trim().split('\n');
                    if (lines.length >= 6) {
                        const classMatch = lines[0].match(/Class:?\s*(\d+)/i);
                        const questionMatch = lines[1].match(/Question:?\s*(.+)/i);
                        
                        if (classMatch && questionMatch) {
                            const options = [];
                            for (let i = 2; i < 6; i++) {
                                const optMatch = lines[i].match(/[A-D][\)\.]\s*(.+)/i);
                                if (optMatch) options.push(optMatch[1].trim());
                            }
                            
                            const answerMatch = lines[6]?.match(/Answer:?\s*(.+)/i);
                            
                            if (options.length === 4) {
                                questions.push({
                                    class: classMatch[1],
                                    question: questionMatch[1].trim(),
                                    options: options,
                                    answer: answerMatch ? answerMatch[1].trim() : options[0]
                                });
                            }
                        }
                    }
                }
                
                resolve(questions);
            } catch (error) {
                reject(new Error('Invalid TXT format'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// Parse PDF file
async function parsePDF(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const typedArray = new Uint8Array(e.target.result);
                const pdf = await pdfjsLib.getDocument(typedArray).promise;
                let fullText = '';
                
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n';
                }
                
                // Use TXT parser on extracted text
                const blob = new Blob([fullText], { type: 'text/plain' });
                const questions = await parseTXT(blob);
                resolve(questions);
            } catch (error) {
                reject(new Error('Failed to parse PDF: ' + error.message));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read PDF file'));
        reader.readAsArrayBuffer(file);
    });
}

// ===================================
// JSON IMPORT
// ===================================

async function handleJSONImport() {
    const jsonInput = document.getElementById('json-input').value.trim();
    const statusDiv = document.getElementById('import-status');
    
    if (!jsonInput) {
        statusDiv.className = 'import-status error';
        statusDiv.textContent = '✗ Please enter JSON data';
        return;
    }
    
    try {
        const data = JSON.parse(jsonInput);
        const questions = Array.isArray(data) ? data : [data];
        
        await importQuestions(questions);
        
        statusDiv.className = 'import-status success';
        statusDiv.textContent = `✓ Successfully imported ${questions.length} questions!`;
        
        document.getElementById('json-input').value = '';
        loadAllQuestions();
    } catch (error) {
        statusDiv.className = 'import-status error';
        statusDiv.textContent = `✗ Error: ${error.message}`;
    }
}

// Import questions to IndexedDB
function importQuestions(questions) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['questions'], 'readwrite');
        const objectStore = transaction.objectStore('questions');
        
        let imported = 0;
        questions.forEach(q => {
            const question = {
                class: q.class?.toString() || '6',
                question: q.question || '',
                options: q.options || [],
                answer: q.answer || ''
            };
            objectStore.add(question);
            imported++;
        });
        
        transaction.oncomplete = () => resolve(imported);
        transaction.onerror = () => reject(transaction.error);
    });
}

// ===================================
// QUESTION MANAGEMENT
// ===================================

function loadAllQuestions() {
    const transaction = db.transaction(['questions'], 'readonly');
    const objectStore = transaction.objectStore('questions');
    const request = objectStore.getAll();
    
    request.onsuccess = () => {
        adminState.allQuestions = request.result;
        updateTotalCount();
        displayQuestions();
    };
}

function updateTotalCount() {
    document.getElementById('total-questions').textContent = 
        `Total Questions: ${adminState.allQuestions.length}`;
}

function displayQuestions() {
    const tbody = document.getElementById('questions-tbody');
    tbody.innerHTML = '';
    
    let filtered = adminState.allQuestions;
    
    // Apply class filter
    if (adminState.currentFilter) {
        filtered = filtered.filter(q => q.class === adminState.currentFilter);
    }
    
    // Apply search
    if (adminState.currentSearch) {
        const search = adminState.currentSearch.toLowerCase();
        filtered = filtered.filter(q => 
            q.question.toLowerCase().includes(search) ||
            q.answer.toLowerCase().includes(search)
        );
    }
    
    // Pagination
    const start = (adminState.currentPage - 1) * adminState.itemsPerPage;
    const end = start + adminState.itemsPerPage;
    const paginated = filtered.slice(start, end);
    
    paginated.forEach(q => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${q.id}</td>
            <td>Class ${q.class}</td>
            <td>${q.question.substring(0, 50)}${q.question.length > 50 ? '...' : ''}</td>
            <td>${q.answer}</td>
            <td>
                <button class="action-btn edit" onclick="editQuestion(${q.id})">Edit</button>
                <button class="action-btn delete" onclick="deleteQuestion(${q.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Update pagination
    const totalPages = Math.ceil(filtered.length / adminState.itemsPerPage);
    document.getElementById('page-info').textContent = 
        `Page ${adminState.currentPage} of ${totalPages}`;
    
    document.getElementById('prev-page').disabled = adminState.currentPage === 1;
    document.getElementById('next-page').disabled = adminState.currentPage >= totalPages;
}

function handleSearch() {
    adminState.currentSearch = document.getElementById('search-question').value;
    adminState.currentPage = 1;
    displayQuestions();
}

function handleFilter() {
    adminState.currentFilter = document.getElementById('filter-class').value;
    adminState.currentPage = 1;
    displayQuestions();
}

function changePage(delta) {
    adminState.currentPage += delta;
    displayQuestions();
}

// ===================================
// ADD QUESTION
// ===================================

function handleAddQuestion() {
    const classLevel = document.getElementById('new-class').value;
    const question = document.getElementById('new-question').value.trim();
    const option1 = document.getElementById('new-option-1').value.trim();
    const option2 = document.getElementById('new-option-2').value.trim();
    const option3 = document.getElementById('new-option-3').value.trim();
    const option4 = document.getElementById('new-option-4').value.trim();
    const answerIndex = document.getElementById('new-answer').value;
    
    if (!question || !option1 || !option2 || !option3 || !option4 || !answerIndex) {
        alert('Please fill all fields!');
        return;
    }
    
    const options = [option1, option2, option3, option4];
    const answer = options[parseInt(answerIndex)];
    
    const newQuestion = {
        class: classLevel,
        question: question,
        options: options,
        answer: answer
    };
    
    const transaction = db.transaction(['questions'], 'readwrite');
    const objectStore = transaction.objectStore('questions');
    objectStore.add(newQuestion);
    
    transaction.oncomplete = () => {
        alert('Question added successfully!');
        document.getElementById('new-question').value = '';
        document.getElementById('new-option-1').value = '';
        document.getElementById('new-option-2').value = '';
        document.getElementById('new-option-3').value = '';
        document.getElementById('new-option-4').value = '';
        document.getElementById('new-answer').value = '';
        loadAllQuestions();
    };
}

// ===================================
// EDIT/DELETE QUESTION
// ===================================

function editQuestion(id) {
    const question = adminState.allQuestions.find(q => q.id === id);
    if (!question) return;
    
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-class').value = question.class;
    document.getElementById('edit-question').value = question.question;
    document.getElementById('edit-option-1').value = question.options[0] || '';
    document.getElementById('edit-option-2').value = question.options[1] || '';
    document.getElementById('edit-option-3').value = question.options[2] || '';
    document.getElementById('edit-option-4').value = question.options[3] || '';
    
    const answerIndex = question.options.indexOf(question.answer);
    document.getElementById('edit-answer').value = answerIndex >= 0 ? answerIndex : 0;
    
    document.getElementById('edit-modal').classList.add('active');
}

function saveEdit() {
    const id = parseInt(document.getElementById('edit-id').value);
    const classLevel = document.getElementById('edit-class').value;
    const question = document.getElementById('edit-question').value.trim();
    const option1 = document.getElementById('edit-option-1').value.trim();
    const option2 = document.getElementById('edit-option-2').value.trim();
    const option3 = document.getElementById('edit-option-3').value.trim();
    const option4 = document.getElementById('edit-option-4').value.trim();
    const answerIndex = parseInt(document.getElementById('edit-answer').value);
    
    const options = [option1, option2, option3, option4];
    const answer = options[answerIndex];
    
    const updatedQuestion = {
        id: id,
        class: classLevel,
        question: question,
        options: options,
        answer: answer
    };
    
    const transaction = db.transaction(['questions'], 'readwrite');
    const objectStore = transaction.objectStore('questions');
    objectStore.put(updatedQuestion);
    
    transaction.oncomplete = () => {
        closeEditModal();
        loadAllQuestions();
    };
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('active');
}

function deleteQuestion(id) {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    const transaction = db.transaction(['questions'], 'readwrite');
    const objectStore = transaction.objectStore('questions');
    objectStore.delete(id);
    
    transaction.oncomplete = () => {
        loadAllQuestions();
    };
}

function handleClearAll() {
    if (!confirm('Are you sure you want to delete ALL questions? This cannot be undone!')) return;
    
    const transaction = db.transaction(['questions'], 'readwrite');
    const objectStore = transaction.objectStore('questions');
    objectStore.clear();
    
    transaction.oncomplete = () => {
        alert('All questions deleted!');
        loadAllQuestions();
    };
}

// ===================================
// EXPORT
// ===================================

function exportData(format) {
    const questions = adminState.allQuestions;
    let content, filename, mimeType;
    
    if (format === 'json') {
        content = JSON.stringify(questions, null, 2);
        filename = 'questions.json';
        mimeType = 'application/json';
    } else if (format === 'csv') {
        content = 'Class,Question,Option A,Option B,Option C,Option D,Answer\n';
        questions.forEach(q => {
            const row = [
                q.class,
                `"${q.question}"`,
                `"${q.options[0] || ''}"`,
                `"${q.options[1] || ''}"`,
                `"${q.options[2] || ''}"`,
                `"${q.options[3] || ''}"`,
                `"${q.answer}"`
            ].join(',');
            content += row + '\n';
        });
        filename = 'questions.csv';
        mimeType = 'text/csv';
    } else if (format === 'txt') {
        content = '';
        questions.forEach((q, i) => {
            content += `Class: ${q.class}\n`;
            content += `Question: ${q.question}\n`;
            content += `A) ${q.options[0] || ''}\n`;
            content += `B) ${q.options[1] || ''}\n`;
            content += `C) ${q.options[2] || ''}\n`;
            content += `D) ${q.options[3] || ''}\n`;
            content += `Answer: ${q.answer}\n\n`;
        });
        filename = 'questions.txt';
        mimeType = 'text/plain';
    }
    
    downloadFile(content, filename, mimeType);
}

function exportByClass() {
    const classLevel = document.getElementById('export-class').value;
    if (!classLevel) {
        alert('Please select a class!');
        return;
    }
    
    const filtered = adminState.allQuestions.filter(q => q.class === classLevel);
    const content = JSON.stringify(filtered, null, 2);
    downloadFile(content, `questions_class_${classLevel}.json`, 'application/json');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Make functions global for onclick handlers
window.editQuestion = editQuestion;
window.deleteQuestion = deleteQuestion;
