const express = require('express');
const router = express.Router();

// Home page
router.get('/', (req, res) => {
    res.render('index', {
        title: 'Weather App - Address Lookup',
        currentYear: new Date().getFullYear()
    });
});

// History page
router.get('/history', (req, res) => {
    res.render('history', {
        title: 'Weather App - Search History',
        currentYear: new Date().getFullYear()
    });
});

// About page
router.get('/about', (req, res) => {
    res.render('about', {
        title: 'Weather App - About',
        currentYear: new Date().getFullYear()
    });
});

// API Documentation page
router.get('/api-doc', (req, res) => {
    res.render('api-doc', {
        title: 'Weather App - API Documentation',
        currentYear: new Date().getFullYear()
    });
});

// API documentation page
router.get('/docs', (req, res) => {
    res.render('docs', {
        title: 'Weather App - API Documentation',
        currentYear: new Date().getFullYear()
    });
});


module.exports = router;