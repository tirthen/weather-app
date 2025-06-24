const express = require('express');
const axios = require('axios');
const mysql = require('mysql2/promise');
const router = express.Router();

// Database connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'weather_app',
    charset: 'utf8mb4'
};

const MAPBOX_API_KEY = process.env.MAPBOX_API_KEY;
const MAPBOX_BASE_URL = process.env.MAPBOX_BASE_URL
const OWM_API_KEY = process.env.OPENWEATHER_API_KEY;
const OWM_BASE_URL_V3 = process.env.OPENWEATHER_BASE_URL_V3;
const DEFAULT_UNITS = process.env.DEFAULT_UNITS
const DEFAULT_EXCLUDE = process.env.DEFAULT_EXCLUDE

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// router.post('/geocode', async (req, res) => {
//     try {
//         const { address, forceRefresh } = req.body;

//         if (!address) {
//             return res.status(400).json({ error: 'Address is required' });
//         }

//         const connection = await pool.getConnection();

//         // FIXED: Skip cache for common ambiguous terms OR if forceRefresh is requested
//         const ambiguousTerms = ['paris', 'springfield', 'washington', 'cambridge', 'portland', 'franklin', 'richmond', 'clinton', 'madison', 'jackson'];
//         const isAmbiguous = ambiguousTerms.some(term => address.toLowerCase().includes(term));
//         const skipCache = forceRefresh || isAmbiguous;

//         if (!skipCache) {
//             // Check cache for exact matches only
//             const [cached] = await connection.execute(
//                 'SELECT latitude, longitude, formatted_address FROM geocoding_cache WHERE address = ? AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)',
//                 [address]
//             );

//             if (cached.length > 0) {
//                 connection.release();
//                 return res.json({
//                     results: [{
//                         latitude: cached[0].latitude,
//                         longitude: cached[0].longitude,
//                         formatted_address: cached[0].formatted_address,
//                         source: 'cache',
//                         relevance: 1.0
//                     }],
//                     count: 1,
//                     source: 'cache'
//                 });
//             }
//         }

//         const encodedAddress = encodeURIComponent(address);
//         const geocodeUrl = `${MAPBOX_BASE_URL}/${encodedAddress}.json`
//             + `?access_token=${MAPBOX_API_KEY}`
//             + `&limit=10`
//             + `&types=place,locality,neighborhood,address,poi`;

//         const response = await axios.get(geocodeUrl, {
//             timeout: 10000,
//             headers: {
//                 'User-Agent': 'WeatherApp/1.0'
//             }
//         });

//         if (!response.data.features || response.data.features.length === 0) {
//             connection.release();
//             return res.status(404).json({ error: 'Address not found' });
//         }

//         // FIXED: Process ALL results, not just the first one
//         const results = response.data.features.map(feature => {
//             const [longitude, latitude] = feature.center;

//             // Extract location details with better parsing
//             let country = '';
//             let region = '';
//             let place = '';

//             if (feature.context) {
//                 const countryContext = feature.context.find(c => c.id && c.id.startsWith('country'));
//                 const regionContext = feature.context.find(c => c.id && c.id.startsWith('region'));
//                 const placeContext = feature.context.find(c => c.id && c.id.startsWith('place'));

//                 country = countryContext ? countryContext.text : '';
//                 region = regionContext ? regionContext.text : '';
//                 place = placeContext ? placeContext.text : '';
//             }

//             return {
//                 latitude: parseFloat(latitude.toFixed(6)),
//                 longitude: parseFloat(longitude.toFixed(6)),
//                 formatted_address: feature.place_name,
//                 place_type: feature.place_type || [],
//                 relevance: feature.relevance || 1,
//                 country: country,
//                 region: region,
//                 place: place,
//                 bbox: feature.bbox || null
//             };
//         });

//         // FIXED: Only cache if we have exactly one result (unambiguous)
//         if (results.length === 1 && !isAmbiguous) {
//             try {
//                 await connection.execute(
//                     'INSERT INTO geocoding_cache (address, latitude, longitude, formatted_address) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE latitude=VALUES(latitude), longitude=VALUES(longitude), formatted_address=VALUES(formatted_address), created_at=NOW()',
//                     [address, results[0].latitude, results[0].longitude, results[0].formatted_address]
//                 );
//             } catch (cacheError) {
//                 console.warn('Cache insert failed:', cacheError.message);
//             }
//         }

