const db = require('.');

const createUsersTable = async () => {
  const deleteStatement = db.prepare(`
    DROP TABLE IF EXISTS users
  `);
  deleteStatement.run();
  const statement = db.prepare(`
    CREATE TABLE users (
      user_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      country TEXT
    )
  `);
  statement.run();
};

const createNotesTable = async () => {
  const deleteStatement = db.prepare(`
    DROP TABLE IF EXISTS notes
  `);
  deleteStatement.run();
  const statement = db.prepare(`
  CREATE TABLE notes (
    note_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    user_id TEXT,
    FOREIGN KEY (user_id)
      REFERENCES users(user_id)
      ON DELETE CASCADE
  )
  `);

  statement.run();
};

const createMangaStatus = async () => {
  const deleteStatement = db.prepare(`
    DROP TABLE IF EXISTS mangas
  `);
  deleteStatement.run();
  const statement = db.prepare(`
    CREATE TABLE mangas (
      mangadb TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      user_id TEXT
    )
  `);
  statement.run();
};
const createTables = async () => {
  console.log('Creando tablas...');
  await createUsersTable();
  console.log('Tablas del usuario creada');
  await createNotesTable();
  console.log('Tablas de notas creada');
  console.log('Tablas creadas!');
  await createMangaStatus();
  console.log('Tablas de manga creadas!');
};
createTables();
