const Database = require('better-sqlite3');
const path = require('path');
const DB_PATH = path.join(__dirname, '../data/netflixlight.db');

console.log('\nMIGRATION : Ajout progression visionnage\n');

try {
  const db = new Database(DB_PATH);
  
  // Verifier si les colonnes existent deja
  const tableInfo = db.prepare('PRAGMA table_info(viewing_history)').all();
  const hasProgressSeconds = tableInfo.some(col => col.name === 'progress_seconds');
  const hasDurationSeconds = tableInfo.some(col => col.name === 'duration_seconds');
  
  if (hasProgressSeconds && hasDurationSeconds) {
    console.log('Les colonnes existent deja. Migration annulee');
    db.close();
    process.exit(0);
  }
  
  console.log('Ajout des colonnes progress_seconds et duration_seconds...');
  
  // Ajouter les colonnes
  if (!hasProgressSeconds) {
    db.exec('ALTER TABLE viewing_history ADD COLUMN progress_seconds INTEGER DEFAULT 0');
    console.log('  Colonne progress_seconds ajoutee');
  }
  
  if (!hasDurationSeconds) {
    db.exec('ALTER TABLE viewing_history ADD COLUMN duration_seconds INTEGER DEFAULT 0');
    console.log('  Colonne duration_seconds ajoutee');
  }
  
  console.log('\nMigration terminee faite');
  console.log('La table viewing_history stock le watchtime\n');
  
  db.close();
} catch (error) {
  console.error('\nErreur lors de la migration :', error.message);
  process.exit(1);
}
