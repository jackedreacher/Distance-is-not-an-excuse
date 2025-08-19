// Movie and TV Show API configuration
export const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY // Your TMDB API key
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'

// Get current movies (now playing)
export const getCurrentMovies = async (max = 120) => {
  try {
    const yearMin = 2000;
    const yearMax = new Date().getFullYear();
    let allResults = [];
    let page = 1;
    const maxPages = Math.min(500, Math.ceil(max / 20))
    while (allResults.length < max && page <= maxPages) { // dynamically fetch enough pages
      const response = await fetch(
        `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}` +
        `&language=tr-TR&region=TR&sort_by=vote_average.desc&vote_count.gte=50&primary_release_date.gte=${yearMin}-01-01&primary_release_date.lte=${yearMax}-12-31&page=${page}`
      )
      if (!response.ok) throw new Error('Failed to fetch movies')
      const data = await response.json()
      allResults = allResults.concat(data.results)
      if (data.page >= data.total_pages) break
      page++
    }
    // Remove duplicates by id
    const unique = Array.from(new Map(allResults.map(m => [m.id, m])).values())
    // Sort by vote_average desc
    unique.sort((a, b) => b.vote_average - a.vote_average)
    return unique.slice(0, max)
  } catch (error) {
    console.error('Error fetching movies:', error)
    return getMockMovies().slice(0, max)
  }
}

// Get current TV shows (on the air)
export const getCurrentTVShows = async (max = 120) => {
  try {
    const yearMin = 2000;
    const yearMax = new Date().getFullYear();
    let allResults = [];
    let page = 1;
    const maxPages = Math.min(500, Math.ceil(max / 20))
    while (allResults.length < max && page <= maxPages) { // dynamically fetch enough pages
      const response = await fetch(
        `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}` +
        `&language=tr-TR&sort_by=vote_average.desc&vote_count.gte=50&first_air_date.gte=${yearMin}-01-01&first_air_date.lte=${yearMax}-12-31&page=${page}`
      )
      if (!response.ok) throw new Error('Failed to fetch TV shows')
      const data = await response.json()
      allResults = allResults.concat(data.results)
      if (data.page >= data.total_pages) break
      page++
    }
    // Remove duplicates by id
    const unique = Array.from(new Map(allResults.map(m => [m.id, m])).values())
    // Sort by vote_average desc
    unique.sort((a, b) => b.vote_average - a.vote_average)
    return unique.slice(0, max)
  } catch (error) {
    console.error('Error fetching TV shows:', error)
    return getMockTVShows().slice(0, max)
  }
}

// Get movie details by ID
export const getMovieDetails = async (movieId) => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=tr-TR&append_to_response=credits`
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch movie details')
    }
    
    const data = await response.json()
    return {
      id: data.id,
      title: data.title,
      original_title: data.original_title,
      overview: data.overview,
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      release_date: data.release_date,
      runtime: data.runtime,
      vote_average: data.vote_average,
      genres: data.genres,
      director: data.credits?.crew?.find(person => person.job === 'Director')?.name || 'Bilinmiyor',
      cast: data.credits?.cast?.slice(0, 5) || [],
      production_companies: data.production_companies?.slice(0, 3) || []
    }
  } catch (error) {
    console.error('Error fetching movie details:', error)
    return null
  }
}

// Get TV show details by ID
export const getTVShowDetails = async (tvId) => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}&language=tr-TR&append_to_response=credits`
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch TV show details')
    }
    
    const data = await response.json()
    return {
      id: data.id,
      name: data.name,
      original_name: data.original_name,
      overview: data.overview,
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      first_air_date: data.first_air_date,
      number_of_seasons: data.number_of_seasons,
      vote_average: data.vote_average,
      genres: data.genres,
      creator: data.created_by?.[0]?.name || 'Bilinmiyor',
      cast: data.credits?.cast?.slice(0, 5) || [],
      production_companies: data.production_companies?.slice(0, 3) || []
    }
  } catch (error) {
    console.error('Error fetching TV show details:', error)
    return null
  }
}

