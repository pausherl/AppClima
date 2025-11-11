// ==================== CONFIGURACIÓN ====================

// 
const API_KEY = '68fdfd57bfe43b890070d027dc898945';
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// ==================== ELEMENTOS DEL DOM ====================

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const themeToggle = document.getElementById('themeToggle');
const unitSelect = document.getElementById('unitSelect');
const currentWeatherDiv = document.getElementById('currentWeather');
const forecastSectionDiv = document.getElementById('forecastSection');
const forecastContainer = document.getElementById('forecastContainer');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');

// ==================== VARIABLES GLOBALES ====================

let currentUnit = 'metric'; // 'metric' para Celsius, 'imperial' para Fahrenheit
let currentWeatherData = null;
let forecastData = null;

// ==================== FUNCIONES DE UTILIDAD ====================

/**
 * Muestra el loading
 */
function showLoading() {
    loadingDiv.classList.add('active');
    errorDiv.classList.remove('active');
    currentWeatherDiv.classList.remove('active');
    forecastSectionDiv.classList.remove('active');
}

/**
 * Oculta el loading
 */
function hideLoading() {
    loadingDiv.classList.remove('active');
}

/**
 * Muestra un error
 * @param {string} message - Mensaje de error
 */
function showError(message) {
    hideLoading();
    errorDiv.textContent = `❌ ${message}`;
    errorDiv.classList.add('active');
    currentWeatherDiv.classList.remove('active');
    forecastSectionDiv.classList.remove('active');
}

/**
 * Obtiene el símbolo de grado según la unidad
 * @returns {string} °C o °F
 */
function getDegreeSymbol() {
    return currentUnit === 'metric' ? '°C' : '°F';
}

/**
 * Obtiene el ícono de OpenWeather
 * @param {string} iconCode - Código del ícono (ej: "01d")
 * @returns {string} URL del ícono
 */
function getWeatherIcon(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
}

/**
 * Convierte timestamp a hora legible
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Hora formateada
 */
function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Convierte timestamp a fecha legible
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Fecha formateada
 */
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('es-ES', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    });
}

// ==================== FUNCIONES DE API ====================

/**
 * Busca el clima actual de una ciudad
 * @param {string} city - Nombre de la ciudad
 */
async function fetchCurrentWeather(city) {
    try {
        showLoading();
        
        const response = await fetch(
            `${API_BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=${currentUnit}&lang=es`
        );

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Ciudad no encontrada. Verifica el nombre e intenta de nuevo.');
            }
            throw new Error('Error al obtener datos del clima');
        }

        const data = await response.json();
        currentWeatherData = data;
        
        // Obtener pronóstico
        await fetchForecast(data.coord.lat, data.coord.lon);
        
        hideLoading();
        renderCurrentWeather(data);
        
    } catch (error) {
        showError(error.message);
    }
}

/**
 * Obtiene el pronóstico de 5 días
 * @param {number} lat - Latitud
 * @param {number} lon - Longitud
 */
