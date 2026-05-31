import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Pencil, X, Check, AlertCircle, Droplets, Wind, Thermometer, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { getWeather, updateCity, getAdvice } from "@/services/weather";
import type { WeatherData, WeatherForecastDay, WeatherAdvice } from "shared";

const WEATHER_EMOJI: Record<string, string> = {
  晴: "☀️",
  多云: "⛅",
  少云: "🌤️",
  晴间多云: "🌤️",
  阴: "☁️",
  有风: "💨",
  平静: "💨",
  微风: "💨",
  和风: "💨",
  清风: "💨",
  强风: "💨",
  疾风: "💨",
  大风: "💨",
  烈风: "💨",
  风暴: "💨",
  飓风: "💨",
  龙卷风: "💨",
  热带风暴: "💨",
  阵雨: "🌧️",
  雷阵雨: "⛈️",
  雷阵雨伴有冰雹: "⛈️",
  小雨: "🌧️",
  中雨: "🌧️",
  大雨: "🌧️",
  暴雨: "🌧️",
  大暴雨: "🌧️",
  特大暴雨: "🌧️",
  强阵雨: "🌧️",
  极端降雨: "🌧️",
  毛毛雨: "🌧️",
  雨: "🌧️",
  小雪: "🌨️",
  中雪: "🌨️",
  大雪: "❄️",
  暴雪: "❄️",
  雨夹雪: "🌨️",
  雨雪天气: "🌨️",
  阵雪: "🌨️",
  雪: "❄️",
  雾: "🌥️",
  轻雾: "🌥️",
  大雾: "🌥️",
  浓雾: "🌥️",
  霾: "🌥️",
  中度霾: "🌥️",
  重度霾: "🌥️",
  严重霾: "🌥️",
  浮尘: "🌥️",
  扬沙: "🌥️",
  沙尘暴: "🌥️",
  强沙尘暴: "🌥️",
};

function getWeatherEmoji(text: string): string {
  if (WEATHER_EMOJI[text]) return WEATHER_EMOJI[text];
  for (const [key, emoji] of Object.entries(WEATHER_EMOJI)) {
    if (text.includes(key)) return emoji;
  }
  return "🌤️";
}

function formatForecastDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diff === 0) return "今天";
  if (diff === 1) return "明天";
  if (diff === 2) return "后天";
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return weekdays[d.getDay()];
}

function getAdviceLevel(text: string): "good" | "caution" | "warning" {
  const warningKeywords = ["不宜", "避免", "注意", "危险", "较差", "不适宜"];
  const cautionKeywords = ["较适宜", "一般", "可能", "小心", "谨慎", "减少"];
  for (const kw of warningKeywords) {
    if (text.includes(kw)) return "warning";
  }
  for (const kw of cautionKeywords) {
    if (text.includes(kw)) return "caution";
  }
  return "good";
}

