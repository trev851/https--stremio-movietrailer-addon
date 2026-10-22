# 🎬 Snakeeyes Movie Trailer Addon

A Stremio addon that lets you browse movie catalogs and watch official trailers — play inside Stremio or open directly on YouTube.

---

## 📦 Install in Stremio

Click the link below or paste the manifest URL into Stremio's addon search:

**[Install Addon](stremio://https-stremio-movietrailer-addon.onrender.com/manifest.json)**

Or paste this into Stremio → Addons → Search:
```
https://https-stremio-movietrailer-addon.onrender.com/manifest.json
```

---

## 📋 Manifest

```json
{
  "id": "community.snakeeyes.trailers",
  "version": "1.0.0",
  "name": "🎬 Snakeeyes Trailers",
  "description": "Watch movie trailers — Now Playing, Coming Soon, Popular and New Releases.",
  "logo": "https://via.placeholder.com/150",
  "resources": ["catalog", "meta", "stream"],
  "types": ["movie"],
  "idPrefixes": ["tt", "tmdb:"],
  "catalogs": [
    { "type": "movie", "id": "trailers-nowplaying", "name": "🎬 Now Playing in Theaters" },
    { "type": "movie", "id": "trailers-upcoming",   "name": "🔜 Coming Soon" },
    { "type": "movie", "id": "trailers-popular",    "name": "🔥 Popular Movies" },
    { "type": "movie", "id": "trailers-newrelease", "name": "⭐ New Releases" },
    { "type": "movie", "id": "trailers-toprated",   "name": "🏆 Top Rated" },
    { "type": "movie", "id": "trailers-action",     "name": "💥 Action Trailers" },
    { "type": "movie", "id": "trailers-horror",     "name": "👻 Horror Trailers" },
    { "type": "movie", "id": "trailers-scifi",      "name": "🚀 Sci-Fi Trailers" },
    { "type": "movie", "id": "trailers-comedy",     "name": "😂 Comedy Trailers" },
    { "type": "movie", "id": "trailers-animation",  "name": "🎨 Animation Trailers" }
  ]
}
```

---

## 🎬 Catalogs

| Catalog | Description |
|---|---|
| 🎬 Now Playing | Movies currently in theaters |
| 🔜 Coming Soon | Upcoming movie releases |
| 🔥 Popular Movies | Most popular movies right now |
| ⭐ New Releases | Movies released in the last 2 months |
| 🏆 Top Rated | Highest rated movies of all time |
| 💥 Action Trailers | Popular action movies |
| 👻 Horror Trailers | Popular horror movies |
| 🚀 Sci-Fi Trailers | Popular sci-fi movies |
| 😂 Comedy Trailers | Popular comedy movies |
| 🎨 Animation Trailers | Popular animated movies |

---

## ▶️ How Trailers Work

Tap any movie in the catalog and you will see two stream buttons:

- **🎬 Snakeeyes Trailers** — plays the trailer inside Stremio
- **📺 YouTube** — opens the trailer in YouTube

Trailers are sourced from TMDB and YouTube automatically.

---

## 🛠️ Tech Stack

- **Node.js + Express** — server framework
- **Render.com** — hosting
- **TMDB API** — movie data and trailers
- **YouTube Data API v3** — trailer search fallback

---

## 🔑 Environment Variables

Set these in your Render.com dashboard under **Environment**:

| Variable | Description |
|---|---|
| `TMDB_API_KEY` | Your TMDB API key from themoviedb.org |
| `YOUTUBE_API_KEY` | Your YouTube Data API v3 key from Google Cloud |

---

## 🏥 Health Check

Visit `/health` to confirm both API keys are set:
```
https://https-stremio-movietrailer-addon.onrender.com/health
```

---

*Built by Snakeeyes 🐍*
