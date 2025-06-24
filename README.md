# Weather App

A weather application that allows users to search for weather information by address with multiple location selection and stores search history in a MySQL database. **Now uses environment variables for API keys** for enhanced security and performance.

## Features

- **Address Search**: Enter any address to get weather information
- **Multiple Location Selection**: Choose from multiple matching locations (e.g., Paris, France vs Paris, Texas)
- **Weather Data**: Current weather and hourly forecasts from OpenWeatherMap API
- **Geocoding**: Address to coordinates conversion using MapBox API
- **Search History**: Save and view all previous searches
- **Responsive Design**: Works on desktop and mobile devices
- **Environment-based Configuration**: Secure API key management via environment variables

## Technology Stack

- **Backend**: Node.js + Express.js
- **Template Engine**: Nunjucks
- **Database**: MySQL
- **Frontend**: Bootstrap 4.3.1 + jQuery
- **APIs**: OpenWeatherMap + MapBox
- **Security**: Helmet, Rate Limiting, CORS
- **Configuration**: Environment Variables via dotenv

## Installation

### Prerequisites
- Node.js (>= 14.0.0)
- MySQL (>= 5.7)
- npm
- OpenWeatherMap API Key (free)
- MapBox API Key (free)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/weather-app.git
   cd weather-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MySQL database**
   ```bash
   # Create database and tables
   npm run db:setup
   
   # Load sample data (optional)
   npm run db:seed
   ```

4. **Configure environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your actual values
   nano .env
   ```

5. **Get API keys and update .env file**
   
   **OpenWeatherMap API Key:**
   - Go to [OpenWeatherMap](https://openweathermap.org/api)
   - Sign up for a free account
   - Get your API key
   - Add to .env: `OPENWEATHER_API_KEY=your_key_here`
   
   **MapBox API Key:**
   - Go to [MapBox](https://www.mapbox.com/)
   - Sign up for a free account
   - Get your access token
   - Add to .env: `MAPBOX_API_KEY=your_key_here`

6. **Update database configuration in .env**
   ```bash
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_database_password
   DB_NAME=weather_app
   ```

7. **Start the application**
   ```bash
   npm start
   # or for development with auto-restart
   npm run dev
   ```

8. **Open in browser**
   Visit [http://localhost:3000](http://localhost:3000)

## Migration from Database API Keys

If you're upgrading from a previous version that stored API keys in the database:

```bash
# Run the migration script
node migrate-to-env.js
```

This will:
- Extract API keys from your database
- Update your .env file automatically
- Verify the setup is working

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENWEATHER_API_KEY` | ✅ Yes | - | OpenWeatherMap API key |
| `MAPBOX_API_KEY` | ✅ Yes | - | MapBox API access token |
| `PORT` | ❌ No | 3000 | Server port |
| `DB_HOST` | ✅ Yes | localhost | MySQL host |
| `DB_USER` | ✅ Yes | root | MySQL username |
| `DB_PASSWORD` | ✅ Yes | - | MySQL password |
| `DB_NAME` | ✅ Yes | weather_app | MySQL database name |
| `NODE_ENV` | ❌ No | development | Environment (development/production) |
| `MAX_HISTORY_ITEMS` | ❌ No | 1000 | Maximum history entries |
| `CACHE_DURATION` | ❌ No | 3600 | Cache duration in seconds |
| `RATE_LIMIT_MAX` | ❌ No | 100 | Max requests per IP per window |
| `API_TIMEOUT_MS` | ❌ No | 15000 | API request timeout |

## Usage

### Basic Flow:
1. **Search Address**: Enter an address like "Paris" and click "Search"
2. **Choose Location**: If multiple locations are found, select your preferred one:
   - 🇫🇷 Paris, France
   - 🇺🇸 Paris, Texas, United States
   - 🇺🇸 Paris, Tennessee, United States
3. **Get Weather**: Click "Get Weather" to fetch current weather data
4. **Save Search**: Click "Save to History" to store the search
5. **View History**: Click "Show History" to see all previous searches

### Multiple Location Selection:
The app intelligently handles ambiguous location names:
- **"Springfield"** → Shows multiple US cities
- **"Washington"** → Shows Washington State vs Washington DC
- **"Cambridge"** → Shows Cambridge, UK vs Cambridge, Massachusetts
- **"Portland"** → Shows Portland, Maine vs Portland, Oregon

### API Endpoints:
- `POST /api/geocode` - Convert address to coordinates (returns multiple results)
- `POST /api/weather` - Get weather data for coordinates
- `POST /api/store-search` - Save search to history
- `GET /api/history` - Retrieve search history
- `DELETE /api/history/:id` - Delete specific history item
- `DELETE /api/history` - Clear all history
- `GET /api/health` - Health check with API key status

## Database Schema

The application uses three main tables:
- `weather_history` - Stores search history with weather data
- `geocoding_cache` - Caches geocoding results for performance
- `api_config` - **DEPRECATED** (API keys now in environment variables)

## API Documentation

Visit [http://localhost:3000/api-doc](http://localhost:3000/api-doc) for complete API documentation with examples.

## Performance & Security

### Security Features:
- ✅ **Environment Variables**: API keys stored securely outside code
- ✅ **Rate Limiting**: 100 requests per 15 minutes per IP
- ✅ **CORS Protection**: Configurable cross-origin requests
- ✅ **Helmet Security Headers**: XSS, CSRF, and other protections
- ✅ **Input Validation**: All user inputs are validated and sanitized

### Performance Features:
- ✅ **Database Connection Pooling**: Efficient database connections
- ✅ **Geocoding Cache**: Reduces API calls for repeated addresses
- ✅ **Response Compression**: Faster page loads
- ✅ **Smart Caching**: Avoids caching ambiguous location searches

## Requirements Compliance

✅ **Requirement 1**: Address input + OpenWeatherMap API integration  
✅ **Requirement 2**: Save button to store data in database  
✅ **Requirement 3**: Historical data retrieval and display  
✅ **Requirement 4**: Dynamic HTML generation  
✅ **Requirement 5**: Public GitHub repository with database backup  
✅ **Enhancement**: Multiple location selection for better UX  
✅ **Enhancement**: Environment-based configuration for security  

## Development

### Scripts:
```bash
npm start          # Start production server
npm run dev        # Start development server with auto-restart
npm run db:setup   # Create database tables
npm run db:seed    # Load sample data
```

### Health Check:
```bash
curl http://localhost:3000/api/health
```

### Clear Cache:
```bash
curl -X DELETE http://localhost:3000/api/clear-cache
```

## Troubleshooting

### Common Issues:

**API Keys Not Working:**
```bash
# Verify your API keys in the health check
curl http://localhost:3000/api/health
```

**Database Connection Issues:**
- Check your MySQL server is running
- Verify DB credentials in .env file
- Ensure database exists: `CREATE DATABASE weather_app;`

**No Multiple Locations Showing:**
- Clear the geocoding cache: `curl -X DELETE http://localhost:3000/api/clear-cache`
- Try more ambiguous terms like "Springfield" or "Washington"

**Rate Limiting:**
- Default: 100 requests per 15 minutes per IP
- Adjust `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW` in .env

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License

---

**🌟 Key Improvements in This Version:**
- **Secure API Key Management** via environment variables
- **Multiple Location Selection** for ambiguous addresses
- **Enhanced Performance** with smart caching and connection pooling
- **Better Security** with rate limiting and security headers
- **Improved Documentation** with complete setup instructions
