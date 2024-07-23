async function getWeatherData() {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Bois-Guillaume&appid=1fc26e02b94a0282e3bdac0f1ed41dd3&units=metric`);
        const data = await response.json();
        console.log("Weather Data:", data);

        return {
            temperature: Math.round(data.main.temp),
            tempMin: data.main.temp_min,
            tempMax: data.main.temp_max,
            humidity: data.main.humidity,
            icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
        };
    } catch (error) {
        console.error("Error fetching weather data:", error);
        return null;
    }
}

async function batimentData(EUI) {
    try {
        const response = await fetch(`/ApiAfficheurdynimac/sensors/${EUI}/last`);
        const data = await response.json();
        console.log("Batiment Data:", data);

        if (!data || data.length === 0) {
            console.log(`No data found for collection: ${EUI}`);
            return null; // Return null if no data found
        }

        return data[0]; // Return the first item in the data array

    } catch (error) {
        console.error('Error fetching batiment data:', error);
        return null; // Return null in case of error
    }
}

function updateWeatherData(data) {
    if (data) {
        (document.querySelector('.Weather-temperature') ?? {}).textContent = `${data.temperature}`;
        (document.querySelector('.Weather-tempMax') ?? {}).textContent = `${data.tempMax}`;
        (document.querySelector('.Weather-tempMin') ?? {}).textContent = `${data.tempMin}`;
        (document.querySelector('.Weather-humidity') ?? {}).textContent = `${data.humidity}`;
    }
}

function updateBatimentData(data) {
    if (data) {
        (document.querySelector('.batiment-co2') ?? {}).textContent = `${data.co2}`;
        (document.querySelector('.batiment-battery') ?? {}).textContent = `${data.battery}`;
        (document.querySelector('.batiment-humidity') ?? {}).textContent = `${data.humidity}`;
        (document.querySelector('.batiment-temperature') ?? {}).textContent = `${data.temperature}`;
    }
}

async function fetchDataAndUpdateUI() {
    const weatherData = await getWeatherData();
    console.log("Weather Data (Updated):", weatherData);
    updateWeatherData(weatherData);

    const batimentDataValue = await batimentData("24e124725c378643");
    console.log("Batiment Data (Updated):", batimentDataValue);
    updateBatimentData(batimentDataValue);
}

// Fetch data and update the UI every 10 seconds
setInterval(fetchDataAndUpdateUI, 10000);

// Initial fetch
fetchDataAndUpdateUI();
