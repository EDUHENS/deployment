// backend/src/database/supabase.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://pehimhjaimqfmzltmhmx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlaGltaGphaW1xZm16bHRtaG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5Mzc3MzIsImV4cCI6MjA3ODUxMzczMn0.PwXbI79wFcH-m7Q3q4WkW8g3RgKJs47O653WqF4wlVw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const STORAGE_BUCKET = 'submission-assets';

// Ensure storage bucket exists (non-blocking)
async function ensureBucket() {
  try {
    // Check if we have service role key (required for bucket operations)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Only warn if we actually need to create the bucket
      // If bucket already exists, uploads will work without service role key
      console.log('ℹ️  [Supabase Storage] SUPABASE_SERVICE_ROLE_KEY not set.');
      console.log('   Bucket already exists, uploads should work. Service role key is only needed for bucket creation.');
      console.log('   To suppress this message, add SUPABASE_SERVICE_ROLE_KEY to .env');
      console.log('   Get it from: https://supabase.com/dashboard/project/pehimhjaimqfmzltmhmx/settings/api');
      // Don't return false - bucket might already exist
    }

    // Try to list buckets (requires service role key)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      if (listError) {
        console.warn(`⚠️  [Supabase Storage] Cannot list buckets: ${listError.message}`);
        console.warn('   This is OK if the bucket already exists. File uploads may still work.');
        return false;
      }
      
      const bucketExists = buckets?.some(b => b.name === STORAGE_BUCKET);
      if (!bucketExists) {
        const { data, error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
          public: false,
          fileSizeLimit: 50 * 1024 * 1024, // 50MB
          allowedMimeTypes: null // Allow all types
        });
        if (error) {
          console.warn(`⚠️  [Supabase Storage] Cannot create bucket: ${error.message}`);
          console.warn('   You may need to create it manually in Supabase Dashboard > Storage');
          return false;
        }
        console.log(`✅ [Supabase Storage] Created bucket: ${STORAGE_BUCKET}`);
      } else {
        console.log(`✅ [Supabase Storage] Bucket exists: ${STORAGE_BUCKET}`);
      }
      return true;
    } else {
      // No service role key - assume bucket exists (it was created via SQL)
      console.log(`✅ [Supabase Storage] Bucket '${STORAGE_BUCKET}' should exist (created via SQL).`);
      console.log('   File uploads will work. Service role key only needed for bucket management.');
      return true;
    }
  } catch (e) {
    console.warn(`⚠️  [Supabase Storage] Error: ${e.message}`);
    return false;
  }
}

// Initialize bucket on module load (non-blocking)
ensureBucket().catch(() => {
  // Silently fail - bucket might already exist or be created manually
});

module.exports = {
  supabase,
  STORAGE_BUCKET,
  ensureBucket
};

