// Test script untuk memverifikasi schema database dan mengidentifikasi error
// Jalankan script ini setelah menjalankan migration script di Supabase

const { createClient } = require('@supabase/supabase-js');

// Konfigurasi Supabase - ganti dengan credentials yang sesuai
const supabaseUrl = 'https://zuqwqdttdiyknkzqphqz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1cXdxZHR0ZGl5a25renFwaHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MTM5NTQsImV4cCI6MjA4Njk4OTk1NH0.VoMlZa3sH72FP6PpY8hsYDBQVLfOUZvSGl01Qq1e75E';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseSchema() {
  console.log('🔍 Testing database schema...');
  
  try {
    // Test 1: Verifikasi struktur tabel daily_progress
    console.log('\n1. Testing daily_progress table structure...');
    const { data: dailyProgressCols, error: dailyError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'daily_progress');
    
    if (dailyError) {
      console.error('❌ Error accessing daily_progress table:', dailyError.message);
    } else {
      console.log('✅ daily_progress columns:', dailyProgressCols.map(c => c.column_name));
      
      // Check if 'nama' column exists
      const hasNama = dailyProgressCols.some(c => c.column_name === 'nama');
      console.log(hasNama ? '✅ nama column exists' : '❌ nama column missing');
    }
    
    // Test 2: Verifikasi struktur tabel weekly_eval
    console.log('\n2. Testing weekly_eval table structure...');
    const { data: weeklyEvalCols, error: weeklyError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'weekly_eval');
    
    if (weeklyError) {
      console.error('❌ Error accessing weekly_eval table:', weeklyError.message);
    } else {
      console.log('✅ weekly_eval columns:', weeklyEvalCols.map(c => c.column_name));
      
      // Check if 'nama' column exists
      const hasNama = weeklyEvalCols.some(c => c.column_name === 'nama');
      console.log(hasNama ? '✅ nama column exists' : '❌ nama column missing');
    }
    
    // Test 3: Test INSERT operation dengan data sample
    console.log('\n3. Testing INSERT operations...');
    
    // Test daily_progress insert
    const testDailyData = {
      nama: 'neng',
      hari_ke: 1,
      item_id: 'sholat_subuh',
      selesai: true,
      waktu_selesai: new Date().toISOString()
    };
    
    const { error: insertDailyError } = await supabase
      .from('daily_progress')
      .insert(testDailyData);
    
    if (insertDailyError) {
      console.error('❌ Error inserting into daily_progress:', insertDailyError.message);
      console.error('Details:', insertDailyError.details);
    } else {
      console.log('✅ Successfully inserted into daily_progress');
    }
    
    // Test 4: Test SELECT operation
    console.log('\n4. Testing SELECT operations...');
    
    const { data: selectData, error: selectError } = await supabase
      .from('daily_progress')
      .select('*')
      .eq('nama', 'neng')
      .eq('hari_ke', 1);
    
    if (selectError) {
      console.error('❌ Error selecting from daily_progress:', selectError.message);
    } else {
      console.log('✅ Successfully selected data:', selectData.length, 'rows found');
    }
    
    // Test 5: Test constraints
    console.log('\n5. Testing constraints...');
    
    // Test invalid nama value
    const invalidData = {
      nama: 'invalid_user', // Should fail constraint
      hari_ke: 1,
      item_id: 'test_item',
      selesai: true
    };
    
    const { error: constraintError } = await supabase
      .from('daily_progress')
      .insert(invalidData);
    
    if (constraintError) {
      console.log('✅ Constraint working correctly - rejected invalid nama:', constraintError.message);
    } else {
      console.log('❌ Constraint failed - invalid nama was accepted');
    }
    
    console.log('\n🎉 Database schema test completed!');
    
  } catch (error) {
    console.error('💥 Unexpected error during testing:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testDatabaseSchema();
}

module.exports = { testDatabaseSchema };