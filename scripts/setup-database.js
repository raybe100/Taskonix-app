#!/usr/bin/env node

/**
 * Database Setup Script for Taskonix
 * Run this script to ensure your Supabase database is properly configured
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manual environment variable loading (since dotenv might not be available)
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkConnection() {
  console.log('🔗 Testing Supabase connection...');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "profiles" does not exist')) {
        console.log('⚠️  Database tables do not exist. You need to run the schema setup.');
        return false;
      }
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return false;
  }
}

async function checkSchema() {
  console.log('📋 Checking database schema...');
  
  const requiredTables = ['profiles', 'items', 'locations', 'reminders', 'devices'];
  const missingTables = [];
  
  for (const table of requiredTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error && error.message.includes('does not exist')) {
        missingTables.push(table);
      } else if (error) {
        console.warn(`⚠️  Table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table}: exists`);
      }
    } catch (err) {
      missingTables.push(table);
    }
  }
  
  if (missingTables.length > 0) {
    console.error(`❌ Missing tables: ${missingTables.join(', ')}`);
    console.log('\n📝 To fix this, run the following SQL in your Supabase SQL editor:');
    console.log('   File: database/complete-schema.sql');
    return false;
  }
  
  return true;
}

async function checkRLSPolicies() {
  console.log('🔐 Checking RLS policies...');
  
  try {
    // Test if we can set RLS context
    const { data, error } = await supabase.rpc('set_config', {
      parameter: 'app.current_user_id',
      value: 'test-user-id'
    });
    
    if (error) {
      console.warn('⚠️  RLS context function not available:', error.message);
      console.log('\n📝 To fix this, run the following SQL in your Supabase SQL editor:');
      console.log('   File: database/clerk-rls-policies.sql');
      return false;
    }
    
    console.log('✅ RLS policies configured');
    return true;
  } catch (err) {
    console.warn('⚠️  Could not test RLS policies:', err.message);
    return false;
  }
}

async function testItemCreation() {
  console.log('🧪 Testing item creation...');
  
  const testItem = {
    clerk_user_id: 'test-user-' + Date.now(),
    title: 'Test Task - Database Setup',
    notes: 'This is a test task created during database setup',
    type: 'task',
    priority: 3,
    status: 'pending',
    tags: ['test'],
    ai_suggestions: {}
  };
  
  try {
    // Set user context
    await supabase.rpc('set_config', {
      parameter: 'app.current_user_id',
      value: testItem.clerk_user_id
    });
    
    // Try to insert test item
    const { data, error } = await supabase
      .from('items')
      .insert([testItem])
      .select('*')
      .single();
    
    if (error) {
      console.error('❌ Test item creation failed:', error.message);
      return false;
    }
    
    console.log('✅ Test item created successfully:', data.title);
    
    // Clean up test item
    await supabase
      .from('items')
      .delete()
      .eq('id', data.id);
    
    console.log('✅ Test item cleaned up');
    return true;
  } catch (err) {
    console.error('❌ Test item creation error:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Taskonix Database Setup Check\n');
  
  const connectionOk = await checkConnection();
  if (!connectionOk) {
    console.log('\n❌ Setup incomplete. Please check your Supabase configuration.');
    process.exit(1);
  }
  
  const schemaOk = await checkSchema();
  const rlsOk = await checkRLSPolicies();
  
  if (schemaOk && rlsOk) {
    const testOk = await testItemCreation();
    
    if (testOk) {
      console.log('\n🎉 Database setup complete! Your Taskonix app should work properly.');
    } else {
      console.log('\n⚠️  Database setup mostly complete, but item creation test failed.');
      console.log('Check the browser console when using the app for more details.');
    }
  } else {
    console.log('\n❌ Database setup incomplete. Please run the required SQL scripts.');
  }
}

// Handle command line execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}