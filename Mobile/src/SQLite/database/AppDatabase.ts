import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'mievoh.db';

export const db = SQLite.openDatabaseSync(DATABASE_NAME);

export const initDatabase = () => {
  try {
    // Drop old table to migrate to email column if needed
    try {
      const info = db.getAllSync<{ name: string }>('PRAGMA table_info(bookings)');
      if (info.some(col => col.name === 'username')) {
        db.execSync('DROP TABLE bookings');
      }
    } catch (e) {
      // Table may not exist yet
    }

    db.execSync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS bookings (
        bookingId TEXT PRIMARY KEY NOT NULL,
        email TEXT NOT NULL,
        bookingDate TEXT,
        totalPrice REAL,
        paymentStatus TEXT,
        paymentMethod TEXT,
        ticketCode TEXT,
        movieTitleVi TEXT,
        movieTitleEn TEXT,
        movieImageUrl TEXT,
        cinemaName TEXT,
        showDateTime TEXT,
        seats TEXT,
        foods TEXT
      );
      CREATE TABLE IF NOT EXISTS recommended_movies (
        movieId TEXT PRIMARY KEY NOT NULL,
        titleVi TEXT,
        imageUrl TEXT,
        averageRating REAL,
        matchScore REAL
      );
    `);
    console.log('SQLite Database initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize SQLite Database:', error);
  }
};
