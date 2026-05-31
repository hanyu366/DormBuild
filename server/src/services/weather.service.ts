import axios from 'axios'
import { prisma } from '../lib/prisma.js'

interface WeatherCurrent {
  temp: number
  text: string
  humidity: number
  windSpeed: number
  rainChance: number
}

interface WeatherForecast {
  rainChance24h: number
  rainChance48h: number
  sunny48h: boolean
  maxTemp: number
  minTemp: number
  avgHumidity: number
  maxWind: number
}

export async function fetchWeather(city: string, dormId: string) {
  const apiKey = process.env.QWEATHER_API_KEY
  const baseUrl = process.env.QWEATHER_BASE_URL || 'https://devapi.qweather.com/v7'

  try {
    const lookupRes = await axios.get(`${baseUrl}/city/lookup`, {
      params: { location: city, key: apiKey },
    })

    const locationId = lookupRes.data?.location?.[0]?.id
    if (!locationId) throw new Error('城市未找到')

    const [currentRes, forecastRes] = await Promise.all([
      axios.get(`${baseUrl}/weather/now`, {
        params: { location: locationId, key: apiKey },
      }),
      axios.get(`${baseUrl}/weather/3d`, {
        params: { location: locationId, key: apiKey },
      }),
    ])

    const currentData = currentRes.data?.now
    const forecastData = forecastRes.data?.daily

    const current: WeatherCurrent = {
      temp: Number(currentData?.temp || 0),
      text: currentData?.text || '未知',
      humidity: Number(currentData?.humidity || 0),
      windSpeed: Number(currentData?.windSpeed || 0),
      rainChance: 0,
    }

    const forecast: WeatherForecast = {
      rainChance24h: 0,
      rainChance48h: 0,
      sunny48h: true,
      maxTemp: 0,
      minTemp: 100,
      avgHumidity: 0,
      maxWind: 0,
    }

    if (forecastData && forecastData.length > 0) {
      const today = forecastData[0]
      current.rainChance = Number(today.precip || 0) > 0 ? 60 : 10

      forecast.rainChance24h = Number(forecastData[0]?.precip || 0) > 0 ? 70 : 20
      forecast.rainChance48h =
        forecastData.slice(0, 2).some((d: any) => Number(d.precip || 0) > 0) ? 60 : 15
      forecast.sunny48h = forecastData
        .slice(0, 2)
        .every((d: any) => d.textDay?.includes('晴') || d.textDay?.includes('多云'))
      forecast.maxTemp = Math.max(...forecastData.slice(0, 3).map((d: any) => Number(d.tempMax || 0)))
      forecast.minTemp = Math.min(...forecastData.slice(0, 3).map((d: any) => Number(d.tempMin || 0)))
      forecast.avgHumidity = Math.round(
        forecastData.slice(0, 3).reduce((s: number, d: any) => s + Number(d.humidity || 0), 0) /
          Math.min(forecastData.length, 3)
      )
      forecast.maxWind = Math.max(
        ...forecastData.slice(0, 3).map((d: any) => Number(d.windSpeedDay || 0))
      )
    }

    const cache = await prisma.weatherCache.upsert({
      where: { dormId },
      update: {
        city,
        current: JSON.stringify(current),
        forecast: JSON.stringify(forecast),
      },
      create: {
        dormId,
        city,
        current: JSON.stringify(current),
        forecast: JSON.stringify(forecast),
      },
    })

    return { current, forecast, updatedAt: cache.updatedAt }
  } catch (error: any) {
    throw new Error(`获取天气数据失败: ${error.message}`)
  }
}

export function generateAdvice(current: WeatherCurrent, forecast: WeatherForecast) {
  const travel: string[] = []
  const laundry: string[] = []

  if (current.rainChance > 60 || forecast.rainChance24h > 50) {
    travel.push('🌧️ 记得带伞，近期有降雨')
  }
  if (current.temp > 35) {
    travel.push('🌡️ 高温预警，注意防暑降温')
  }
  if (current.temp < 0) {
    travel.push('❄️ 气温极低，注意保暖')
  }
  if (current.windSpeed > 6 || forecast.maxWind > 6) {
    travel.push('💨 风力较大，外出注意安全')
  }
  if (travel.length === 0) {
    travel.push('✅ 天气适宜，适合外出')
  }

  if (forecast.rainChance24h > 50) {
    laundry.push('🚫 24小时内有降雨，不建议晾晒')
  }
  if (forecast.sunny48h && forecast.rainChance48h < 30) {
    laundry.push('✅ 未来48小时晴好，适合晾晒衣物')
  }
  if (forecast.avgHumidity > 80) {
    laundry.push('💧 湿度较高，衣物不易干燥')
  }
  if (laundry.length === 0) {
    laundry.push('👕 可以正常晾晒衣物')
  }

  return { travel, laundry }
}

export async function refreshAllDorms() {
  const dorms = await prisma.dorm.findMany()
  for (const dorm of dorms) {
    try {
      await fetchWeather(dorm.city, dorm.id)
    } catch (e) {
      console.error(`刷新宿舍 ${dorm.id} 天气失败:`, e)
    }
  }
}
