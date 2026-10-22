// index.js
// Snakeeyes Movie Trailer Addon — Node.js/Express for Render.com
// v1.3 — uses Piped API for reliable in-Stremio playback, no ytdl/play-dl

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';



const manifest = {
    id: 'community.snakeeyes.trailers',
    version: '1.3.0',
    name: '🎬 Snakeeyes Trailers',
    description: 'Watch movie trailers — Now Playing, Coming Soon, Popular and New Releases.',
    logo: 'https://via.placeholder.com/150',
    resources: ['catalog', 'meta', 'stream'],
    types: ['movie'],
    idPrefixes: ['tt', 'tmdb:'],
    catalogs: [
        { type: 'movie', id: 'trailers-nowplaying',  name: '🎬 Now Playing in Theaters' },
        { type: 'movie', id: 'trailers-upcoming',    name: '🔜 Coming Soon' },
        { type: 'movie', id: 'trailers-popular',     name: '🔥 Popular Movies' },
        { type: 'movie', id: 'trailers-newrelease',  name: '⭐ New Releases' },
        { type: 'movie', id: 'trailers-toprated',    name: '🏆 Top Rated' },
        { type: 'movie', id: 'trailers-action',      name: '💥 Action Trailers' },
        { type: 'movie', id: 'trailers-horror',      name: '👻 Horror Trailers' },
        { type: 'movie', id: 'trailers-scifi',       name: '🚀 Sci-Fi Trailers' },
        { type: 'movie', id: 'trailers-comedy',      name: '😂 Comedy Trailers' },
        { type: 'movie', id: 'trailers-animation',   name: '🎨 Animation Trailers' }
    ]
};

const catalogConfig = {
    'trailers-nowplaying': { path: 'movie/now_playing',  params: { language: 'en-US', region: 'US' } },
    'trailers-upcoming':   { path: 'movie/upcoming',     params: { language: 'en-US', region: 'US' } },
    'trailers-popular':    { path: 'movie/popular',      params: { language: 'en-US' } },
    'trailers-newrelease': { path: 'discover/movie',     params: { sort_by: 'release_date.desc', 'release_date.lte': new Date().toISOString().split('T')[0], 'release_date.gte': (() => { const d = new Date(); d.setMonth(d.getMonth() - 2); return d.toISOString().split('T')[0]; })(), include_adult: false } },
    'trailers-toprated':   { path: 'movie/top_rated',    params: { language: 'en-US' } },
    'trailers-action':     { path: 'discover/movie',     params: { with_genres: 28,  sort_by: 'popularity.desc', include_adult: false } },
    'trailers-horror':     { path: 'discover/movie',     params: { with_genres: 27,  sort_by: 'popularity.desc', include_adult: false } },
    'trailers-scifi':      { path: 'discover/movie',     params: { with_genres: 878, sort_by: 'popularity.desc', include_adult: false } },
    'trailers-comedy':     { path: 'discover/movie',     params: { with_genres: 35,  sort_by: 'popularity.desc', include_adult: false } },
    'trailers-animation':  { path: 'discover/movie',     params: { with_genres: 16,  sort_by: 'popularity.desc', include_adult: false } }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildId(item) {
    if (!item || !item.id) return null;
    if (item.imdb_id && /^tt\d+$/.test(item.imdb_id)) return item.imdb_id;
    return `tmdb:${item.id}`;
}

function movieToMeta(item) {
    if (!item || !item.id) return null;
    return {
        id: buildId(item),
        type: 'movie',
        name: item.title || item.name || '',
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : null,
        background: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
        description: item.overview || '',
        releaseInfo: (item.release_date || '').split('-')[0]
    };
}

async function fetchTmdb(path, params = {}) {
    const q = new URLSearchParams({ api_key: TMDB_API_KEY, ...params });
    const r = await fetch(`${TMDB_BASE}/${path}?${q}`);
    if (!r.ok) throw new Error(`TMDB ${path} → ${r.status}`);
    return r.json();
}

async function getTmdbId(id, mediaType) {
    if (id.startsWith('tmdb:')) return id.replace('tmdb:', '');
    if (/^tt\d+$/.test(id)) {
        const data = await fetchTmdb(`find/${id}`, { external_source: 'imdb_id' });
        const hit = mediaType === 'tv' ? data.tv_results?.[0] : data.movie_results?.[0];
        return hit ? String(hit.id) : null;
    }
    return null;
}

async function searchYouTubeTrailer(movieTitle, year) {
    if (!YOUTUBE_API_KEY) return null;
    try {
        const query = `${movieTitle} ${year} official trailer`;
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=5&key=${YOUTUBE_API_KEY}`;
        const r = await fetch(url);
        if (!r.ok) return null;
        const data = await r.json();
        const items = data.items || [];
        const best = items.find(v =>
            v.snippet.title.toLowerCase().includes('trailer') &&
            v.snippet.title.toLowerCase().includes(movieTitle.toLowerCase().split(' ')[0])
        ) || items[0];
        return best ? best.id.videoId : null;
    } catch (err) {
        console.warn('YouTube search failed:', err.message);
        return null;
    }
}



// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
    const host = req.get('host');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Snakeeyes Trailers</title>
  <style>
    body{font-family:Arial,sans-serif;background:#1a1a1a;color:white;text-align:center;padding:50px}
    h1{color:#ff4444}
    .btn{background:#ff4444;color:white;padding:15px 30px;text-decoration:none;border-radius:5px;font-size:1.2em;display:inline-block;margin-top:20px}
    .btn:hover{background:#cc0000}
    .cats{margin-top:40px;text-align:left;max-width:600px;margin:40px auto 0;background:#2a2a2a;padding:20px;border-radius:10px}
    ul{columns:2}
  </style>
</head>
<body>
  <h1>🎬 Snakeeyes Trailers</h1>
  <p>Watch official movie trailers right inside Stremio or on YouTube.</p>
  <a class="btn" href="stremio://${host}/manifest.json">Install in Stremio</a>
  <div class="cats"><h3>Catalogs:</h3><ul>
    <li>🎬 Now Playing</li><li>🔜 Coming Soon</li>
    <li>🔥 Popular Movies</li><li>⭐ New Releases</li>
    <li>🏆 Top Rated</li><li>💥 Action Trailers</li>
    <li>👻 Horror Trailers</li><li>🚀 Sci-Fi Trailers</li>
    <li>😂 Comedy Trailers</li><li>🎨 Animation Trailers</li>
  </ul></div>
</body>
</html>`);
});

