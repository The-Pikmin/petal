/**
 * Weather data interface
 */
export interface WeatherData {
	temperature: number; // in Fahrenheit
	location: string;
	condition: string; // e.g., "Sunny", "Cloudy", "Rainy"
	icon: string; // Weather emoji
	humidity?: number;
	windSpeed?: number;
}

/**
 * Service for fetching weather data
 * Uses Open-Meteo API (free, no API key required)
 */
export class WeatherService {
	/**
	 * Get current weather based on user's location
	 */
	static async getCurrentWeather(): Promise<WeatherData> {
		try {
			// Get user's location
			const location = await this.getUserLocation();

			// Fetch weather data from Open-Meteo API
			const weatherResponse = await fetch(
				`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit`
			);

			if (!weatherResponse.ok) {
				throw new Error("Failed to fetch weather data");
			}

			const weatherData = await weatherResponse.json();

			// Fetch location name (Reverse Geocoding)
			// Using BigDataCloud's free client-side reverse geocoding API
			// No API key required for client-side requests
			let locationName = "Current Location";
			try {
				const geoResponse = await fetch(
					`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.latitude}&longitude=${location.longitude}&localityLanguage=en`
				);
				if (geoResponse.ok) {
					const geoData = await geoResponse.json();
					// Construct location string: "City, State" or "City, Country"
					const city = geoData.city || geoData.locality || "";
					const region =
						geoData.principalSubdivisionCode || geoData.principalSubdivision || "";

					if (city && region) {
						locationName = `${city}, ${region}`;
					} else if (city) {
						locationName = city;
					} else if (geoData.countryName) {
						locationName = geoData.countryName;
					}
				}
			} catch (geoError) {
				console.warn("Reverse geocoding failed:", geoError);
				// Fallback to "Current Location" is already set
			}

			return {
				temperature: Math.round(weatherData.current.temperature_2m),
				location: locationName,
				condition: this.getWeatherCondition(weatherData.current.weather_code),
				icon: this.getWeatherIcon(weatherData.current.weather_code),
				humidity: weatherData.current.relative_humidity_2m,
				windSpeed: weatherData.current.wind_speed_10m,
			};
		} catch (error) {
			console.error("Weather fetch error:", error);
			// Return default/fallback data
			return this.getFallbackWeather();
		}
	}

	/**
	 * Get user's geolocation using Capacitor Geolocation
	 * Works on both web and native platforms
	 */
	private static async getUserLocation(): Promise<{ latitude: number; longitude: number }> {
		try {
			// Dynamically import to avoid issues when running on server
			const { Geolocation } = await import("@capacitor/geolocation");

			// Request permissions and get position
			const position = await Geolocation.getCurrentPosition({
				enableHighAccuracy: false,
				timeout: 10000,
			});

			return {
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
			};
		} catch (error) {
			console.warn("Geolocation error:", error);
			// Default to San Francisco
			return { latitude: 37.7749, longitude: -122.4194 };
		}
	}

	/**
	 * Convert WMO weather code to readable condition
	 * https://open-meteo.com/en/docs
	 */
	private static getWeatherCondition(code: number): string {
		const conditions: { [key: number]: string } = {
			0: "Clear",
			1: "Mainly Clear",
			2: "Partly Cloudy",
			3: "Overcast",
			45: "Foggy",
			48: "Foggy",
			51: "Light Drizzle",
			53: "Drizzle",
			55: "Heavy Drizzle",
			61: "Light Rain",
			63: "Rain",
			65: "Heavy Rain",
			71: "Light Snow",
			73: "Snow",
			75: "Heavy Snow",
			77: "Snow Grains",
			80: "Light Showers",
			81: "Showers",
			82: "Heavy Showers",
			85: "Light Snow Showers",
			86: "Snow Showers",
			95: "Thunderstorm",
			96: "Thunderstorm with Hail",
			99: "Thunderstorm with Hail",
		};

		return conditions[code] || "Unknown";
	}

	/**
	 * Get weather icon emoji based on WMO code
	 */
	private static getWeatherIcon(code: number): string {
		if (code === 0 || code === 1) return "☀️";
		if (code === 2) return "⛅";
		if (code === 3) return "☁️";
		if (code === 45 || code === 48) return "🌫️";
		if (code >= 51 && code <= 55) return "🌦️";
		if (code >= 61 && code <= 65) return "🌧️";
		if (code >= 71 && code <= 77) return "❄️";
		if (code >= 80 && code <= 82) return "🌧️";
		if (code >= 85 && code <= 86) return "🌨️";
		if (code >= 95) return "⛈️";
		return "🌤️";
	}

	/**
	 * Fallback weather data when API fails
	 */
	private static getFallbackWeather(): WeatherData {
		return {
			temperature: 72,
			location: "Current Location",
			condition: "Partly Cloudy",
			icon: "⛅",
			humidity: 65,
			windSpeed: 10,
		};
	}
}
