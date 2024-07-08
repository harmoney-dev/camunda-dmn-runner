import express from 'express';
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import { format } from 'date-fns';
import archiver from 'archiver';
import { processCSVFiles } from './dataPreparation';

const router = express.Router();
const csvDir = 'dmnCSV';
const configDir = 'dmnConfigs';
const dmnDir = 'dmns';

// Middleware to parse JSON bodies
router.use(express.json());

// Ensure the upload directories exist
if (!fs.existsSync(csvDir)) {
    fs.mkdirSync(csvDir);
}

if (!fs.existsSync(dmnDir)) {
    fs.mkdirSync(dmnDir);
}

// Function to get the current timestamp in the format
function getTimestamp(): string {
    return format(new Date(), 'yyyyMMdd-HHmmssSSS');
}

// Route to handle CSV file uploads
router.post('/upload-csv', async (req, res) => {
    if (!req.files || !req.files.files) {
        return res.status(400).send('No files were uploaded.');
    }

    const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];

    try {
        for (const file of files) {
            const uploadedFile = file as fileUpload.UploadedFile;

            // Validate file extension
            if (path.extname(uploadedFile.name) !== '.csv') {
                return res.status(400).send('Only CSV files are allowed.');
            }

            // Save the file to the upload directory
            const uploadPath = path.join(csvDir, uploadedFile.name);
            await uploadedFile.mv(uploadPath);
        }

        // Process CSV files after the upload is complete
        await processCSVFiles();
        res.send('CSV files uploaded and processed successfully!');
    } catch (error) {
        res.status(500).send(`Error uploading or processing CSV files: ${error}`);
    }
});

// Route to handle DMN file uploads
router.post('/upload-dmn', async (req, res) => {
    if (!req.files || !req.files.files) {
        return res.status(400).send('No files were uploaded.');
    }

    const files = Array.isArray(req.files.files) ? req.files.files : [req.files.files];

    try {
        for (const file of files) {
            const uploadedFile = file as fileUpload.UploadedFile;

            // Validate file extension
            if (path.extname(uploadedFile.name) !== '.dmn') {
                return res.status(400).send('Only DMN files are allowed.');
            }

            // Save the file to the upload directory
            const uploadPath = path.join(dmnDir, uploadedFile.name);
            await uploadedFile.mv(uploadPath);
        }

        res.send('DMN files uploaded successfully!');
    } catch (error) {
        res.status(500).send(`Error uploading DMN files: ${error}`);
    }
});

// Route to list all CSV files in dmnCSV directory
router.get('/list-csv-files', (req, res) => {
    fs.readdir(csvDir, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan files.');
        }
        res.send(files);
    });
});

// Route to list all DMN files in dmns directory
router.get('/list-dmn-files', (req, res) => {
    fs.readdir(dmnDir, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan files.');
        }
        res.send(files);
    });
});

// Route to delete selected CSV files and their related .conf files
router.post('/delete-csv-files', (req, res) => {
    const filesToDelete = req.body.files || [];
    try {
        filesToDelete.forEach((file: string) => {
            const filePath = path.join(csvDir, file);
            const confFilePath = path.join(configDir, file.replace('.csv', '.conf'));
            
            // Delete the CSV file
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            
            // Delete the related .conf file
            if (fs.existsSync(confFilePath)) {
                fs.unlinkSync(confFilePath);
            }
        });
        res.send('Selected CSV files and related .conf files deleted successfully.');
    } catch (error) {
        res.status(500).send(`Error deleting CSV and .conf files: ${error}`);
    }
});

// Route to delete selected DMN files
router.post('/delete-dmn-files', (req, res) => {
    const filesToDelete = req.body.files || [];
    try {
        filesToDelete.forEach((file: string) => {
            const filePath = path.join(dmnDir, file);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });
        res.send('Selected DMN files deleted successfully.');
    } catch (error) {
        res.status(500).send(`Error deleting DMN files: ${error}`);
    }
});

// Route to clear all files in dmnConfigs directories
router.post('/clear-all', (req, res) => {
    const directories = [configDir, csvDir, dmnDir];
    try {
        directories.forEach((dir) => {
            fs.readdir(dir, (err, files) => {
                if (err) throw err;
                for (const file of files) {
                    fs.unlink(path.join(dir, file), (err) => {
                        if (err) throw err;
                    });
                }
            });
        });
        res.send('All files cleared successfully.');
    } catch (error) {
        res.status(500).send(`Error clearing files: ${error}`);
    }
});

// Route to download selected CSV files as a ZIP
router.post('/download-csv-files', (req, res) => {
    const filesToDownload = req.body.files || [];

    if (filesToDownload.length === 0) {
        return res.status(400).send('No files selected for download.');
    }

    const archive = archiver('zip');
    res.attachment('selected_csv_files.zip');

    archive.on('error', (err: { message: any; }) => {
        res.status(500).send({ error: err.message });
    });

    archive.pipe(res);

    filesToDownload.forEach((file: string) => {
        const filePath = path.join(csvDir, file);
        if (fs.existsSync(filePath)) {
            archive.file(filePath, { name: file });
        }
    });

    archive.finalize();
});

// Route to download selected DMN files as a ZIP
router.post('/download-dmn-files', (req, res) => {
    const filesToDownload = req.body.files || [];

    if (filesToDownload.length === 0) {
        return res.status(400).send('No files selected for download.');
    }

    const archive = archiver('zip');
    res.attachment('selected_dmn_files.zip');

    archive.on('error', (err: { message: any; }) => {
        res.status(500).send({ error: err.message });
    });

    archive.pipe(res);

    filesToDownload.forEach((file: string) => {
        const filePath = path.join(dmnDir, file);
        if (fs.existsSync(filePath)) {
            archive.file(filePath, { name: file });
        }
    });

    archive.finalize();
});

export default router;