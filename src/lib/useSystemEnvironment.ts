import { useState, useEffect, useCallback, useRef } from "react";
import { SystemEnvironment, SystemLocation, SystemWeather, SystemDeviceStats } from "../types";

// WMO Weather code interpretations
const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: "Clear Sky",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing Rime Fog",
  51: "Light Drizzle",
  53: "Moderate Drizzle",
  55: "Dense Drizzle",
  61: "Slight Rain",
  63: "Moderate Rain",
  65: "Heavy Rain",
  71: "Slight Snow",
  73: "Moderate Snow",
  75: "Heavy Snow",
  77: "Snow Grains",
  80: "Slight Rain Showers",
  81: "Moderate Rain Showers",
  82: "Violent Rain Showers",
  85: "Slight Snow Showers",
  86: "Heavy Snow Showers",
  95: "Thunderstorm",
  96: "Thunderstorm with Slight Hail",
  99: "Thunderstorm with Heavy Hail",
};

export function useSystemEnvironment() {
  const [is24Hour, setIs24Hour] = useState<boolean>(() => {
    try {
      return localStorage.getItem("jarvis_time_format_24h") === "true";
    } catch {
      return false;
    }
  });

  const [tempUnit, setTempUnit] = useState<"C" | "F">(() => {
    try {
      return (localStorage.getItem("jarvis_temp_unit") as "C" | "F") || "C";
    } catch {
      return "C";
    }
  });

  const [now, setNow] = useState<Date>(new Date());

  const [location, setLocation] = useState<SystemLocation>(() => {
    try {
      const saved = localStorage.getItem("jarvis_saved_location_v1");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      city: "Detecting...",
      region: "",
      country: "",
      latitude: null,
      longitude: null,
      status: "locating",
      source: "default",
    };
  });

  const [weather, setWeather] = useState<SystemWeather | undefined>(() => {
    try {
      const saved = localStorage.getItem("jarvis_saved_weather_v1");
      if (saved) return JSON.parse(saved);
    } catch {}
    return undefined;
  });

  const [deviceStats, setDeviceStats] = useState<SystemDeviceStats>(() => {
    const isClient = typeof window !== "undefined";
    return {
      batteryLevel: 100,
      isCharging: true,
      online: isClient ? navigator.onLine : true,
      networkType: "High-Speed Matrix",
      screenResolution: isClient ? `${window.screen?.width || 1920}x${window.screen?.height || 1080}` : "1920x1080",
      platform: isClient ? (navigator.userAgent.includes("Windows") ? "Windows 11 (Arc Protocol)" : navigator.userAgent.includes("Mac") ? "macOS Sovereign" : "Linux / Android") : "Universal OS",
      language: isClient ? navigator.language || "en-US" : "en-US",
    };
  });

  // Keep live time ticking every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to network status & battery changes
  useEffect(() => {
    const handleOnline = () => setDeviceStats((prev) => ({ ...prev, online: true }));
    const handleOffline = () => setDeviceStats((prev) => ({ ...prev, online: false }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    let batteryInstance: any = null;
    const updateBattery = () => {
      if (batteryInstance) {
        setDeviceStats((prev) => ({
          ...prev,
          batteryLevel: Math.round(batteryInstance.level * 100),
          isCharging: batteryInstance.charging,
        }));
      }
    };

    if ("getBattery" in navigator) {
      (navigator as any).getBattery().then((b: any) => {
        batteryInstance = b;
        updateBattery();
        b.addEventListener("levelchange", updateBattery);
        b.addEventListener("chargingchange", updateBattery);
      }).catch(() => {});
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (batteryInstance) {
        batteryInstance.removeEventListener("levelchange", updateBattery);
        batteryInstance.removeEventListener("chargingchange", updateBattery);
      }
    };
  }, []);

  // Fetch Weather for coordinates using Open-Meteo
  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&temperature_unit=celsius`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather request failed");
      const data = await res.json();
      const current = data.current;
      if (current) {
        const weatherObj: SystemWeather = {
          temperature: Math.round(current.temperature_2m * 10) / 10,
          temperatureUnit: "C",
          weatherCode: current.weather_code,
          description: WEATHER_DESCRIPTIONS[current.weather_code] || "Fair Skies",
          humidity: current.relative_humidity_2m ?? 50,
          windSpeed: Math.round(current.wind_speed_10m * 10) / 10,
          isDay: Boolean(current.is_day),
          status: "success",
        };
        setWeather(weatherObj);
        try {
          localStorage.setItem("jarvis_saved_weather_v1", JSON.stringify(weatherObj));
        } catch {}
      }
    } catch (e) {
      console.warn("Weather fetch notice:", e);
      setWeather((prev) => (prev ? { ...prev, status: "unavailable" } : undefined));
    }
  }, []);

  // Reverse Geocoding helper (High-Precision Backend Proxy & OSM Fallback)
  const reverseGeocode = useCallback(async (lat: number, lon: number) => {
    try {
      let data: any = null;
      // 1. Try server-side reverse geocoding proxy first (guaranteed no CORS, full address details)
      try {
        const proxyRes = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}`);
        if (proxyRes.ok) {
          data = await proxyRes.json();
        }
      } catch {}

      // 2. Direct fallback
      if (!data) {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        if (res.ok) {
          data = await res.json();
        }
      }

      if (data) {
        const address = data.address || {};
        const local = address.suburb || address.village || address.neighbourhood || address.hamlet || address.town || address.city || "";
        const district = address.state_district || address.county || address.district || "";
        const state = address.state || address.region || "";
        const country = address.country || "India";
        const countryCode = (address.country_code || "IN").toUpperCase();
        const pin = address.postcode ? ` (${address.postcode})` : "";

        let preciseCity = local;
        if (district && district !== local) {
          preciseCity = local ? `${local}, ${district}` : district;
        }
        if (!preciseCity) preciseCity = "Current GPS Coordinates";
        if (pin) preciseCity += pin;

        const loc: SystemLocation = {
          city: preciseCity,
          region: state,
          country,
          countryCode,
          latitude: lat,
          longitude: lon,
          accuracy: null,
          status: "granted",
          source: "gps",
        };
        setLocation(loc);
        try {
          localStorage.setItem("jarvis_saved_location_v1", JSON.stringify(loc));
        } catch {}
        return loc;
      }
    } catch (e) {
      console.warn("Reverse geocode notice:", e);
    }
    return null;
  }, []);

  // IP fallback location detection (using ipwho.is)
  const fetchIpLocation = useCallback(async () => {
    try {
      const res = await fetch("https://ipwho.is/");
      if (res.ok) {
        const data = await res.json();
        if (data.success !== false) {
          const loc: SystemLocation = {
            city: data.city || "Urban Node",
            region: data.region || "",
            country: data.country || "Earth",
            countryCode: data.country_code || "",
            latitude: typeof data.latitude === "number" ? data.latitude : null,
            longitude: typeof data.longitude === "number" ? data.longitude : null,
            status: "fallback",
            source: "ip",
          };
          setLocation(loc);
          try {
            localStorage.setItem("jarvis_saved_location_v1", JSON.stringify(loc));
          } catch {}
          if (loc.latitude !== null && loc.longitude !== null) {
            fetchWeather(loc.latitude, loc.longitude);
          }
          return loc;
        }
      }
    } catch (e) {
      console.warn("IP Geolocation notice:", e);
    }
    return null;
  }, [fetchWeather]);

  // Request high-precision GPS or fallback to IP
  const locateUser = useCallback(async () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      await fetchIpLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);

        // Attempt reverse geocoding
        const rev = await reverseGeocode(lat, lon);
        if (rev) {
          setLocation((prev) => ({ ...prev, accuracy }));
        } else {
          // If geocode failed, set coordinates directly
          const loc: SystemLocation = {
            city: "Current GPS Position",
            region: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
            country: "",
            latitude: lat,
            longitude: lon,
            accuracy,
            status: "granted",
            source: "gps",
          };
          setLocation(loc);
        }
        fetchWeather(lat, lon);
      },
      async (err) => {
        console.warn("Browser GPS permission:", err.message);
        await fetchIpLocation();
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [fetchIpLocation, fetchWeather, reverseGeocode]);

  // Auto-run location detection on mount
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      locateUser();
    }
  }, [locateUser]);

  // Format Time & Date strings
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: !is24Hour,
  });

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const currentTime = timeFormatter.format(now);
  const currentDate = dateFormatter.format(now);
  const dayOfWeek = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(now);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  // Calculate GMT/UTC offset string, e.g. "GMT-07:00"
  const offsetMinutes = -now.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
  const offsetRemainderMins = Math.abs(offsetMinutes) % 60;
  const timeZoneOffset = `GMT${offsetMinutes >= 0 ? "+" : "-"}${String(offsetHours).padStart(2, "0")}:${String(offsetRemainderMins).padStart(2, "0")}`;

  const toggle24Hour = () => {
    setIs24Hour((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("jarvis_time_format_24h", String(next));
      } catch {}
      return next;
    });
  };

  const toggleTempUnit = () => {
    setTempUnit((prev) => {
      const next = prev === "C" ? "F" : "C";
      try {
        localStorage.setItem("jarvis_temp_unit", next);
      } catch {}
      return next;
    });
  };

  // Convert displayed temp based on unit
  const displayTemperature = weather
    ? tempUnit === "C"
      ? `${weather.temperature}°C`
      : `${Math.round((weather.temperature * 9) / 5 + 32)}°F`
    : null;

  const systemEnvironment: SystemEnvironment = {
    currentTime,
    currentDate,
    dayOfWeek,
    timeZone,
    timeZoneOffset,
    timestamp: now.getTime(),
    isoString: now.toISOString(),
    is24Hour,
    location,
    weather: weather ? { ...weather, temperatureUnit: tempUnit } : undefined,
    device: deviceStats,
  };

  // Generates a concise prompt injection string for J.A.R.V.I.S.
  const getSystemContextPrompt = useCallback(() => {
    const locStr = location.city
      ? `${location.city}${location.region ? `, ${location.region}` : ""}${location.country ? `, ${location.country}` : ""}`
      : "Detected Coordinates";
    const coordsStr = location.latitude !== null && location.longitude !== null
      ? `(Latitude: ${location.latitude.toFixed(4)}, Longitude: ${location.longitude.toFixed(4)})`
      : "";
    const weatherStr = weather
      ? `${weather.temperature}°C (${Math.round((weather.temperature * 9) / 5 + 32)}°F), ${weather.description}, Humidity: ${weather.humidity}%, Wind: ${weather.windSpeed} km/h`
      : "Standard Room Atmosphere";
    const battStr = deviceStats.batteryLevel !== null
      ? `${deviceStats.batteryLevel}% (${deviceStats.isCharging ? "Charging" : "Battery Powered"})`
      : "Arc Reactor Power 100%";

    return `[LIVE SYSTEM TELEMETRY, TIME, DATE & LOCATION CONTEXT]\n` +
      `• Current System Time: ${currentTime} (${timeZoneOffset}, ${timeZone})\n` +
      `• Full Date: ${currentDate} (${dayOfWeek})\n` +
      `• Current Location: ${locStr} ${coordsStr}\n` +
      `• Live Weather & Atmosphere: ${weatherStr}\n` +
      `• System Hardware & Network: ${battStr}, Network: ${deviceStats.online ? "ONLINE" : "OFFLINE"}, Screen: ${deviceStats.screenResolution}, Platform: ${deviceStats.platform}\n` +
      `[OPERATIONAL INSTRUCTION: You have real-time awareness of the user's exact system time, current date, day, coordinates, city, weather, and battery telemetry. When asked questions like "what time is it?", "what is today's date?", "where am I?", "what is the weather?", or in Tamil/Tanglish ("mani enna?", "inniku enna date?", "naan enga irukken?", "weather eppadi irukku?"), respond with 100% precision using these live parameters.]\n`;
  }, [currentTime, currentDate, dayOfWeek, timeZone, timeZoneOffset, location, weather, deviceStats]);

  return {
    systemEnvironment,
    currentTime,
    currentDate,
    dayOfWeek,
    timeZone,
    timeZoneOffset,
    timestamp: now.getTime(),
    is24Hour,
    toggle24Hour,
    tempUnit,
    toggleTempUnit,
    displayTemperature,
    location,
    weather,
    deviceStats,
    locateUser,
    getSystemContextPrompt,
  };
}