app.get('/manifest.json', (req, res) => res.json(manifest));

app.get('/catalog/:type/:id.json', async (req, res) => {
    const { id } = req.params;
    if (!TMDB_API_KEY) return res.json({ metas: [] });
    try {
        const config = catalogConfig[id];
        if (!config) return res.json({ metas: [] });
        const data = await fetchTmdb(config.path, config.params || {});
        const metas = (data.results || []).map(movieToMeta).filter(m => m && m.name);
        res.json({ metas });
    } catch (err) {
        console.error('Catalog error:', err.message);
        res.json({ metas: [] });
    }
});

app.get('/meta/:type/:id.json', async (req, res) => {
    const { type, id } = req.params;
    if (!TMDB_API_KEY) return res.json({ meta: {} });
    try {
        const tmdbId = await getTmdbId(id, type === 'series' ? 'tv' : 'movie');
        if (!tmdbId) return res.json({ meta: {} });
        const detail = await fetchTmdb(`movie/${tmdbId}`, { append_to_response: 'videos' });
        if (!detail || detail.success === false) return res.json({ meta: {} });

        const videos = detail.videos?.results || [];
        const tmdbTrailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube' && v.official)
            || videos.find(v => v.type === 'Trailer' && v.site === 'YouTube')
            || videos.find(v => v.type === 'Teaser' && v.site === 'YouTube')
            || videos.find(v => v.site === 'YouTube');
        const trailerUrl = tmdbTrailer ? `https://www.youtube.com/watch?v=${tmdbTrailer.key}` : null;

        res.json({
            meta: {
                id, type,
                name: detail.title || '',
                poster: detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : null,
                background: detail.backdrop_path ? `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}` : null,
                description: detail.overview || '',
                releaseInfo: (detail.release_date || '').split('-')[0],
                runtime: detail.runtime ? `${detail.runtime} min` : null,
                imdbRating: detail.vote_average ? detail.vote_average.toFixed(1) : null,
                trailer: trailerUrl,
                videos: trailerUrl ? [{
                    id: 'trailer',
                    title: `${detail.title} — Official Trailer`,
                    released: detail.release_date || '',
                    type: 'movie',
                    streams: [{ url: trailerUrl, title: 'Official Trailer', behaviorHints: { bingeGroup: 'trailer' } }]
                }] : []
            }
        });
    } catch (err) {
        console.error('Meta error:', err.message);
        res.json({ meta: {} });
    }
});

// Stream — externalUrl only (reliable, same approach as Reddemon)
app.get('/stream/:type/:id.json', async (req, res) => {
    const { type, id } = req.params;
    if (!TMDB_API_KEY) return res.json({ streams: [] });
    try {
        const tmdbId = await getTmdbId(id, type === 'series' ? 'tv' : 'movie');
        if (!tmdbId) return res.json({ streams: [] });

        const detail = await fetchTmdb(`movie/${tmdbId}`, { append_to_response: 'videos' });
        if (!detail || detail.success === false) return res.json({ streams: [] });

        const videos = detail.videos?.results || [];
        const title = detail.title || '';
        const year = (detail.release_date || '').split('-')[0];
        const streams = [];

        // Collect all YouTube trailers from TMDB (official first)
        const trailers = videos.filter(v => v.site === 'YouTube' && v.type === 'Trailer');
        const teasers  = videos.filter(v => v.site === 'YouTube' && v.type === 'Teaser');
        const others   = videos.filter(v => v.site === 'YouTube' && v.type !== 'Trailer' && v.type !== 'Teaser');

        const allVideos = [
            ...trailers.filter(v => v.official),
            ...trailers.filter(v => !v.official),
            ...teasers,
            ...others
        ].slice(0, 4); // max 4 stream buttons

        for (const v of allVideos) {
            streams.push({
                name: `🎬 ${v.type}`,
                description: `▶ ${v.name}`,
                externalUrl: `https://www.youtube.com/watch?v=${v.key}`
            });
        }

        // If TMDB had no videos, fall back to YouTube API search
        if (streams.length === 0 && YOUTUBE_API_KEY) {
            const key = await searchYouTubeTrailer(title, year);
            if (key) {
                streams.push({
                    name: '🎬 Trailer',
                    description: `▶ ${title} ${year} Official Trailer`,
                    externalUrl: `https://www.youtube.com/watch?v=${key}`
                });
            }
        }

        res.json({ streams });
    } catch (err) {
        console.error('Stream error:', err.message);
        res.json({ streams: [] });
    }
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        version: '1.3.0',
        tmdb: TMDB_API_KEY ? 'set' : 'NOT SET',
        youtube: YOUTUBE_API_KEY ? 'set' : 'NOT SET'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Snakeeyes Trailers v1.3 running on port ${PORT}`);
    if (!TMDB_API_KEY)    console.warn('WARNING: TMDB_API_KEY is not set');
    if (!YOUTUBE_API_KEY) console.warn('WARNING: YOUTUBE_API_KEY is not set');
});