//         connection.release();

//         // FIXED: Always return all results
//         const responseData = {
//             results: results,
//             count: results.length,
//             source: 'api',
//             cached: !skipCache,
//             ambiguous: isAmbiguous
//         };

//         res.json(responseData);

//     } catch (error) {
//         console.error('Geocoding error:', error);
//         if (error.code === 'ECONNABORTED') {
//             res.status(408).json({ error: 'Request timeout - please try again' });
//         } else if (error.response && error.response.status === 401) {
//             res.status(401).json({ error: 'Invalid MapBox API key' });
//         } else {
//             res.status(500).json({ error: 'Failed to geocode address' });
//         }
//     }
// });

router.post('/geocode', async (req, res) => {
    try {
        const { address, forceRefresh } = req.body;

        if (!address) {
            return res.status(400).json({ error: 'Address is required' });
        }

        const encodedAddress = encodeURIComponent(address);
        const geocodeUrl = `${MAPBOX_BASE_URL}/${encodedAddress}.json`
            + `?access_token=${MAPBOX_API_KEY}`
            + `&limit=10`
            + `&types=place,locality,neighborhood,address,poi`;

        const response = await axios.get(geocodeUrl, {
            timeout: 10000,
            headers: { 'User-Agent': 'WeatherApp/1.0' }
        });

        if (!response.data.features || response.data.features.length === 0) {
            return res.status(404).json({ error: 'Address not found' });
        }

        // Process all results
        const results = response.data.features.map(feature => {
            const [longitude, latitude] = feature.center;
            let country = '', region = '', place = '';
            if (feature.context) {
                const c = feature.context;
                country = (c.find(x => x.id.startsWith('country'))?.text) || '';
                region = (c.find(x => x.id.startsWith('region'))?.text) || '';
                place = (c.find(x => x.id.startsWith('place'))?.text) || '';
            }

            return {
                latitude: parseFloat(latitude.toFixed(6)),
                longitude: parseFloat(longitude.toFixed(6)),
                formatted_address: feature.place_name,
                place_type: feature.place_type || [],
                relevance: feature.relevance || 1,
                country, region, place,
                bbox: feature.bbox || null
            };
        });

        res.json({
            results,
            count: results.length,
            source: 'api'
        });

    } catch (error) {
        console.error('Geocoding error:', error);
        if (error.code === 'ECONNABORTED') {
            return res.status(408).json({ error: 'Request timeout - please try again' });
        } else if (error.response && error.response.status === 401) {
            return res.status(401).json({ error: 'Invalid MapBox API key' });
        } else {
            return res.status(500).json({ error: 'Failed to geocode address' });
        }
    }
});


// Get weather data from OpenWeatherMap
router.post('/weather', async (req, res) => {
    try {
        const { latitude, longitude, address } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }

        const oneCallUrl = `${OWM_BASE_URL_V3}/onecall`
            + `?lat=${latitude}`
            + `&lon=${longitude}`
            + `&appid=${OWM_API_KEY}`
            + `&units=${DEFAULT_UNITS}`
            + `&exclude=${DEFAULT_EXCLUDE}`;

        const oneCallResponse = await axios.get(oneCallUrl);

        // Extract current and forecast data from one call
        currentWeatherResponse = {
            data: {
                coord: { lat: latitude, lon: longitude },
                weather: oneCallResponse.data.current.weather,
                main: {
                    temp: oneCallResponse.data.current.temp,
                    feels_like: oneCallResponse.data.current.feels_like,
                    temp_min: oneCallResponse.data.daily[0].temp.min,
                    temp_max: oneCallResponse.data.daily[0].temp.max,
                    pressure: oneCallResponse.data.current.pressure,
                    humidity: oneCallResponse.data.current.humidity
                },
                visibility: oneCallResponse.data.current.visibility,
                wind: {
                    speed: oneCallResponse.data.current.wind_speed,
                    deg: oneCallResponse.data.current.wind_deg
                },
                clouds: { all: oneCallResponse.data.current.clouds },
                dt: oneCallResponse.data.current.dt,
                sys: {
                    sunrise: oneCallResponse.data.current.sunrise,
                    sunset: oneCallResponse.data.current.sunset
                },
                timezone: oneCallResponse.data.timezone_offset,
                name: address || `${latitude}, ${longitude}`
            }
        };

        forecastResponse = oneCallResponse;

        const weatherData = {
            current: currentWeatherResponse.data,
            hourly: forecastResponse.data.hourly.slice(0, 24),
            daily: forecastResponse.data.daily.slice(0, 7),
            address: address || `${latitude}, ${longitude}`,
            timestamp: new Date().toISOString()
        };

        res.json(weatherData);

    } catch (error) {
        console.error('Weather API error:', error);
        if (error.response && error.response.status === 401) {
            res.status(401).json({ error: 'Invalid API key. Please check your OpenWeatherMap API key.' });
        } else if (error.response && error.response.status === 404) {
            res.status(404).json({ error: 'Weather data not found for this location' });
        } else {
            res.status(500).json({ error: 'Failed to fetch weather data' });
        }
    }
});