async function fetchForecast(lat, lon) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}&lang=es`
        );

        if (!response.ok) {
            throw new Error('Error al obtener el pronóstico');
        }

        const data = await response.json();
        forecastData = data;
        renderForecast(data);

    } catch (error) {
        console.error('Error en pronóstico:', error);
    }
}

/**
 * Obtiene el clima por coordenadas (para geolocalización)
 * @param {number} lat - Latitud
 * @param {number} lon - Longitud
 */
async function fetchWeatherByCoords(lat, lon) {
    try {
        showLoading();
        
        const response = await fetch(
            `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}&lang=es`
        );

        if (!response.ok) {
            throw new Error('Error al obtener datos del clima');
        }

        const data = await response.json();
        currentWeatherData = data;
        
        await fetchForecast(lat, lon);
        
        hideLoading();
        renderCurrentWeather(data);

    } catch (error) {
        showError(error.message);
    }
}

// ==================== FUNCIONES DE RENDERIZADO ====================

/**
 * Renderiza el clima actual en el HTML
 * @param {object} data - Datos del clima actual
 */
function renderCurrentWeather(data) {
    const { main, weather, wind, clouds, sys, name, coord } = data;
    const temp = Math.round(main.temp);
    const tempMin = Math.round(main.temp_min);
    const tempMax = Math.round(main.temp_max);
    const description = weather[0].description;
    const icon = weather[0].icon;
    const sunrise = formatTime(sys.sunrise);
    const sunset = formatTime(sys.sunset);
    const windUnit = currentUnit === 'metric' ? 'm/s' : 'mph';

    const html = `
        <div class="weather-header">
            <div class="location-info">
                <h2>${name}, ${data.sys.country}</h2>
                <p>Lat: ${coord.lat.toFixed(2)}° | Lon: ${coord.lon.toFixed(2)}°</p>
                <p id="lastUpdate">Actualizado hace un momento</p>
            </div>
            <img class="weather-icon" src="${getWeatherIcon(icon)}" alt="${description}">
        </div>

        <div class="weather-main">
            <div class="weather-item">
                <div class="weather-item-label">Temperatura Actual</div>
                <div class="weather-item-value">${temp}${getDegreeSymbol()}</div>
            </div>
            <div class="weather-item">
                <div class="weather-item-label">Sensación Térmica</div>
                <div class="weather-item-value">${Math.round(main.feels_like)}${getDegreeSymbol()}</div>
            </div>
            <div class="weather-item">
                <div class="weather-item-label">Mín - Máx</div>
                <div class="weather-item-value">${tempMin}° / ${tempMax}°</div>
            </div>
            <div class="weather-item">
                <div class="weather-item-label">Humedad</div>
                <div class="weather-item-value">${main.humidity}%</div>
            </div>
        </div>

        <div class="weather-details">
            <div class="detail-item">
                <i class="fas fa-cloud"></i>
                <div class="detail-text">
                    <div class="detail-label">Condición</div>
                    <div class="detail-value">${description}</div>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-wind"></i>
                <div class="detail-text">
                    <div class="detail-label">Viento</div>
                    <div class="detail-value">${wind.speed} ${windUnit}</div>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-eye"></i>
                <div class="detail-text">
                    <div class="detail-label">Visibilidad</div>
                    <div class="detail-value">${(data.visibility / 1000).toFixed(1)} km</div>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-compress"></i>
                <div class="detail-text">
                    <div class="detail-label">Presión</div>
                    <div class="detail-value">${main.pressure} hPa</div>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-droplets"></i>
                <div class="detail-text">
                    <div class="detail-label">Nubosidad</div>
                    <div class="detail-value">${clouds.all}%</div>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-sun"></i>
                <div class="detail-text">
                    <div class="detail-label">Amanecer</div>
                    <div class="detail-value">${sunrise}</div>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-moon"></i>
                <div class="detail-text">
                    <div class="detail-label">Atardecer</div>
                    <div class="detail-value">${sunset}</div>
                </div>
            </div>
            <div class="detail-item">
                <i class="fas fa-gauge"></i>
                <div class="detail-text">
                    <div class="detail-label">Índice UV</div>
                    <div class="detail-value">${data.uvi ? Math.round(data.uvi) : 'N/A'}</div>
                </div>
            </div>
        </div>
    `;

    currentWeatherDiv.innerHTML = html;
    currentWeatherDiv.classList.add('active');
    updateLastUpdate();
    
    // Actualizar cada minuto
    setInterval(updateLastUpdate, 60000);
}

/**
 * Actualiza el texto "Actualizado hace..."
 */
function updateLastUpdate() {
    const element = document.getElementById('lastUpdate');
    if (element) {
        element.textContent = 'Actualizado hace un momento';
    }
}

/**
 * Renderiza el pronóstico de 5 días
 * @param {object} data - Datos del pronóstico
 */
function renderForecast(data) {
    const forecasts = data.list;
    const dailyForecasts = {};

    // Agrupar por día (tomar el pronóstico del mediodía)
    forecasts.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const dayKey = date.toLocaleDateString();
        
        // Tomar el pronóstico más cercano al mediodía (12:00)
        if (!dailyForecasts[dayKey] || Math.abs(date.getHours() - 12) < Math.abs(new Date(dailyForecasts[dayKey].dt * 1000).getHours() - 12)) {
            dailyForecasts[dayKey] = forecast;
        }
    });

    // Convertir a array y tomar 5 días
    const foreccastArray = Object.values(dailyForecasts).slice(0, 5);

    let html = '';
    foreccastArray.forEach(forecast => {
        const temp = Math.round(forecast.main.temp);
        const tempMax = Math.round(forecast.main.temp_max);
        const tempMin = Math.round(forecast.main.temp_min);
        const description = forecast.weather[0].description;
        const icon = forecast.weather[0].icon;
        const date = formatDate(forecast.dt);

        html += `
            <div class="forecast-card">
                <div class="forecast-date">${date}</div>
                <img class="forecast-icon" src="${getWeatherIcon(icon)}" alt="${description}">
                <div class="forecast-temp">${temp}${getDegreeSymbol()}</div>
                <div class="forecast-temp-range">
                    <strong>${tempMax}°</strong> / <span>${tempMin}°</span>
                </div>
                <div class="forecast-description">${description}</div>
            </div>
        `;
    });

    forecastContainer.innerHTML = html;
    forecastSectionDiv.classList.add('active');
}

// ==================== EVENT LISTENERS ====================

/**
 * Buscar cuando se hace clic en el botón o se presiona Enter
 */
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        fetchCurrentWeather(city);
        cityInput.value = '';
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

/**
 * Toggle Dark/Light Mode
 */
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    
    // Guardar preferencia en localStorage
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Cambiar ícono
    const icon = themeToggle.querySelector('i');
    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
});

/**
 * Cambiar unidad de temperatura
 */
unitSelect.addEventListener('change', (e) => {
    currentUnit = e.target.value;
    
    // Si hay datos, volver a renderizar
    if (currentWeatherData) {
        fetchCurrentWeather(currentWeatherData.name);
    }
});

// ==================== INICIALIZACIÓN ====================

/**
 * Función de inicio
 */
function init() {
    // Verificar si hay API key
    if (API_KEY === 'TU_API_KEY_AQUI') {
        showError('⚠️ Por favor, reemplaza "TU_API_KEY_AQUI" con tu API key de OpenWeather en script.js');
        return;
    }

    // Cargar tema guardado
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.querySelector('i').className = 'fas fa-sun';
    }

    // Geolocalización (opcional)
    if (navigator.geolocation) {
        // Intentar obtener ubicación automáticamente
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            (error) => {
                console.log('Geolocalización no disponible, usa el buscador');
            }
        );
    }

    // Buscar "San José, Costa Rica" por defecto como demo
    // Descomenta la siguiente línea si quieres que cargue una ciudad por defecto
    // fetchCurrentWeather('San José, Costa Rica');
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);