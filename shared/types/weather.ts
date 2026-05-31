export interface WeatherCurrent {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDir: string;
  text: string;
  icon: string;
}

export interface WeatherForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  textDay: string;
  textNight: string;
  iconDay: string;
  iconNight: string;
  humidity: number;
  precip: number;
  windSpeedDay: string;
}

export interface WeatherAdvice {
  travelAdvice: string[];
  laundryAdvice: string[];
}

export interface WeatherData {
  city: string;
  current: WeatherCurrent;
  forecast: WeatherForecastDay[];
  advice: WeatherAdvice;
  updatedAt: string;
}
