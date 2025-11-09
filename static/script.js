// DOM Elements
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const uploadForm = document.getElementById('uploadForm');
const previewSection = document.getElementById('previewSection');
const previewImage = document.getElementById('previewImage');
const removeImageBtn = document.getElementById('removeImage');
const detectBtn = document.getElementById('detectBtn');
const resultsSection = document.getElementById('resultsSection');
const originalImage = document.getElementById('originalImage');
const resultImage = document.getElementById('resultImage');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const analyzeAnotherBtn = document.getElementById('analyzeAnother');
const detectionBadge = document.getElementById('detectionBadge');
const resultsStats = document.getElementById('resultsStats');

// State
let selectedFile = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Upload area click
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Remove image
    removeImageBtn.addEventListener('click', removeImage);
    
    // Form submit
    uploadForm.addEventListener('submit', handleSubmit);
    
    // Analyze another
    analyzeAnotherBtn.addEventListener('click', resetForm);
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, preventDefaults, false);
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file.');
        return;
    }
    
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
        showError('File size must be less than 10MB.');
        return;
    }
    
    selectedFile = file;
    hideError();
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        previewSection.style.display = 'block';
        detectBtn.disabled = false;
        
        // Scroll to preview
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    selectedFile = null;
    fileInput.value = '';
    previewSection.style.display = 'none';
    detectBtn.disabled = true;
    hideError();
}

function resetForm() {
    removeImage();
    resultsSection.style.display = 'none';
    uploadForm.reset();
}

async function handleSubmit(e) {
    e.preventDefault();
    
    if (!selectedFile) {
        showError('Please select an image first.');
        return;
    }
    
    hideError();
    setLoadingState(true);
    resultsSection.style.display = 'none';
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
        const response = await fetch('/predict', {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });
        
        // Check if response is JSON or HTML
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            // JSON response (AJAX)
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            handleSuccess(data);
        } else {
            // HTML response (fallback)
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || `HTTP error! status: ${response.status}`);
            }
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Extract image URLs from the HTML
            const uploadedImg = doc.querySelector('img[alt="Uploaded Image"]');
            const resultImg = doc.querySelector('img[alt="Detected Result"]');
            
            if (uploadedImg && resultImg) {
                handleSuccess({
                    uploaded_image: uploadedImg.src,
                    result_image: resultImg.src
                });
            } else {
                throw new Error('Could not parse response.');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        const errorMessage = error.message || 'Failed to analyze image. Please try again.';
        showError(errorMessage);
        setLoadingState(false);
    }
}

function handleSuccess(data) {
    setLoadingState(false);
    
    // Set images
    if (data.uploaded_image) {
        originalImage.src = data.uploaded_image + '?t=' + Date.now();
    }
    
    if (data.result_image) {
        resultImage.src = data.result_image + '?t=' + Date.now();
    }
    
    // Update badge
    detectionBadge.textContent = 'Detected';
    detectionBadge.style.background = '#10b981';
    
    // Show stats if available
    if (data.stats) {
        displayStats(data.stats);
    } else {
        resultsStats.innerHTML = '<p style="color: var(--text-muted);">Analysis complete</p>';
    }
    
    // Show results
    resultsSection.style.display = 'block';
    
    // Scroll to results
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    // Fade in images
    [originalImage, resultImage].forEach(img => {
        img.style.opacity = '0';
        img.onload = () => {
            img.style.transition = 'opacity 0.5s ease';
            img.style.opacity = '1';
        };
    });
}

function displayStats(stats) {
    if (!stats || Object.keys(stats).length === 0) {
        resultsStats.innerHTML = '<p style="color: var(--text-muted);">Analysis complete</p>';
        return;
    }
    
    const statsHTML = Object.entries(stats).map(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `
            <div style="
                padding: 0.5rem 1rem;
                background: var(--bg-glass);
                border-radius: var(--radius-sm);
                border: 1px solid var(--border-color);
            ">
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">${label}</div>
                <div style="font-size: 1.25rem; font-weight: 600; color: var(--primary-light);">${value}</div>
            </div>
        `;
    }).join('');
    
    resultsStats.innerHTML = `<div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;">${statsHTML}</div>`;
}

function setLoadingState(loading) {
    const btnText = detectBtn.querySelector('.btn-text');
    const btnLoader = detectBtn.querySelector('.btn-loader');
    
    if (loading) {
        detectBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-flex';
        detectionBadge.textContent = 'Processing...';
        detectionBadge.style.background = 'var(--warning)';
    } else {
        detectBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'flex';
    
    // Scroll to error
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    errorMessage.style.display = 'none';
}

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, pause any animations if needed
    } else {
        // Page is visible, resume animations
    }
});

// Add smooth scroll behavior
document.documentElement.style.scrollBehavior = 'smooth';
