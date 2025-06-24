-- Weather App Database Schema
CREATE DATABASE IF NOT EXISTS weather_app;
USE weather_app;

-- Table for storing weather search history
CREATE TABLE IF NOT EXISTS weather_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    address VARCHAR(500) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    current_weather JSON,
    hourly_forecast JSON,
    search_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);


-- Create indexes for better performance
CREATE INDEX idx_search_timestamp ON weather_history(search_timestamp);
CREATE INDEX idx_coordinates ON weather_history(latitude, longitude);

-- Show tables
SHOW TABLES;