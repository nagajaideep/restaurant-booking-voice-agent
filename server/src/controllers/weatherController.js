const weatherService = require('../services/weatherService');

/**
 * @desc    Get weather forecast for a specific date and location
 * @route   GET /api/weather?date=YYYY-MM-DD&location=CityName
 * @access  Public
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
 * Generate seating suggestion based on weather conditions
 */
function generateSeatingSuggestion(weather) {
  const { condition, temperature, description } = weather;

  let suggestion = {
    preference: 'Indoor',
    message: ''
  };

  // Check weather condition
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
