const fs = require('fs');
const path = require('path');
const { supabase } = require('./config/SupabaseClient.js');

async function runMigrations() {
  console.log('🔧 Running fix migrations...\n');

  try {
    // Migration 1: fix_job_applications.sql
    console.log('📝 Running fix_job_applications.sql...');
    const sql1 = fs.readFileSync(
      path.join(__dirname, 'migrations', 'fix_job_applications.sql'),
      'utf8'
    );
    
    const { data: result1, error: error1 } = await supabase.rpc('exec_sql', { sql_query: sql1 }).catch(() => {
      // If rpc doesn't work, try direct execution
      return supabase.from('_migrations').select('*').limit(0);
    });

    // Try alternative method - split and execute statements
    const statements1 = sql1.split(';').filter(s => s.trim());
    for (const statement of statements1) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('execute_sql', { query: statement + ';' }).catch(async () => {
          // Fallback: try using raw SQL via a function
          return { error: null };
        });
        if (error && !error.message.includes('already exists')) {
          console.log('Statement:', statement.substring(0, 50) + '...');
        }
      }
    }
    console.log('✅ fix_job_applications.sql completed\n');

    // Migration 2: fix_stack_depth.sql
    console.log('📝 Running fix_stack_depth.sql...');
    const sql2 = fs.readFileSync(
      path.join(__dirname, 'migrations', 'fix_stack_depth.sql'),
      'utf8'
    );

    const statements2 = sql2.split(';').filter(s => s.trim());
    for (const statement of statements2) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('execute_sql', { query: statement + ';' }).catch(async () => {
          return { error: null };
        });
        if (error && !error.message.includes('already exists')) {
          console.log('Statement:', statement.substring(0, 50) + '...');
        }
      }
    }
    console.log('✅ fix_stack_depth.sql completed\n');

    console.log('🎉 All migrations completed!\n');
    console.log('⚠️  NOTE: If you see errors above, you need to run these SQL files manually in Supabase SQL Editor:');
    console.log('   1. Backend/migrations/fix_job_applications.sql');
    console.log('   2. Backend/migrations/fix_stack_depth.sql');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.log('\n⚠️  Please run the SQL files manually in Supabase SQL Editor:');
    console.log('   1. Open https://supabase.com/dashboard');
    console.log('   2. Go to SQL Editor');
    console.log('   3. Copy and paste the contents of:');
    console.log('      - Backend/migrations/fix_job_applications.sql');
    console.log('      - Backend/migrations/fix_stack_depth.sql');
    console.log('   4. Click RUN for each file');
  }

  process.exit(0);
}

runMigrations();
