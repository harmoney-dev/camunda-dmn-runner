// index.ts
import express from 'express';
import fileUpload from 'express-fileupload';
import apiRouter from './api';

const app = express();
const port = process.env.PORT || 8882;

// Middleware to handle file uploads
app.use(fileUpload());
app.use(express.static('public'));

// Use the apiRouter for API routes
app.use('/api', apiRouter);

// Start the server
app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});