import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Wind, Droplets, Sun, Cloud, CloudRain, CloudLightning, Snowflake, Navigation, Star, Trash2, X, Plus } from 'lucide-react';
import { fetchWeather, searchLocation, type WeatherData } from './services/weatherService';

interface FavoriteLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

const WeatherIcon = ({ condition, className }: { condition: string; className?: string }) => {
  const c = condition.toLowerCase();
  if (c.includes('limpo')) return <Sun className={className} />;
  if (c.includes('nublado')) return <Cloud className={className} />;
  if (c.includes('chuva')) return <CloudRain className={className} />;
  if (c.includes('trovoada')) return <CloudLightning className={className} />;
  if (c.includes('neve')) return <Snowflake className={className} />;
  return <Cloud className={className} />;
};

export default function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lon: number; name: string } | null>(null);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('weather_favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('weather_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const loadWeather = useCallback(async (lat: number, lon: number, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWeather(lat, lon, name);
      setWeather(data);
      setCurrentCoords({ lat, lon, name });
    } catch (err) {
      setError('Erro ao carregar clima. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const defaultLat = -23.5505;
    const defaultLon = -46.6333;
    const defaultName = 'São Paulo';

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          loadWeather(position.coords.latitude, position.coords.longitude, "Sua Localização");
        },
        () => {
          loadWeather(defaultLat, defaultLon, defaultName);
        }
      );
    } else {
      loadWeather(defaultLat, defaultLon, defaultName);
    }
  }, [loadWeather]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const loc = await searchLocation(query);
      await loadWeather(loc.latitude, loc.longitude, `${loc.name}, ${loc.country}`);
      setQuery('');
    } catch (err) {
      setError('Localização não encontrada.');
      setLoading(false);
    }
  };

  const toggleFavorite = () => {
    if (!currentCoords || !weather) return;
    
    const isFav = favorites.some(f => f.lat === currentCoords.lat && f.lon === currentCoords.lon);
    
    if (isFav) {
      setFavorites(favorites.filter(f => !(f.lat === currentCoords.lat && f.lon === currentCoords.lon)));
    } else {
      const newFav: FavoriteLocation = {
        id: `${currentCoords.lat}-${currentCoords.lon}`,
        name: weather.location,
        lat: currentCoords.lat,
        lon: currentCoords.lon
      };
      setFavorites([...favorites, newFav]);
    }
  };

  const removeFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(favorites.filter(f => f.id !== id));
  };

  const getBackground = () => {
    if (!weather) return 'from-slate-900 to-slate-800';
    const condition = weather.current.condition.toLowerCase();
    const isDay = weather.current.isDay;

    if (!isDay) return 'from-indigo-950 via-slate-900 to-black';
    if (condition.includes('limpo')) return 'from-blue-400 via-blue-500 to-blue-600';
    if (condition.includes('nublado')) return 'from-slate-400 via-slate-500 to-slate-600';
    if (condition.includes('chuva')) return 'from-blue-700 via-slate-700 to-slate-800';
    if (condition.includes('trovoada')) return 'from-slate-800 via-purple-900 to-black';
    return 'from-blue-500 to-blue-700';
  };

  const isCurrentFavorite = currentCoords && favorites.some(f => f.lat === currentCoords.lat && f.lon === currentCoords.lon);

  return (
    <main className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-1000 bg-gradient-to-br ${getBackground()} text-white font-sans overflow-hidden relative`}>
      
      {/* Header with Search and Favorites Toggle */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-4 mb-8 z-20">
        <motion.form 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onSubmit={handleSearch}
          className="flex-1 relative"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cidade..."
            className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-4 px-6 pr-12 outline-none focus:ring-2 focus:ring-white/30 transition-all placeholder:text-white/50"
          />
          <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors">
            <Search size={20} />
          </button>
        </motion.form>

        <motion.button
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={() => setShowFavorites(!showFavorites)}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4 flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
        >
          <Star size={20} className={favorites.length > 0 ? "fill-yellow-400 text-yellow-400" : ""} />
          <span className="font-medium">Favoritos ({favorites.length})</span>
        </motion.button>
      </div>

      {/* Favorites Sidebar/Drawer */}
      <AnimatePresence>
        {showFavorites && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFavorites(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-xs bg-slate-900/90 backdrop-blur-xl border-l border-white/10 z-50 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Star size={20} className="fill-yellow-400 text-yellow-400" />
                  Favoritos
                </h3>
                <button onClick={() => setShowFavorites(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-120px)] pr-2">
                {favorites.length === 0 ? (
                  <div className="text-center py-12 opacity-50">
                    <Star size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Nenhum local salvo ainda.</p>
                  </div>
                ) : (
                  favorites.map((fav) => (
                    <motion.div
                      key={fav.id}
                      layout
                      onClick={() => {
                        loadWeather(fav.lat, fav.lon, fav.name);
                        setShowFavorites(false);
                      }}
                      className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin size={16} className="text-white/50" />
                        <span className="font-medium truncate max-w-[150px]">{fav.name}</span>
                      </div>
                      <button 
                        onClick={(e) => removeFavorite(e, fav.id)}
                        className="p-2 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-white/70 font-medium">Carregando clima...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-red-500/20 backdrop-blur-md border border-red-500/30 p-6 rounded-2xl text-center"
          >
            <p className="font-medium">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-sm underline opacity-70 hover:opacity-100">Tentar novamente</button>
          </motion.div>
        ) : weather && (
          <motion.div
            key="content"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Main Weather Card */}
            <div className="flex flex-col items-center md:items-start justify-center text-center md:text-left">
              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-2 text-white/70">
                  <MapPin size={18} />
                  <h2 className="text-xl font-medium tracking-tight">{weather.location}</h2>
                </div>
                <button 
                  onClick={toggleFavorite}
                  className={`p-2 rounded-full transition-all ${isCurrentFavorite ? 'bg-yellow-400/20 text-yellow-400' : 'bg-white/10 text-white/50 hover:text-white'}`}
                >
                  <Star size={20} className={isCurrentFavorite ? "fill-yellow-400" : ""} />
                </button>
              </div>
              
              <div className="flex items-center gap-6 my-4">
                <WeatherIcon condition={weather.current.condition} className="w-24 h-24 md:w-32 md:h-32 drop-shadow-2xl" />
                <div className="flex flex-col">
                  <span className="text-7xl md:text-9xl font-bold tracking-tighter">{weather.current.temp}°</span>
                  <span className="text-xl md:text-2xl font-light opacity-80">{weather.current.condition}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full mt-8">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl"><Wind size={20} /></div>
                  <div>
                    <p className="text-xs opacity-60 uppercase font-bold tracking-wider">Vento</p>
                    <p className="font-medium">{weather.current.windSpeed} km/h</p>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl"><Droplets size={20} /></div>
                  <div>
                    <p className="text-xs opacity-60 uppercase font-bold tracking-wider">Humidade</p>
                    <p className="font-medium">{weather.current.humidity}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Forecast Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Navigation size={18} className="rotate-45" />
                Previsão para 7 dias
              </h3>
              <div className="space-y-4">
                {weather.daily.map((day, i) => (
                  <div key={day.date} className="flex items-center justify-between group">
                    <span className="w-20 text-sm font-medium opacity-70">
                      {i === 0 ? 'Hoje' : new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </span>
                    <div className="flex items-center gap-3 flex-1 px-4">
                      <WeatherIcon condition={day.condition} className="w-6 h-6" />
                      <span className="text-xs opacity-50 hidden sm:inline">{day.condition}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="font-bold">{day.maxTemp}°</span>
                      <span className="opacity-40">{day.minTemp}°</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
    </main>
  );
}
