import { db } from '../database/AppDatabase';
import { RecommendedMovieEntity } from '../models/MovieModel';
import { PersonalRecommendation } from '../../axios/profile';

export class MovieRepository {
  /**
   * Save the first 3 recommended movies into local SQLite database.
   * Clears old ones and updates with new ones.
   */
  static saveRecommendedMovies(items: PersonalRecommendation[]): void {
    try {
      const currentLocal = this.getRecommendedMovies();
      const limitItems = items.slice(0, 3);
      
      const currentLocalIds = currentLocal.map(m => m.movieId);
      const newIds = limitItems.map(item => item.movieId);

      const hasChanges = currentLocalIds.length !== newIds.length ||
        newIds.some((id, index) => currentLocalIds[index] !== id);

      if (!hasChanges) {
        console.log('No change in recommended movie IDs. Skipping write.');
        return;
      }

      db.withTransactionSync(() => {
        // Clear all previous recommended movies
        db.runSync('DELETE FROM recommended_movies');

        const statement = db.prepareSync(`
          INSERT INTO recommended_movies (
            movieId, titleVi, imageUrl, averageRating, matchScore
          ) VALUES (?, ?, ?, ?, ?)
        `);

        try {
          for (const item of limitItems) {
            const movie = item.Movie || {};
            statement.executeSync([
              item.movieId,
              movie.title_vi || 'Movie',
              movie.imageUrl || '',
              movie.averageRating || 4.5,
              item.matchScore || 80
            ]);
          }
        } finally {
          statement.finalizeSync();
        }
      });
      console.log(`Saved ${limitItems.length} recommended movies to SQLite.`);
    } catch (error) {
      console.error('Failed to save recommended movies to SQLite:', error);
    }
  }

  /**
   * Fetch cached recommended movies for offline mode
   */
  static getRecommendedMovies(): RecommendedMovieEntity[] {
    try {
      return db.getAllSync<RecommendedMovieEntity>('SELECT * FROM recommended_movies');
    } catch (error) {
      console.error('Failed to query recommended movies from SQLite:', error);
      return [];
    }
  }
}