// Mock data for fallback
const getMockMovies = () => [
  {
    id: 1,
    title: "Barbie",
    original_title: "Barbie",
    poster_path: null,
    backdrop_path: null,
    vote_average: 7.2,
    release_date: "2023-07-21",
    runtime: 114,
    overview: "Barbie, Barbie Land'den çıkarak gerçek dünyaya adım atar ve hayatın anlamını keşfeder.",
    genres: [{ name: "Komedi" }, { name: "Macera" }, { name: "Fantastik" }],
    director: "Greta Gerwig",
    cast: [
      { name: "Margot Robbie" },
      { name: "Ryan Gosling" },
      { name: "America Ferrera" },
      { name: "Kate McKinnon" },
      { name: "Will Ferrell" }
    ],
    production_companies: [{ name: "Warner Bros. Pictures" }]
  },
  {
    id: 2,
    title: "Oppenheimer",
    original_title: "Oppenheimer",
    poster_path: null,
    backdrop_path: null,
    vote_average: 8.1,
    release_date: "2023-07-21",
    runtime: 180,
    overview: "J. Robert Oppenheimer'ın atom bombasını geliştirme sürecini anlatan biyografik film.",
    genres: [{ name: "Dram" }, { name: "Tarih" }, { name: "Biyografi" }],
    director: "Christopher Nolan",
    cast: [
      { name: "Cillian Murphy" },
      { name: "Emily Blunt" },
      { name: "Matt Damon" },
      { name: "Robert Downey Jr." },
      { name: "Florence Pugh" }
    ],
    production_companies: [{ name: "Universal Pictures" }]
  },
  {
    id: 3,
    title: "The Super Mario Bros. Movie",
    poster_path: null,
    vote_average: 7.5,
    release_date: "2023-04-05",
    overview: "Mario ve Luigi'nin fantastik dünyada yaşadığı maceraları anlatan animasyon filmi."
  },
  {
    id: 4,
    title: "Dune: Part Two",
    poster_path: null,
    vote_average: 8.3,
    release_date: "2024-03-01",
    overview: "Paul Atreides, Chani ve Fremenlerle birlikte Arrakis'i kurtarmak için savaşır."
  },
  {
    id: 5,
    title: "Poor Things",
    poster_path: null,
    vote_average: 7.8,
    release_date: "2023-12-08",
    overview: "Bella Baxter'in hayatındaki olağanüstü dönüşümü ve maceralarını anlatan film."
  },
  {
    id: 6,
    title: "The Zone of Interest",
    poster_path: null,
    vote_average: 7.6,
    release_date: "2023-12-15",
    overview: "Auschwitz toplama kampının komutanın ailesinin yaşamını konu alan dram."
  },
  {
    id: 7,
    title: "Anatomy of a Fall",
    poster_path: null,
    vote_average: 7.7,
    release_date: "2023-08-23",
    overview: "Bir kadının kocasının ölümüyle ilgili şüpheli durumları araştıran gerilim filmi."
  },
  {
    id: 8,
    title: "The Holdovers",
    poster_path: null,
    vote_average: 7.6,
    release_date: "2023-10-27",
    overview: "Bir öğretmenin Noel tatilinde okulda kalan öğrencilerle geçirdiği zamanı anlatan dram."
  },
  {
    id: 9,
    title: "American Fiction",
    poster_path: null,
    vote_average: 7.4,
    release_date: "2023-12-15",
    overview: "Bir yazarın toplumsal beklentileri altüst eden romanı yazmasını konu alan komedi-dram."
  },
  {
    id: 10,
    title: "Past Lives",
    poster_path: null,
    vote_average: 7.8,
    release_date: "2023-06-02",
    overview: "İki çocukluk arkadaşının yıllar sonra tekrar buluşmasını anlatan romantik dram."
  }
]

