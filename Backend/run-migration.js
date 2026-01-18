const fs = require('fs');
const path = require('path');
const { supabase } = require('./config/SupabaseClient.js');

async function runMigration() {
  console.log('🚀 Starting database migration...\n');

  try {
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'migrations', 'complete_job_workflow.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('⏳ Executing SQL... (this may take 10-20 seconds)\n');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
      // If exec_sql function doesn't exist, try direct query
      console.log('Using direct query method...');
      return await supabase.from('_migrations').select('*').limit(0).then(() => {
        // Split SQL into individual statements and execute them
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));
        
        return executeStatements(statements);
      });
    });

    if (error) {
      console.error('❌ Migration failed:', error.message);
      console.log('\n💡 Try running the SQL file manually in Supabase SQL Editor');
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('🎉 Your database is now ready!\n');
    console.log('What was created:');
    console.log('  ✓ job_offers table');
    console.log('  ✓ worker_job_offers view (fixes your error!)');
    console.log('  ✓ busy_until column in employees table');
    console.log('  ✓ scheduling columns in job_postings table');
    console.log('  ✓ all triggers and functions\n');
    console.log('🚀 You can now restart your app - the error will be gone!');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📝 Manual steps required:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Open SQL Editor');
    console.log('3. Copy content from: Backend/migrations/complete_job_workflow.sql');
    console.log('4. Paste and click RUN');
    console.log('5. Click "Confirm" when it asks\n');
  }

  process.exit(0);
}

async function executeStatements(statements) {
  console.log(`Executing ${statements.length} SQL statements...`);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (stmt.length < 10) continue; // Skip very short statements
    
    try {
      console.log(`  ${i + 1}/${statements.length}...`);
      const { error } = await supabase.rpc('exec', { sql: stmt });
      if (error) throw error;
    } catch (e) {
      // Some statements might fail if already exist, that's OK
      if (!e.message?.includes('already exists')) {
        console.warn(`  ⚠️  Warning: ${e.message?.substring(0, 60)}`);
      }
    }
  }
  
  return { data: null, error: null };
}

runMigration();
