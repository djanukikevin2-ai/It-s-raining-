export interface WeatherData {
  current: {
    temp: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    isDay: boolean;
  };
  daily: {
    date: string;
    maxTemp: number;
    minTemp: number;
    condition: string;
  }[];
  location: string;
}

export const getConditionFromCode = (code: number): string => {
  if (code === 0) return "Céu limpo";
  if (code >= 1 && code <= 3) return "Parcialmente nublado";
  if (code >= 45 && code <= 48) return "Nevoeiro";
  if (code >= 51 && code <= 55) return "Drizzle";
  if (code >= 61 && code <= 65) return "Chuva";
  if (code >= 71 && code <= 75) return "Neve";
  if (code >= 80 && code <= 82) return "Pancadas de chuva";
  if (code >= 95) return "Trovoada";
  return "Desconhecido";
};

export async function fetchWeather(lat: number, lon: number, locationName: string): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error("Falha ao buscar dados meteorológicos");
  
  const data = await response.json();
  
  return {
    current: {
      temp: Math.round(data.current.temperature_2m),
      condition: getConditionFromCode(data.current.weather_code),
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      isDay: data.current.is_day === 1,
    },
    daily: data.daily.time.map((time: string, i: number) => ({
      date: time,
      maxTemp: Math.round(data.daily.temperature_2m_max[i]),
      minTemp: Math.round(data.daily.temperature_2m_min[i]),
      condition: getConditionFromCode(data.daily.weather_code[i]),
    })),
    location: locationName,
  };
}

export async function searchLocation(query: string) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=pt&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Falha ao buscar localização");
  const data = await response.json();
  if (!data.results || data.results.length === 0) throw new Error("Localização não encontrada");
  return data.results[0];
}
