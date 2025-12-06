/**
 * Weather Controller
 * 
 * Handles weather-related API endpoints for the voice agent.
 * Integrates with OpenWeatherMap API to provide weather forecasts
 * and seating recommendations based on weather conditions.
 * 
 * Features:
 * - Fetch weather forecast for specific date and location
 * - Generate intelligent seating suggestions (indoor/outdoor)
 * - Temperature-based recommendations
 * - Weather condition analysis (clear, rain, snow, etc.)
 * 
 * Dependencies:
 * - weatherService: Handles external API calls to OpenWeatherMap
 * 
 * @module controllers/weatherController
 */

const weatherService = require('../services/weatherService');

/**
 * Get Weather Forecast
 * 
 * Fetches weather data for a specific date and location,
 * then generates a seating recommendation based on conditions.
 * 
 * @async
 * @function getWeather
 * @param {Object} req - Express request object
 * @param {string} [req.query.date] - Date in YYYY-MM-DD format
 * @param {string} [req.query.location] - City name (defaults to Hyderabad)
 * @param {string} [req.query.time] - Booking time for logging purposes
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} JSON response with weather data and seating suggestion
 * 
 * @route GET /api/weather
 * @access Public
 * 
 * @example
 * GET /api/weather?date=2025-12-15&location=Mumbai&time=19:00
 */
exports.getWeather = async (req, res, next) => {
  try {
    const { date, location } = req.query;

    // Use default location if not provided
    const searchLocation = location || process.env.DEFAULT_LOCATION || 'Hyderabad';
    const time = req.query.time || 'not specified';

    console.log(`🌤️ Fetching weather for ${searchLocation} on ${date} at ${time}`);

    // Get weather data
    const weatherData = await weatherService.getWeatherForecast(date, searchLocation);

    // Generate seating suggestion based on weather
    const seatingSuggestion = generateSeatingSuggestion(weatherData);

    res.status(200).json({
      success: true,
      data: {
        weather: weatherData,
        seatingSuggestion,
        fetchedFrom: 'OpenWeatherMap API',
        location: searchLocation
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch weather data'
    });
  }
};

/**
 * Generate Seating Suggestion
 * 
 * Analyzes weather conditions and generates an intelligent
 * recommendation for indoor or outdoor seating.
 * 
 * Logic:
 * - Clear/Sunny + 20-30°C → Outdoor seating
 * - Clear/Sunny + >30°C → Indoor (too hot)
 * - Clear/Sunny + <20°C → Indoor (too cold)
 * - Rain/Drizzle/Thunderstorm → Indoor (weather protection)
 * - Cloudy → Indoor (safer choice)
 * - Snow → Indoor (warmth)
 * - Other conditions → Indoor (default safe choice)
 * 
 * @function generateSeatingSuggestion
 * @param {Object} weather - Weather data object
 * @param {string} weather.condition - Weather condition (Clear, Rain, etc.)
 * @param {number} weather.temperature - Temperature in Celsius
 * @param {string} weather.description - Detailed weather description
 * @returns {Object} Suggestion object with preference and message
 * 
 * @example
 * generateSeatingSuggestion({
 *   condition: 'Clear',
 *   temperature: 25,
 *   description: 'clear sky'
 * })
 * // Returns: { preference: 'Outdoor', message: '...' }
 */
function generateSeatingSuggestion(weather) {
  const { condition, temperature, description } = weather;

  // Default to indoor seating for safety
  let suggestion = {
    preference: 'Indoor',
    message: ''
  };

  // Analyze weather condition and temperature
  if (condition === 'Clear' || condition === 'Sunny') {
    if (temperature >= 20 && temperature <= 30) {
      suggestion.preference = 'Outdoor';
      suggestion.message = `Perfect weather for outdoor dining! It's ${temperature}°C with ${description}.`;
    } else if (temperature > 30) {
      suggestion.preference = 'Indoor';
      suggestion.message = `It's quite warm at ${temperature}°C. I'd recommend our air-conditioned indoor seating.`;
    } else {
      suggestion.preference = 'Indoor';
      suggestion.message = `It's a bit cool at ${temperature}°C. Indoor seating would be more comfortable.`;
    }
  } else if (condition.includes('Rain') || condition.includes('Drizzle') || condition.includes('Thunderstorm')) {
    suggestion.preference = 'Indoor';
    suggestion.message = `Looks like ${description} on your booking date. I'd strongly recommend our cozy indoor area.`;
  } else if (condition.includes('Cloud')) {
    suggestion.preference = 'Indoor';
    suggestion.message = `Weather forecast shows ${description}. Indoor seating would be a safe choice!`;
  } else if (condition.includes('Snow')) {
    suggestion.preference = 'Indoor';
    suggestion.message = `It's going to be snowy! Our warm indoor seating is perfect for this weather.`;
  } else {
    suggestion.preference = 'Indoor';
    suggestion.message = `Based on the forecast (${description}), indoor seating is recommended.`;
  }

  return suggestion;
}