const ADVICE_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  good: { bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-700 dark:text-green-400", dot: "bg-green-500" },
  caution: { bg: "bg-yellow-50 dark:bg-yellow-950/30", text: "text-yellow-700 dark:text-yellow-400", dot: "bg-yellow-500" },
  warning: { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
};

function CurrentWeatherCard({ data }: { data: WeatherData }) {
  const [editing, setEditing] = useState(false);
  const [cityInput, setCityInput] = useState(data.city);
  const queryClient = useQueryClient();

  const cityMutation = useMutation({
    mutationFn: updateCity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weather"] });
      queryClient.invalidateQueries({ queryKey: ["weather-advice"] });
      setEditing(false);
    },
  });

  const handleCitySubmit = () => {
    const trimmed = cityInput.trim();
    if (trimmed && trimmed !== data.city) {
      cityMutation.mutate(trimmed);
    } else {
      setEditing(false);
    }
  };

  const handleCityKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCitySubmit();
    if (e.key === "Escape") {
      setCityInput(data.city);
      setEditing(false);
    }
  };

  const { current } = data;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <span className="text-6xl leading-none">{getWeatherEmoji(current.text)}</span>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold text-card-foreground">{current.temp}</span>
              <span className="text-2xl text-muted-foreground">°C</span>
            </div>
            <p className="mt-1 text-lg text-muted-foreground">{current.text}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4" />
            <span>体感 {current.feelsLike}°C</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4" />
            <span>湿度 {current.humidity}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4" />
            <span>{current.windDir} {current.windSpeed}km/h</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={handleCityKeyDown}
              autoFocus
              className="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleCitySubmit}
              disabled={cityMutation.isPending}
              className="rounded-md p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setCityInput(data.city);
                setEditing(false);
              }}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-card-foreground">{data.city}</span>
            <button
              onClick={() => {
                setCityInput(data.city);
                setEditing(true);
              }}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ForecastSection({ forecast }: { forecast: WeatherForecastDay[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-4 font-semibold text-card-foreground">5日预报</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {forecast.slice(0, 5).map((day) => (
          <div
            key={day.date}
            className="flex min-w-[120px] flex-shrink-0 flex-col items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3"
          >
            <span className="text-sm font-medium text-card-foreground">
              {formatForecastDate(day.date)}
            </span>
            <span className="text-2xl">{getWeatherEmoji(day.textDay)}</span>
            <span className="text-xs text-muted-foreground">{day.textDay}</span>
            <div className="flex items-center gap-1 text-sm">
              <span className="font-semibold text-card-foreground">{day.tempMax}°</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{day.tempMin}°</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Droplets className="h-3 w-3" />
              <span>{day.humidity}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TemperatureChart({ forecast }: { forecast: WeatherForecastDay[] }) {
  const data = forecast.slice(0, 5).map((day) => ({
    date: formatForecastDate(day.date),
    最高温: day.tempMax,
    最低温: day.tempMin,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-4 font-semibold text-card-foreground">温度趋势</h3>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">暂无数据</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="highGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" unit="°" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(var(--card-foreground))" }}
            />
            <Area
              type="monotone"
              dataKey="最高温"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#highGrad)"
              dot={{ r: 4, fill: "#ef4444" }}
              activeDot={{ r: 6 }}
            />
            <Area
              type="monotone"
              dataKey="最低温"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#lowGrad)"
              dot={{ r: 4, fill: "#3b82f6" }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function AdviceSection({ advice }: { advice: WeatherAdvice }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-4 font-semibold text-card-foreground">🚶‍♂️ 出行提醒</h3>
        {advice.travelAdvice.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">暂无出行建议</p>
        ) : (
          <div className="space-y-2">
            {advice.travelAdvice.map((item, i) => {
              const level = getAdviceLevel(item);
              const style = ADVICE_STYLES[level];
              return (
                <div
                  key={i}
                  className={cn("flex items-start gap-3 rounded-lg px-3 py-2.5", style.bg)}
                >
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", style.dot)} />
                  <span className={cn("text-sm", style.text)}>{item}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-4 font-semibold text-card-foreground">👕 洗衣提醒</h3>
        {advice.laundryAdvice.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">暂无洗衣建议</p>
        ) : (
          <div className="space-y-2">
            {advice.laundryAdvice.map((item, i) => {
              const level = getAdviceLevel(item);
              const style = ADVICE_STYLES[level];
              return (
                <div
                  key={i}
                  className={cn("flex items-start gap-3 rounded-lg px-3 py-2.5", style.bg)}
                >
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", style.dot)} />
                  <span className={cn("text-sm", style.text)}>{item}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-10 w-24 rounded bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-muted" />
          <div className="h-4 w-28 rounded bg-muted" />
          <div className="h-4 w-28 rounded bg-muted" />
        </div>
      </div>
      <div className="mt-4 border-t border-border pt-4">
        <div className="h-4 w-20 rounded bg-muted" />
      </div>
    </div>
  );
}

function SkeletonForecast() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 h-5 w-20 rounded bg-muted" />
      <div className="flex gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex min-w-[120px] flex-col items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3"
          >
            <div className="h-4 w-10 rounded bg-muted" />
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="h-3 w-12 rounded bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 h-5 w-20 rounded bg-muted" />
      <div className="h-60 rounded bg-muted" />
    </div>
  );
}

function SkeletonAdvice() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 h-5 w-24 rounded bg-muted" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-8 rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function WeatherPage() {
  const {
    data: weather,
    isLoading: weatherLoading,
    error: weatherError,
  } = useQuery({
    queryKey: ["weather"],
    queryFn: getWeather,
    refetchInterval: 30 * 60 * 1000,
  });

  const { data: advice, isLoading: adviceLoading } = useQuery({
    queryKey: ["weather-advice"],
    queryFn: getAdvice,
    refetchInterval: 30 * 60 * 1000,
  });

  if (weatherError) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">天气</h2>
          <p className="mt-1 text-sm text-muted-foreground">查看天气与出行建议</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <p className="mt-2 text-sm text-muted-foreground">加载失败，请重试</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">天气</h2>
        <p className="mt-1 text-sm text-muted-foreground">查看天气与出行建议</p>
      </div>

      {weatherLoading ? (
        <>
          <SkeletonCard />
          <SkeletonForecast />
          <SkeletonChart />
          <SkeletonAdvice />
        </>
      ) : weather ? (
        <>
          <CurrentWeatherCard data={weather} />
          <ForecastSection forecast={weather.forecast} />
          <TemperatureChart forecast={weather.forecast} />
          {adviceLoading ? (
            <SkeletonAdvice />
          ) : advice ? (
            <AdviceSection advice={advice} />
          ) : null}
          {weather.updatedAt && (
            <p className="text-center text-xs text-muted-foreground">
              最后更新：{new Date(weather.updatedAt).toLocaleString("zh-CN")}
            </p>
          )}
        </>
      ) : null}
    </div>
  );
}
