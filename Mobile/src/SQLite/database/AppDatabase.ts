import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'mievoh.db';

export const db = SQLite.openDatabaseSync(DATABASE_NAME);

export const initDatabase = () => {
  try {
    db.execSync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS bookings (
        bookingId TEXT PRIMARY KEY NOT NULL,
        username TEXT NOT NULL,
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
    `);
    console.log('SQLite Database initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize SQLite Database:', error);
  }
};
