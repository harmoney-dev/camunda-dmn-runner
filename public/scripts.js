// Dynamically update the DMN Runner Dashboard link
document.addEventListener('DOMContentLoaded', (event) => {
    const dashboardLink = document.getElementById('dashboardLink');
    const currentHost = window.location.hostname;

    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        dashboardLink.href = 'http://localhost:8883';
    }
});

const uploadCsvForm = document.getElementById('uploadCsvForm');
const uploadDmnForm = document.getElementById('uploadDmnForm');
const csvFilesInput = document.getElementById('csvFiles');
const dmnFilesInput = document.getElementById('dmnFiles');
const clearAllButton = document.getElementById('clearAllButton');
const deleteSelectedCsvButton = document.getElementById('deleteSelectedCsvButton');
const deleteSelectedDmnButton = document.getElementById('deleteSelectedDmnButton');
const downloadSelectedCsvButton = document.getElementById('downloadSelectedCsvButton');
const downloadSelectedDmnButton = document.getElementById('downloadSelectedDmnButton');
const selectAllCsv = document.getElementById('selectAllCsv');
const selectAllDmn = document.getElementById('selectAllDmn');
const csvFileList = document.getElementById('csvFileList');
const dmnFileList = document.getElementById('dmnFileList');
const messageDiv = document.getElementById('message');
const errorDiv = document.getElementById('error');

async function uploadFiles(url, files) {
    const formData = new FormData();
    for (const file of files) {
        formData.append('files', file);
    }
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        const result = await response.text();
        if (response.ok) {
            messageDiv.textContent = result;
            errorDiv.textContent = '';
        } else {
            messageDiv.textContent = '';
            errorDiv.textContent = result;
        }
    } catch (error) {
        messageDiv.textContent = '';
        errorDiv.textContent = `Error uploading files: ${error}`;
    }
}

csvFilesInput.addEventListener('change', async (e) => {
    if (csvFilesInput.files.length > 0) {
        await uploadFiles('/api/upload-csv', csvFilesInput.files);
        loadCsvFileList();
    }
});

dmnFilesInput.addEventListener('change', async (e) => {
    if (dmnFilesInput.files.length > 0) {
        await uploadFiles('/api/upload-dmn', dmnFilesInput.files);
        loadDmnFileList();
    }
});

clearAllButton.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/clear-all', {
            method: 'POST'
        });
        const result = await response.text();
        if (response.ok) {
            messageDiv.textContent = result;
            errorDiv.textContent = '';
            loadCsvFileList();
            loadDmnFileList();
        } else {
            messageDiv.textContent = '';
            errorDiv.textContent = result;
        }
    } catch (error) {
        messageDiv.textContent = '';
        errorDiv.textContent = 'Error clearing files';
    }
});

deleteSelectedCsvButton.addEventListener('click', async () => {
    const selectedFiles = Array.from(csvFileList.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
    if (selectedFiles.length === 0) {
        alert('No files selected for deletion');
        return;
    }

    try {
        const response = await fetch('/api/delete-csv-files', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ files: selectedFiles })
        });
        const result = await response.text();
        if (response.ok) {
            messageDiv.textContent = result;
            errorDiv.textContent = '';
            loadCsvFileList();
        } else {
            messageDiv.textContent = '';
            errorDiv.textContent = result;
        }
    } catch (error) {
        messageDiv.textContent = '';
        errorDiv.textContent = 'Error deleting selected CSV files';
    }
});

deleteSelectedDmnButton.addEventListener('click', async () => {
    const selectedFiles = Array.from(dmnFileList.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
    if (selectedFiles.length === 0) {
        alert('No files selected for deletion');
        return;
    }

    try {
        const response = await fetch('/api/delete-dmn-files', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ files: selectedFiles })
        });
        const result = await response.text();
        if (response.ok) {
            messageDiv.textContent = result;
            errorDiv.textContent = '';
            loadDmnFileList();
        } else {
            messageDiv.textContent = '';
            errorDiv.textContent = result;
        }
    } catch (error) {
        messageDiv.textContent = '';
        errorDiv.textContent = 'Error deleting selected DMN files';
    }
});

downloadSelectedCsvButton.addEventListener('click', async () => {
    const selectedFiles = Array.from(csvFileList.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
    if (selectedFiles.length === 0) {
        alert('No files selected for download');
        return;
    }

    try {
        const response = await fetch('/api/download-csv-files', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ files: selectedFiles })
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'selected_csv_files.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        messageDiv.textContent = '';
        errorDiv.textContent = 'Error downloading selected CSV files';
    }
});

downloadSelectedDmnButton.addEventListener('click', async () => {
    const selectedFiles = Array.from(dmnFileList.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
    if (selectedFiles.length === 0) {
        alert('No files selected for download');
        return;
    }

    try {
        const response = await fetch('/api/download-dmn-files', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ files: selectedFiles })
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'selected_dmn_files.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        messageDiv.textContent = '';
        errorDiv.textContent = 'Error downloading selected DMN files';
    }
});

selectAllCsv.addEventListener('change', (e) => {
    const checkboxes = csvFileList.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = e.target.checked);
});

selectAllDmn.addEventListener('change', (e) => {
    const checkboxes = dmnFileList.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = e.target.checked);
});

async function loadCsvFileList() {
    try {
        const response = await fetch('/api/list-csv-files');
        const files = await response.json();
        csvFileList.innerHTML = '';
        files.forEach(file => {
            const listItem = document.createElement('li');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = file;
            listItem.appendChild(checkbox);
            listItem.appendChild(document.createTextNode(file));
            csvFileList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error loading CSV file list', error);
    }
}

async function loadDmnFileList() {
    try {
        const response = await fetch('/api/list-dmn-files');
        const files = await response.json();
        dmnFileList.innerHTML = '';
        files.forEach(file => {
            const listItem = document.createElement('li');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = file;
            listItem.appendChild(checkbox);
            listItem.appendChild(document.createTextNode(file));
            dmnFileList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error loading DMN file list', error);
    }
}

// Initial load of file lists
loadCsvFileList();
loadDmnFileList();