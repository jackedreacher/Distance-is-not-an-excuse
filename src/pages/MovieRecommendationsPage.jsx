import MovieRecommendations from '../components/MovieRecommendations'

const MovieRecommendationsPage = () => {
  return (
    <div className="page-container">
      <header className="page-header">
       <h1>🎬 Birlikte İzleyebileceğimiz Öneriler</h1>
       <p>Güncel filmler ve diziler</p>
      </header>
      <MovieRecommendations />
    </div>
  )
}

export default MovieRecommendationsPage