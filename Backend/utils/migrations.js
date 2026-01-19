const fs = require('fs');
const path = require('path');

// File to track applied migrations locally
const MIGRATIONS_FILE = path.join(__dirname, '..', '.applied_migrations.json');

// List of migrations to run in order
const MIGRATIONS = [
  'create_messaging_tables.sql',
  'add_job_scheduling.sql',
  'add_job_completion.sql',
  'complete_job_workflow.sql',
  'add_job_offers.sql',
  'fix_job_applications.sql',
  'fix_stack_depth.sql',
  'add_schedule_conflict_detection.sql',
];

async function runMigrations() {
  console.log('🔄 Checking database migrations...\n');

  try {
    // Get already applied migrations from local file
    const appliedMigrations = getAppliedMigrations();
    
    // Find migrations that need to be run
    const pendingMigrations = MIGRATIONS.filter(
      migration => !appliedMigrations.includes(migration)
    );

    if (pendingMigrations.length === 0) {
      console.log('✅ All migrations are up to date!\n');
      return true;
    }

    console.log(`📝 Found ${pendingMigrations.length} pending migration(s):\n`);
    pendingMigrations.forEach((m, i) => console.log(`   ${i + 1}. ${m}`));
    console.log('');

    console.log('💡 To run migrations, execute the SQL files manually in Supabase:');
    console.log('   1. Open Supabase Dashboard → SQL Editor');
    console.log('   2. Run each pending migration file from Backend/migrations/\n');
    
    console.log('📋 After running migrations, mark them as applied:');
    console.log('   Run: node -e "require(\'./utils/migrations\').markAllApplied()"\n');

    return true;

  } catch (error) {
    console.error('❌ Migration check error:', error.message);
    return false;
  }
}

function getAppliedMigrations() {
  try {
    if (fs.existsSync(MIGRATIONS_FILE)) {
      const data = fs.readFileSync(MIGRATIONS_FILE, 'utf8');
      return JSON.parse(data).applied || [];
    }
  } catch (error) {
    // File doesn't exist or is corrupted
  }
  return [];
}

function saveAppliedMigrations(migrations) {
  try {
    fs.writeFileSync(MIGRATIONS_FILE, JSON.stringify({ 
      applied: migrations,
      lastUpdated: new Date().toISOString()
    }, null, 2));
  } catch (error) {
    console.error('Warning: Could not save migration status:', error.message);
  }
}

function markMigrationApplied(migrationName) {
  const applied = getAppliedMigrations();
  if (!applied.includes(migrationName)) {
    applied.push(migrationName);
    saveAppliedMigrations(applied);
    console.log(`✅ Marked as applied: ${migrationName}`);
  }
}

function markAllApplied() {
  saveAppliedMigrations(MIGRATIONS);
  console.log('✅ All migrations marked as applied:\n');
  MIGRATIONS.forEach((m, i) => console.log(`   ${i + 1}. ${m}`));
  console.log('\n🎉 Backend will skip these migrations on next start.');
}

function resetMigrations() {
  try {
    if (fs.existsSync(MIGRATIONS_FILE)) {
      fs.unlinkSync(MIGRATIONS_FILE);
      console.log('✅ Migration tracking reset. All migrations will be shown as pending.');
    }
  } catch (error) {
    console.error('Error resetting migrations:', error.message);
  }
}

module.exports = { 
  runMigrations, 
  markMigrationApplied, 
  markAllApplied, 
  resetMigrations,
  getAppliedMigrations 
};
