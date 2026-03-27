To adhere strictly to our "Keep It Simple" PRD, this service handles two main jobs:
1. **Push:** Find any local logs marked as `pending_insert`, upload their Base64 photos to Supabase Storage to get a real URL, and insert the record into the Supabase database.
2. **Pull:** Download the latest logs from the team and update the local IndexedDB, *carefully ignoring any local logs that haven't been pushed yet*.



Here is the code structure for `lib/syncService.ts`.

```typescript
import { db } from './dexieDb'; // Your local IndexedDB configuration
import { supabase } from './supabaseClient'; // Your Supabase client

// Global lock to prevent multiple syncs from running at the exact same time
let isSyncing = false;

export const syncService = {
  /**
   * Main entry point. Call this when the app loads, or when the 'online' event fires.
   */
  async syncAll() {
    // 1. Check if we have internet and aren't already syncing
    if (typeof window !== 'undefined' && !navigator.onLine) return;
    if (isSyncing) return;

    isSyncing = true;

    try {
      console.log('🔄 Starting sync cycle...');
      await this.pushLocalToRemote();
      await this.pullRemoteToLocal();
      console.log('✅ Sync cycle complete.');
    } catch (error) {
      console.error('❌ Sync failed:', error);
    } finally {
      // Always release the lock
      isSyncing = false;
    }
  },

  /**
   * PUSH: Local -> Cloud
   * Uploads newly created logs (and their images) while offline.
   */
  async pushLocalToRemote() {
    // Find all logs that need to be uploaded
    const pendingLogs = await db.logs.where('sync_status').equals('pending_insert').toArray();

    if (pendingLogs.length === 0) return;

    for (const log of pendingLogs) {
      let finalImageUrl = log.image_url;

      // STEP 1: Handle the Offline Image
      // If there is an image and it's a local Base64 string, upload it first
      if (finalImageUrl && finalImageUrl.startsWith('data:image')) {
        finalImageUrl = await this.uploadBase64Image(finalImageUrl, log.id);
        
        // If image upload fails, skip this log for now. 
        // We will try again on the next sync cycle.
        if (!finalImageUrl) continue; 
      }

      // STEP 2: Prepare payload for Supabase (Strip out local-only fields)
      const payload = {
        id: log.id,
        created_at: log.created_at,
        updated_at: log.updated_at,
        author_name: log.author_name,
        machine_name: log.machine_name,
        category: log.category,
        symptoms: log.symptoms,
        solution_applied: log.solution_applied,
        status: log.status,
        image_url: finalImageUrl, // Now contains the live Supabase Storage URL
      };

      // STEP 3: Insert into Supabase
      const { error } = await supabase.from('maintenance_logs').insert(payload);

      if (!error) {
        // STEP 4: Success! Update the local DB to mark it as synced and replace the base64 with the URL
        await db.logs.update(log.id, { 
          sync_status: 'synced', 
          image_url: finalImageUrl 
        });
      } else {
        console.error(`Failed to push log ${log.id} to Supabase:`, error);
      }
    }
  },

  /**
   * PULL: Cloud -> Local
   * Downloads the latest team logs so the local search is up-to-date.
   */
  async pullRemoteToLocal() {
    // KISS: Pull the last 500 records (or last 30 days). Text data is tiny.
    const { data: remoteLogs, error } = await supabase
      .from('maintenance_logs')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(500);

    if (error || !remoteLogs) {
      console.error('Failed to pull remote logs:', error);
      return;
    }

    // Run this inside a Dexie transaction to prevent UI flickering
    await db.transaction('rw', db.logs, async () => {
      // 1. Get IDs of local logs that are STILL waiting to be pushed
      const pendingLocalLogs = await db.logs.where('sync_status').equals('pending_insert').toArray();
      const pendingIds = pendingLocalLogs.map(log => log.id);

      // 2. Format remote logs for local storage
      const logsToPut = remoteLogs
        .map(log => ({ ...log, sync_status: 'synced' }))
        // CRITICAL: Do NOT overwrite a local log that hasn't been pushed yet!
        .filter(log => !pendingIds.includes(log.id));

      // 3. Bulk insert/update local DB
      await db.logs.bulkPut(logsToPut);
    });
  },

  /**
   * Helper: Converts Base64 to a File and uploads to Supabase Storage
   */
  async uploadBase64Image(base64Str: string, logId: string): Promise<string | null> {
    try {
      // Neat JS trick: Fetch the base64 string to easily convert it to a Blob
      const res = await fetch(base64Str);
      const blob = await res.blob();
      
      // Create a unique filename
      const fileName = `breakdowns/${logId}-${Date.now()}.jpg`;

      // Upload to Supabase Storage bucket named 'log-images'
      const { error } = await supabase.storage
        .from('log-images')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) throw error;

      // Retrieve the public URL
      const { data } = supabase.storage.from('log-images').getPublicUrl(fileName);
      return data.publicUrl;

    } catch (e) {
      console.error('Image upload failed:', e);
      return null;
    }
  }
};
```

### How to trigger this in your Next.js App

To make this truly automatic, you just need to hook this service up in your main `layout.tsx` or a global context provider so it listens for network changes.

```tsx
// Inside your layout.tsx or a Client Component at the top level

import { useEffect } from 'react';
import { syncService } from '@/lib/syncService';

export default function SyncProvider({ children }) {
  useEffect(() => {
    // 1. Run once on initial app load
    syncService.syncAll();

    // 2. Listen for the browser telling us we got Wi-Fi/4G back
    const handleOnline = () => {
      console.log('📡 Network connected! Triggering background sync.');
      syncService.syncAll();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return <>{children}</>;
}
```

### Why this specific design is bulletproof:
1. **The `isSyncing` Lock:** Factory networks drop constantly. If the app tries to sync, loses connection, and tries again immediately, it won't duplicate records because the lock prevents overlapping sync cycles.
2. **Image Failure Protection (`if (!finalImageUrl) continue;`):** If a mechanic takes a photo, but the connection drops exactly as the image is uploading, the system gracefully aborts saving the text log to the cloud. It keeps the log as `pending_insert` locally. The next time they get a connection, it tries the image upload again.
3. **The Dexie Bulk Put Filter:** By strictly filtering out `pendingIds` during the pull phase, you guarantee that a mechanic's unsent work is never accidentally overwritten by the cloud database.