// Store weather search in database
router.post('/store-search', async (req, res) => {
    try {
        const { address, latitude, longitude, current_weather, hourly_forecast } = req.body;

        if (!address || !latitude || !longitude || !current_weather) {
            return res.status(400).json({ error: 'Missing required data' });
        }

        const connection = await pool.getConnection();

        const [result] = await connection.execute(
            `INSERT INTO weather_history
             (address, latitude, longitude, current_weather, hourly_forecast, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                address,
                latitude,
                longitude,
                JSON.stringify(current_weather),
                JSON.stringify(hourly_forecast || []),
                req.ip || req.connection.remoteAddress,
                req.get('User-Agent') || 'Unknown'
            ]
        );

        connection.release();

        res.json({
            success: true,
            message: 'Weather search stored successfully',
            id: result.insertId
        });

    } catch (error) {
        console.error('Database storage error:', error);
        res.status(500).json({ error: 'Failed to store weather search' });
    }
});

// Get historical weather searches
router.get('/history', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        const connection = await pool.getConnection();

        // Get total count first
        const [countResult] = await connection.execute(
            'SELECT COUNT(*) as total FROM weather_history'
        );
        const total = countResult[0].total;

        // Get paginated results
        const query = `SELECT id, address, latitude, longitude, current_weather, 
                              search_timestamp, ip_address
                       FROM weather_history 
                       ORDER BY search_timestamp DESC 
                       LIMIT ${limit} OFFSET ${offset}`;

        const [rows] = await connection.execute(query);

        connection.release();

        // Parse JSON data
        const history = rows.map(row => {
            try {
                return {
                    ...row,
                    current_weather: typeof row.current_weather === 'string'
                        ? JSON.parse(row.current_weather)
                        : row.current_weather,
                    search_timestamp: new Date(row.search_timestamp).toLocaleString()
                };
            } catch (parseError) {
                console.error('Error parsing weather data for row:', row.id, parseError);
                return {
                    ...row,
                    current_weather: { error: 'Invalid data' },
                    search_timestamp: new Date(row.search_timestamp).toLocaleString()
                };
            }
        });

        res.json({
            data: history,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('History retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve search history' });
    }
});

// Delete a specific history entry
router.delete('/history/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const connection = await pool.getConnection();
        const [result] = await connection.execute(
            'DELETE FROM weather_history WHERE id = ?',
            [id]
        );
        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'History entry not found' });
        }

        res.json({ success: true, message: 'History entry deleted successfully' });

    } catch (error) {
        console.error('Delete history error:', error);
        res.status(500).json({ error: 'Failed to delete history entry' });
    }
});

// Clear all history
router.delete('/history', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        await connection.execute('DELETE FROM weather_history');
        connection.release();

        res.json({ success: true, message: 'All history cleared successfully' });

    } catch (error) {
        console.error('Clear history error:', error);
        res.status(500).json({ error: 'Failed to clear history' });
    }
});

// ADDED: Clear geocoding cache endpoint for testing
router.delete('/clear-cache', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        await connection.execute('DELETE FROM geocoding_cache');
        connection.release();

        res.json({ success: true, message: 'Geocoding cache cleared successfully' });
    } catch (error) {
        console.error('Clear cache error:', error);
        res.status(500).json({ error: 'Failed to clear cache' });
    }
});

// Health check endpoint
router.get('/health', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        await connection.execute('SELECT 1');
        connection.release();

        res.json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message
        });
    }
});

module.exports = router;