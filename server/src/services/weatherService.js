const axios = require('axios');

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Get weather forecast for a specific date and location
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} location - City name
 * @returns {Promise<Object>} Weather data
 */
exports.getWeatherForecast = async (date, location) => {
  try {
    if (!WEATHER_API_KEY) {
      throw new Error('Weather API key not configured');
    }

    // Calculate days until booking date
    const bookingDate = new Date(date);
    const today = new Date();
    const daysUntil = Math.floor((bookingDate - today) / (1000 * 60 * 60 * 24));

    let weatherData;

    // If booking is today or within 5 days, use forecast API
    if (daysUntil >= 0 && daysUntil <= 5) {
      weatherData = await getForecastWeather(location, daysUntil);
    } else {
      // For dates beyond 5 days or past dates, use current weather as approximation
      weatherData = await getCurrentWeather(location);
      weatherData.note = daysUntil > 5
        ? 'Long-term forecast - showing typical weather for this location'
        : 'Past date - showing current weather conditions';
    }

    return weatherData;
  } catch (error) {
    console.error('Weather API Error:', error.message);
    throw new Error('Failed to fetch weather data');
  }
};

/**
 * Get current weather
 */
async function getCurrentWeather(location) {
  try {
    const response = await axios.get(`${WEATHER_API_URL}/weather`, {
      params: {
        q: location,
        appid: WEATHER_API_KEY,
        units: 'metric'
      }
    });

    const data = response.data;

    // Log the complete API response
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📡 OPENWEATHERMAP API RESPONSE (Current Weather)');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(JSON.stringify(data, null, 2));
    console.log('═══════════════════════════════════════════════════════════\n');

    return {
      location: data.name,
      country: data.sys.country,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      condition: data.weather[0].main,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      icon: data.weather[0].icon,
      timestamp: new Date(data.dt * 1000).toISOString()
    };
  } catch (error) {
    throw new Error(`Weather API error: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Get forecast weather for specific day
 */
async function getForecastWeather(location, daysAhead) {
  try {
    const response = await axios.get(`${WEATHER_API_URL}/forecast`, {
      params: {
        q: location,
        appid: WEATHER_API_KEY,
        units: 'metric'
      }
    });

    // Forecast API returns 3-hour intervals for 5 days
    // Find the forecast closest to noon on the target day
    const forecasts = response.data.list;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);
    targetDate.setHours(12, 0, 0, 0);

    let closestForecast = forecasts[0];
    let minDiff = Math.abs(new Date(forecasts[0].dt * 1000) - targetDate);

    // Log the complete forecast API response
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📡 OPENWEATHERMAP API RESPONSE (Forecast Weather)');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Request: ', `${WEATHER_API_URL}/forecast?q=${location}`);
    console.log('Full Response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('═══════════════════════════════════════════════════════════\n');

    for (const forecast of forecasts) {
      const forecastDate = new Date(forecast.dt * 1000);
      const diff = Math.abs(forecastDate - targetDate);

      if (diff < minDiff) {
        minDiff = diff;
        closestForecast = forecast;
      }
    }

    return {
      location: response.data.city.name,
      country: response.data.city.country,
      temperature: Math.round(closestForecast.main.temp),
      feelsLike: Math.round(closestForecast.main.feels_like),
      condition: closestForecast.weather[0].main,
      description: closestForecast.weather[0].description,
      humidity: closestForecast.main.humidity,
      windSpeed: closestForecast.wind.speed,
      icon: closestForecast.weather[0].icon,
      timestamp: new Date(closestForecast.dt * 1000).toISOString(),
      forecastDate: new Date(closestForecast.dt * 1000).toLocaleDateString()
    };
  } catch (error) {
    throw new Error(`Forecast API error: ${error.response?.data?.message || error.message}`);
  }
}