const getMockTVShows = () => [
  {
    id: 1,
    name: "Wednesday",
    poster_path: "/9PFonBhy4cQy7Jz20NpMygczOkv.jpg",
    vote_average: 8.6,
    first_air_date: "2022-11-23",
    overview: "Wednesday Addams'ın Nevermore Akademisi'ndeki maceralarını anlatan dizi."
  },
  {
    id: 2,
    name: "Stranger Things",
    poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
    vote_average: 8.7,
    first_air_date: "2016-07-15",
    overview: "Hawkins kasabasında yaşanan doğaüstü olayları araştıran gençlerin hikayesi."
  },
  {
    id: 3,
    name: "The Crown",
    poster_path: "/7k3O7YzVzKqJqHn3K6QYzVzKqJqHn3K6Q.jpg",
    vote_average: 8.3,
    first_air_date: "2016-11-04",
    overview: "İngiliz kraliyet ailesinin tarihini anlatan dramatik dizi."
  },
  {
    id: 4,
    name: "The Last of Us",
    poster_path: "/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg",
    vote_average: 8.8,
    first_air_date: "2023-01-15",
    overview: "Zombi apokaliptik dünyada hayatta kalmaya çalışan Joel ve Ellie'nin hikayesi."
  },
  {
    id: 5,
    name: "House of the Dragon",
    poster_path: "/z2yahl2uefxDCl0nogcRBstwruJ.jpg",
    vote_average: 8.5,
    first_air_date: "2022-08-21",
    overview: "Game of Thrones'un öncesini anlatan, Targaryen hanedanının hikayesi."
  },
  {
    id: 6,
    name: "The Bear",
    poster_path: "/9P4DcvbgN48Hm9iF9Ndkxndv2D9.jpg",
    vote_average: 8.6,
    first_air_date: "2022-06-23",
    overview: "Bir şefin aile restoranını yeniden canlandırmaya çalıştığı komedi-dram."
  },
  {
    id: 7,
    name: "Succession",
    poster_path: "/dfDDOlwqXj5nKqJqHn3K6QYzVzKqJqHn3K6Q.jpg",
    vote_average: 8.7,
    first_air_date: "2018-06-03",
    overview: "Medya imparatorluğunun kontrolü için savaşan aile üyelerinin hikayesi."
  },
  {
    id: 8,
    name: "Breaking Bad",
    poster_path: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
    vote_average: 9.5,
    first_air_date: "2008-01-20",
    overview: "Kimya öğretmeninin uyuşturucu üretimine başlamasını anlatan dram."
  },
  {
    id: 9,
    name: "Friends",
    poster_path: "/f496cm9enuEsZkSPzCwnTESEK5s.jpg",
    vote_average: 8.9,
    first_air_date: "1994-09-22",
    overview: "New York'ta yaşayan altı arkadaşın hayatlarını anlatan komedi dizisi."
  },
  {
    id: 10,
    name: "The Office",
    poster_path: "/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg",
    vote_average: 8.9,
    first_air_date: "2005-03-24",
    overview: "Bir ofis çalışanlarının günlük hayatlarını anlatan komedi dizisi."
  }
]

// Fetch movie genres from TMDB
export const fetchMovieGenres = async () => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}&language=tr-TR`
    )
    if (!response.ok) throw new Error('Failed to fetch movie genres')
    const data = await response.json()
    return data.genres // [{ id, name }]
  } catch (error) {
    console.error('Error fetching movie genres:', error)
    return []
  }
}

// Fetch TV genres from TMDB
export const fetchTVGenres = async () => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/genre/tv/list?api_key=${TMDB_API_KEY}&language=tr-TR`
    )
    if (!response.ok) throw new Error('Failed to fetch TV genres')
    const data = await response.json()
    return data.genres // [{ id, name }]
  } catch (error) {
    console.error('Error fetching TV genres:', error)
    return []
  }
}

// Search movies using TMDB search API
export const searchMovies = async (query, page = 1) => {
  try {
    if (!query || query.trim().length < 2) return []
    
    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=tr-TR&query=${encodeURIComponent(query)}&page=${page}`
    )
    
    if (!response.ok) throw new Error('Failed to search movies')
    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error('Error searching movies:', error)
    return []
  }
}

// Search TV shows using TMDB search API
export const searchTVShows = async (query, page = 1) => {
  try {
    if (!query || query.trim().length < 2) return []
    
    const response = await fetch(
      `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&language=tr-TR&query=${encodeURIComponent(query)}&page=${page}`
    )
    
    if (!response.ok) throw new Error('Failed to search TV shows')
    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error('Error searching TV shows:', error)
    return []
  }
}

// Search both movies and TV shows
export const searchContent = async (query, page = 1) => {
  try {
    if (!query || query.trim().length < 2) return { movies: [], tvShows: [] }
    
    const [moviesData, tvShowsData] = await Promise.all([
      searchMovies(query, page),
      searchTVShows(query, page)
    ])
    
    return {
      movies: moviesData,
      tvShows: tvShowsData
    }
  } catch (error) {
    console.error('Error searching content:', error)
    return { movies: [], tvShows: [] }
  }
}

// Format date
export const formatDate = (dateString) => {
  if (!dateString) return 'Tarih bilgisi yok'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Format runtime
export const formatRuntime = (minutes) => {
  if (!minutes) return 'Süre bilgisi yok'
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours > 0) {
    return `${hours}s ${mins}dk`
  }
  return `${mins} dakika`
}

// Get genre names
export const getGenreNames = (genres) => {
  if (!genres || genres.length === 0) return ['Tür bilgisi yok']
  return genres.map(genre => genre.name)
}