/**
 * Weather App - Fixed Fresh Search Version
 * Forces fresh API calls and proper state reset
 */

$(document).ready(function () {
    console.log('Weather App starting...');

    // Global application state
    window.WeatherApp = {
        currentAddress: '',
        currentCoordinates: null,
        currentWeatherData: null,
        isLoading: false,
        geocodeResults: [],
        lastSearchTerm: ''
    };

    // Initialize the application
    initializeApp();

    function initializeApp() {
        console.log('Initializing Weather App...');
        bindEventHandlers();
        setInitialButtonStates();
        console.log('Weather App initialized successfully');
    }

    function bindEventHandlers() {
        console.log('Binding event handlers...');

        // Address form submission
        $('#addressForm').off('submit').on('submit', function (e) {
            e.preventDefault();
            e.stopPropagation();
            handleAddressSubmit();
            return false;
        });

        // FIXED: Reset state when user starts typing new address
        $('#addressInput').off('input').on('input', function () {
            const currentInput = getAddressValue();

            // If user has cleared the input or changed it significantly
            if (currentInput.length < 3 || currentInput !== window.WeatherApp.lastSearchTerm) {
                resetAppState();
            }

            validateAddressInput();
        });

        // Prevent form submission when button is disabled
        $('#searchSubmitBtn').off('click').on('click', function (e) {
            if ($(this).prop('disabled')) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        });

        // Get Weather button
        $('#getWeatherBtn').off('click').on('click', function () {
            handleGetWeather();
        });

        // Save Search button
        $('#saveSearchBtn').off('click').on('click', function () {
            handleSaveSearch();
        });

        // Show History button
        $('#showHistoryBtn').off('click').on('click', function () {
            window.location.href = '/history';
        });

        // Enter key handling
        $('#addressInput').off('keypress').on('keypress', function (e) {
            if (e.which === 13) {
                e.preventDefault();
                const address = getAddressValue();
                if (address && address.length >= 3) {
                    handleAddressSubmit();
                } else {
                    showMessage('Please enter at least 3 characters', 'error');
                }
                return false;
            }
        });

        console.log('Event handlers bound');
    }

    // FIXED: Handle address form submission with complete state reset
    function handleAddressSubmit() {
        if (window.WeatherApp.isLoading) {
            console.log('Already loading, ignoring request');
            return;
        }

        const address = getAddressValue();
        if (!address || address.length < 3) {
            showMessage('Please enter a valid address (at least 3 characters)', 'error');
            return;
        }

        // FIXED: Force complete reset for every new search
        console.log('Starting completely fresh search for:', address);
        resetAppState();
        window.WeatherApp.lastSearchTerm = address;
        geocodeAddress(address);
    }

    // FIXED: Complete state reset
    function resetAppState() {
        console.log('Completely resetting application state');

        window.WeatherApp.currentAddress = '';
        window.WeatherApp.currentCoordinates = null;
        window.WeatherApp.currentWeatherData = null;
        window.WeatherApp.geocodeResults = [];

        // Reset UI
        disableWeatherButton();
        disableSaveButton();
        clearSearchResults();
    }

    // Get address value safely
    function getAddressValue() {
        try {
            const element = document.getElementById('addressInput');
            return element ? String(element.value || '').trim() : '';
        } catch (error) {
            console.error('Error getting address value:', error);
            return '';
        }
    }

    // FIXED: Geocode address with forced refresh
    function geocodeAddress(address) {
        console.log('Geocoding address with forced refresh:', address);

        window.WeatherApp.isLoading = true;
        updateButtonState('#searchSubmitBtn', true, '<i class="fas fa-spinner fa-spin"></i> Searching...');

        showSearchLoading('Searching for locations...');

        // FIXED: Force fresh API call by adding forceRefresh parameter
        const requestData = {
            address: address,
            forceRefresh: true,  // This bypasses cache
            timestamp: Date.now()  // Cache buster
        };

        $.ajax({
            url: '/api/geocode',
            method: 'POST',
            data: requestData,
            timeout: 15000,
            cache: false  // Prevent browser caching
        })
            .done(function (response) {
                console.log('Fresh geocoding successful:', response);
                handleGeocodeSuccess(address, response);
            })
            .fail(function (xhr, status, error) {
                console.error('Geocoding failed:', status, error);
                handleGeocodeError(xhr, status, error);
            })
            .always(function () {
                window.WeatherApp.isLoading = false;
                updateButtonState('#searchSubmitBtn', false, '<i class="fas fa-search"></i> Search');
            });
    }

    // Handle successful geocoding
    function handleGeocodeSuccess(address, response) {
        try {
            window.WeatherApp.geocodeResults = response.results || [];

            console.log(`Fresh search found ${window.WeatherApp.geocodeResults.length} location(s) for "${address}"`);
            console.log('Locations found:', window.WeatherApp.geocodeResults.map(r => r.formatted_address));

            if (window.WeatherApp.geocodeResults.length === 0) {
                showMessage('No locations found for that address', 'error');
                clearSearchResults();
            } else if (window.WeatherApp.geocodeResults.length === 1) {
                console.log('Single result - auto-selecting');
                selectLocation(window.WeatherApp.geocodeResults[0], address);
            } else {
                console.log('Multiple results - showing selection interface');
                displayLocationSelection(address, window.WeatherApp.geocodeResults);
            }

            console.log('Address search completed successfully');

        } catch (error) {
            console.error('Error handling geocode success:', error);
            showMessage('Error processing address data', 'error');
        }
    }

    // Display multiple location options for user selection
    function displayLocationSelection(searchAddress, results) {
        console.log('Displaying selection interface for', results.length, 'locations');

        let html = `
            <div class="card border-warning shadow-sm mb-3 slide-down">
                <div class="card-header bg-warning text-dark">
                    <h5 class="mb-0">
                        <i class="fas fa-map-marker-alt"></i> Choose Your Location
                        <span class="badge badge-dark ml-2">${results.length} found</span>
                    </h5>
                </div>
                <div class="card-body">
                    <p class="mb-3">
                        <strong>Found ${results.length} locations for "${searchAddress}".</strong> 
                        Please select the location you want weather information for:
                    </p>
                    <div class="location-options">
        `;

        results.forEach((result, index) => {
            const parts = result.formatted_address.split(',');
            const mainLocation = parts[0].trim();
            const subLocation = parts.slice(1).join(',').trim();

            // Flag selection
            let flagIcon = '🌍';
            if (result.country) {
                if (result.country.includes('United States')) flagIcon = '🇺🇸';
                else if (result.country.includes('France')) flagIcon = '🇫🇷';
                else if (result.country.includes('United Kingdom')) flagIcon = '🇬🇧';
                else if (result.country.includes('Canada')) flagIcon = '🇨🇦';
                else if (result.country.includes('Australia')) flagIcon = '🇦🇺';
                else if (result.country.includes('Germany')) flagIcon = '🇩🇪';
                else if (result.country.includes('Spain')) flagIcon = '🇪🇸';
                else if (result.country.includes('Italy')) flagIcon = '🇮🇹';
            }

            const relevancePercent = Math.round((result.relevance || 1) * 100);
            const relevanceBadge = relevancePercent > 90 ? 'success' :
                relevancePercent > 70 ? 'primary' : 'secondary';

            html += `
                <div class="location-option mb-3" data-index="${index}">
                    <div class="card border-light location-card h-100" style="cursor: pointer; transition: all 0.3s;" 
                         onclick="selectLocationFromList(${index})"
                         onmouseover="this.classList.add('border-primary', 'shadow')"
                         onmouseout="this.classList.remove('border-primary', 'shadow')">
                        <div class="card-body">
                            <div class="row align-items-center">
                                <div class="col-md-1 text-center">
                                    <span style="font-size: 2rem;">${flagIcon}</span>
                                </div>
                                <div class="col-md-7">
                                    <h6 class="mb-1 font-weight-bold text-dark">
                                        ${mainLocation}
                                    </h6>
                                    <p class="mb-1 text-muted">
                                        <i class="fas fa-map-pin text-danger"></i> ${subLocation}
                                    </p>
                                    <small class="text-info">
                                        <i class="fas fa-globe"></i> 
                                        ${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}
                                    </small>
                                </div>
                                <div class="col-md-4 text-right">
                                    <span class="badge badge-${relevanceBadge} mb-2 d-block">
                                        ${relevancePercent}% match
                                    </span>
                                    <button class="btn btn-outline-success btn-sm selection-btn">
                                        <i class="fas fa-check"></i> Select This Location
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
                    </div>
                    <div class="alert alert-info mt-3 mb-0">
                        <i class="fas fa-lightbulb"></i> 
                        <strong>Tip:</strong> Click on the location card to select it and get weather information.
                    </div>
                </div>
            </div>
        `;

        $('#searchResults').html(html);

        setTimeout(() => {
            $('html, body').animate({
                scrollTop: $('#searchResults').offset().top - 20
            }, 400);
        }, 100);
    }

    // Handle location selection from list
    window.selectLocationFromList = function (index) {
        console.log('User selected location at index:', index);

        if (window.WeatherApp.geocodeResults && window.WeatherApp.geocodeResults[index]) {
            const selectedResult = window.WeatherApp.geocodeResults[index];
            const originalAddress = window.WeatherApp.lastSearchTerm;

            console.log('Selected location:', selectedResult.formatted_address);

            // Visual feedback
            $(`.location-option[data-index="${index}"] .location-card`)
                .removeClass('border-light')
                .addClass('border-success bg-light');

            $('.location-option').not(`[data-index="${index}"]`).css('opacity', '0.5').css('pointer-events', 'none');

            $(`.location-option[data-index="${index}"] .selection-btn`).html('<i class="fas fa-spinner fa-spin"></i> Selected...');

            setTimeout(() => {
                selectLocation(selectedResult, originalAddress);
            }, 500);
        } else {
            console.error('Invalid location selection:', index);
        }
    };

    // Select a specific location
    function selectLocation(locationResult, originalAddress) {
        console.log('Selecting location:', locationResult.formatted_address);

        window.WeatherApp.currentAddress = locationResult.formatted_address;
        window.WeatherApp.currentCoordinates = {
            latitude: locationResult.latitude,
            longitude: locationResult.longitude
        };

        displaySelectedLocation(locationResult, originalAddress);
        enableWeatherButton();
        showMessage('Location selected successfully!', 'success');
    }

    // Display the selected location confirmation
    function displaySelectedLocation(locationResult, originalAddress) {
        const html = `
            <div class="card border-success shadow-sm mb-3 slide-down">
                <div class="card-header bg-success text-white">
                    <h5 class="mb-0">
                        <i class="fas fa-check-circle"></i> Location Selected!
                    </h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6 class="text-primary"><i class="fas fa-search"></i> Your Search</h6>
                            <p class="mb-2 text-muted">"${originalAddress}"</p>
                            
                            <h6 class="text-primary"><i class="fas fa-map-marker-alt"></i> Selected Location</h6>
                            <p class="mb-2 font-weight-bold">${locationResult.formatted_address}</p>
                        </div>
                        <div class="col-md-6">
                            <h6 class="text-primary"><i class="fas fa-globe"></i> Coordinates</h6>
                            <p class="mb-2">
                                <strong>Lat:</strong> ${Number(locationResult.latitude).toFixed(6)}<br>
                                <strong>Lng:</strong> ${Number(locationResult.longitude).toFixed(6)}
                            </p>
                        </div>
                    </div>
                    <div class="alert alert-info mb-0">
                        <i class="fas fa-arrow-down"></i> <strong>Next step:</strong> Click "Get Weather" button below to fetch weather data
                    </div>
                </div>
            </div>
        `;

        $('#searchResults').html(html);

        setTimeout(() => {
            $('html, body').animate({
                scrollTop: $('#searchResults').offset().top - 20
            }, 400);
        }, 100);
    }

    // Handle geocoding error
    function handleGeocodeError(xhr, status, error) {
        let errorMessage = 'Failed to find address';

        try {
            if (xhr.responseJSON && xhr.responseJSON.error) {
                errorMessage = xhr.responseJSON.error;
            } else if (status === 'timeout') {
                errorMessage = 'Address search timed out. Please try again.';
            } else if (status === 'error') {
                errorMessage = 'Network error. Please check your connection.';
            }
        } catch (e) {
            console.warn('Error parsing error response:', e);
        }

        showMessage(errorMessage, 'error');
        clearSearchResults();
    }

    // Handle get weather
    function handleGetWeather() {
        if (window.WeatherApp.isLoading) {
            console.log('Already loading, ignoring request');
            return;
        }

        if (!window.WeatherApp.currentCoordinates) {
            showMessage('Please search for an address first', 'error');
            return;
        }

        console.log('Getting weather for:', window.WeatherApp.currentCoordinates);

        window.WeatherApp.isLoading = true;
        updateButtonState('#getWeatherBtn', true, '<i class="fas fa-spinner fa-spin"></i> Loading Weather...');

        addWeatherLoading();

        const requestData = {
            latitude: window.WeatherApp.currentCoordinates.latitude,
            longitude: window.WeatherApp.currentCoordinates.longitude,
            address: window.WeatherApp.currentAddress
        };

        $.ajax({
            url: '/api/weather',
            method: 'POST',
            data: requestData,
            timeout: 15000
        })
            .done(function (response) {
                console.log('Weather data received:', response);
                handleWeatherSuccess(response);
            })
            .fail(function (xhr, status, error) {
                console.error('Weather fetch failed:', status, error);
                handleWeatherError(xhr, status, error);
            })
            .always(function () {
                window.WeatherApp.isLoading = false;
                updateButtonState('#getWeatherBtn', false, '<i class="fas fa-cloud-sun"></i> Get Weather');
                removeWeatherLoading();
            });
    }

    // Handle successful weather fetch
    function handleWeatherSuccess(weatherData) {
        try {
            window.WeatherApp.currentWeatherData = weatherData;
            addWeatherResult(weatherData);
            enableSaveButton();
            showMessage('Weather data loaded successfully!', 'success');
            console.log('Weather display completed successfully');
        } catch (error) {
            console.error('Error handling weather success:', error);
            showMessage('Error displaying weather data', 'error');
        }
    }

    // Handle weather error
    function handleWeatherError(xhr, status, error) {
        let errorMessage = 'Failed to fetch weather data';

        try {
            if (xhr.responseJSON && xhr.responseJSON.error) {
                errorMessage = xhr.responseJSON.error;
            } else if (status === 'timeout') {
                errorMessage = 'Weather request timed out. Please try again.';
            } else if (status === 'error') {
                errorMessage = 'Network error. Please check your connection.';
            }
        } catch (e) {
            console.warn('Error parsing weather error response:', e);
        }

        showMessage(errorMessage, 'error');
    }

    // Add weather result to existing content
    function addWeatherResult(weatherData) {
        try {
            const current = weatherData.current;
            const temp = Math.round(current.main.temp);
            const description = current.weather[0].description;
            const icon = current.weather[0].icon;
            const humidity = current.main.humidity;
            const windSpeed = current.wind.speed;
            const feelsLike = Math.round(current.main.feels_like);

            const weatherHtml = `
                <div class="card border-primary shadow-sm mb-3 slide-down">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0"><i class="fas fa-cloud-sun"></i> Current Weather</h5>
                    </div>
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-6">
                                <div class="d-flex align-items-center mb-3">
                                    <img src="https://openweathermap.org/img/w/${icon}.png" 
                                         alt="${description}" width="80" height="80" class="mr-3">
                                    <div>
                                        <h2 class="mb-1 text-primary">${temp}°C</h2>
                                        <p class="mb-0 text-muted text-capitalize">${description}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="weather-details">
                                    <div class="mb-2">
                                        <i class="fas fa-thermometer-half text-info"></i>
                                        <strong>Feels like:</strong> ${feelsLike}°C
                                    </div>
                                    <div class="mb-2">
                                        <i class="fas fa-eye text-info"></i>
                                        <strong>Humidity:</strong> ${humidity}%
                                    </div>
                                    <div class="mb-0">
                                        <i class="fas fa-wind text-info"></i>
                                        <strong>Wind Speed:</strong> ${windSpeed} m/s
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        ${createHourlyForecast(weatherData.hourly)}
                        
                        <div class="alert alert-warning mt-3 mb-0">
                            <i class="fas fa-arrow-down"></i> <strong>Next step:</strong> Click "Save to History" button below to store this search
                        </div>
                    </div>
                </div>
            `;

            $('#searchResults').append(weatherHtml);

            setTimeout(() => {
                $('html, body').animate({
                    scrollTop: $('#searchResults .card:last').offset().top - 20
                }, 400);
            }, 100);

        } catch (error) {
            console.error('Error creating weather display:', error);
            showMessage('Error displaying weather data', 'error');
        }
    }

    // Create hourly forecast
    function createHourlyForecast(hourlyData) {
        if (!Array.isArray(hourlyData) || hourlyData.length === 0) {
            return '<div class="alert alert-info mt-3">No hourly forecast available</div>';
        }

        let html = `
            <hr class="my-3">
            <h6 class="text-primary mb-3"><i class="fas fa-clock"></i> 12-Hour Forecast</h6>
            <div class="row">
        `;

        for (let i = 0; i < Math.min(12, hourlyData.length); i++) {
            const hour = hourlyData[i];
            const time = new Date(hour.dt * 1000);
            const temp = Math.round(hour.temp);
            const icon = hour.weather[0].icon;
            const desc = hour.weather[0].description;

            html += `
                <div class="col-lg-2 col-md-3 col-sm-4 col-6 mb-2">
                    <div class="card text-center h-100" style="border: 1px solid #ddd;">
                        <div class="card-body p-2">
                            <small class="text-muted d-block mb-1">
                                ${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </small>
                            <img src="https://openweathermap.org/img/w/${icon}.png" 
                                 alt="${desc}" width="32" height="32" class="mb-1">
                            <div class="font-weight-bold">${temp}°C</div>
                            <small class="text-muted">${desc}</small>
                        </div>
                    </div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    // Handle save search (same as before)
    function handleSaveSearch() {
        if (window.WeatherApp.isLoading) {
            console.log('Already loading, ignoring request');
            return;
        }

        if (!window.WeatherApp.currentWeatherData) {
            showMessage('No weather data to save', 'error');
            return;
        }

        console.log('Saving search to database...');

        window.WeatherApp.isLoading = true;
        updateButtonState('#saveSearchBtn', true, '<i class="fas fa-spinner fa-spin"></i> Saving...');

        const saveData = {
            address: window.WeatherApp.currentAddress,
            latitude: window.WeatherApp.currentCoordinates.latitude,
            longitude: window.WeatherApp.currentCoordinates.longitude,
            current_weather: window.WeatherApp.currentWeatherData.current,
            hourly_forecast: window.WeatherApp.currentWeatherData.hourly || []
        };

        $.ajax({
            url: '/api/store-search',
            method: 'POST',
            data: saveData,
            timeout: 15000
        })
            .done(function (response) {
                console.log('Search saved successfully:', response);
                handleSaveSuccess();
            })
            .fail(function (xhr, status, error) {
                console.error('Save failed:', status, error);
                handleSaveError(xhr, status, error);
            })
            .always(function () {
                window.WeatherApp.isLoading = false;
            });
    }

    function handleSaveSuccess() {
        updateButtonState('#saveSearchBtn', false, '<i class="fas fa-check"></i> Saved!');
        $('#saveSearchBtn').removeClass('btn-warning btn-secondary').addClass('btn-success');
        showMessage('Weather search saved to history successfully!', 'success');

        setTimeout(() => {
            updateButtonState('#saveSearchBtn', false, '<i class="fas fa-save"></i> Save to History');
            $('#saveSearchBtn').removeClass('btn-success').addClass('btn-warning');
        }, 3000);

        console.log('Save operation completed successfully');
    }

    function handleSaveError(xhr, status, error) {
        let errorMessage = 'Failed to save search';

        try {
            if (xhr.responseJSON && xhr.responseJSON.error) {
                errorMessage = xhr.responseJSON.error;
            } else if (status === 'timeout') {
                errorMessage = 'Save request timed out. Please try again.';
            }
        } catch (e) {
            console.warn('Error parsing save error response:', e);
        }

        showMessage(errorMessage, 'error');
        updateButtonState('#saveSearchBtn', false, '<i class="fas fa-save"></i> Save to History');
    }

    // Utility functions
    function validateAddressInput() {
        try {
            const address = getAddressValue();
            const isValid = address.length >= 3;
            updateButtonState('#searchSubmitBtn', !isValid, null);
        } catch (error) {
            console.error('Address validation error:', error);
        }
    }

    function setInitialButtonStates() {
        disableWeatherButton();
        disableSaveButton();
        validateAddressInput();
    }

    function enableWeatherButton() {
        updateButtonState('#getWeatherBtn', false, null);
        $('#getWeatherBtn').removeClass('btn-secondary').addClass('btn-success');
    }

    function disableWeatherButton() {
        updateButtonState('#getWeatherBtn', true, null);
        $('#getWeatherBtn').removeClass('btn-success').addClass('btn-secondary');
    }

    function enableSaveButton() {
        updateButtonState('#saveSearchBtn', false, null);
        $('#saveSearchBtn').removeClass('btn-secondary').addClass('btn-warning');
    }

    function disableSaveButton() {
        updateButtonState('#saveSearchBtn', true, null);
        $('#saveSearchBtn').removeClass('btn-warning').addClass('btn-secondary');
    }

    function updateButtonState(selector, disabled, text) {
        try {
            const $button = $(selector);
            if ($button.length) {
                $button.prop('disabled', disabled);
                if (text !== null) {
                    $button.html(text);
                }
            }
        } catch (error) {
            console.warn('Button update error:', error);
        }
    }

    function showSearchLoading(message) {
        const html = `
            <div class="alert alert-info text-center slide-down" id="searchLoading">
                <i class="fas fa-spinner fa-spin"></i> ${message}
            </div>
        `;
        $('#searchResults').html(html);
    }

    function addWeatherLoading() {
        const html = `
            <div class="alert alert-info text-center slide-down" id="weatherLoading">
                <i class="fas fa-spinner fa-spin"></i> 🌤️ Fetching weather data...
            </div>
        `;
        $('#searchResults').append(html);
    }

    function removeWeatherLoading() {
        $('#weatherLoading').remove();
    }

    function clearSearchResults() {
        $('#searchResults').empty();
    }

    function showMessage(message, type) {
        const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';

        const html = `
            <div class="alert ${alertClass} alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 9999; min-width: 300px; max-width: 500px;">
                <i class="fas ${icon}"></i> ${message}
                <button type="button" class="close" data-dismiss="alert">
                    <span>&times;</span>
                </button>
            </div>
        `;

        $('.alert-dismissible.position-fixed').remove();
        $('body').append(html);
        setTimeout(() => $('.alert-dismissible.position-fixed').alert('close'), 4000);

        console.log(`${type.toUpperCase()}: ${message}`);
    }

    console.log('🎉 Weather App ready!');
});