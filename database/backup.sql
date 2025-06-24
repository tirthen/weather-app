-- Weather App Database Backup
-- Generated: 2024-12-26
-- This file contains sample data for testing

USE weather_app;

-- Sample weather history data
INSERT INTO weather_history (address, latitude, longitude, current_weather, hourly_forecast, search_timestamp, ip_address, user_agent) VALUES
(
    'New York, NY',
    40.7128,
    -74.0060,
    '{"coord":{"lon":-74.0060,"lat":40.7128},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01d"}],"base":"stations","main":{"temp":22.5,"feels_like":24.1,"temp_min":20.2,"temp_max":25.3,"pressure":1013,"humidity":65},"visibility":10000,"wind":{"speed":3.2,"deg":180},"clouds":{"all":0},"dt":1687513200,"sys":{"type":1,"id":4610,"country":"US","sunrise":1687497283,"sunset":1687552077},"timezone":-14400,"id":5128581,"name":"New York","cod":200}',
    '[]',
    '2024-12-26 10:30:00',
    '127.0.0.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
),
(
    'London, UK',
    51.5074,
    -0.1278,
    '{"coord":{"lon":-0.1278,"lat":51.5074},"weather":[{"id":803,"main":"Clouds","description":"broken clouds","icon":"04d"}],"base":"stations","main":{"temp":18.2,"feels_like":17.8,"temp_min":16.1,"temp_max":20.3,"pressure":1018,"humidity":72},"visibility":8000,"wind":{"speed":2.8,"deg":220},"clouds":{"all":75},"dt":1687513800,"sys":{"type":2,"id":2019646,"country":"GB","sunrise":1687492987,"sunset":1687558234},"timezone":3600,"id":2643743,"name":"London","cod":200}',
    '[]',
    '2024-12-26 09:15:00',
    '127.0.0.1',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
);

-- Verify data
SELECT 'Weather History', COUNT(*) FROM weather_history;