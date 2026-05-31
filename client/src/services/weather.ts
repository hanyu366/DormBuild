import api from "@/services/api";
import type { WeatherData, WeatherAdvice } from "shared";

export function getWeather(): Promise<WeatherData> {
  return api.get("/weather").then((r) => r.data);
}

export function updateCity(city: string): Promise<void> {
  return api.put("/weather/city", { city }).then((r) => r.data);
}

export function getAdvice(): Promise<WeatherAdvice> {
  return api.get("/weather/advice").then((r) => r.data);
}
