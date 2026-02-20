dat// ============================================================
// SYNC MANAGER — Ramadhan Anti Mager Club 🌙
// Centralized offline-first synchronization logic
// ============================================================

window.SyncManager = (() => {
  const STORAGE_KEY = 'ramc_global_sync_queue_v1';
  const supabase = () => window.RAMC?.supabase;
  const isOnline = () => navigator.onLine && !window.RAMC?.offline;
  
  let queue = new Map(); // key -> { table, payload, operation, match, retries, timestamp }
  let isSyncing = false;
  let debounceTimer = null;

  // Load from storage
  const load = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        queue = new Map(JSON.parse(saved));
        if (queue.size > 0) trigger();
      }
    } catch (e) {
      console.error('[SyncManager] Failed to load queue', e);
    }
  };

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(queue.entries())));
    } catch (e) {
      console.error('[SyncManager] Failed to save queue', e);
    }
  };

  const add = (table, payload, uniqueKey, operation = 'upsert', match = null) => {
    const key = uniqueKey || `${table}:${operation}:${Date.now()}:${Math.random()}`;
    queue.set(key, { table, payload, operation, match, retries: 0, timestamp: Date.now() });
    save();
    trigger();
    return key;
  };

  const trigger = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(process, 2000); // 2s debounce
  };

  const process = async () => {
    if (isSyncing || queue.size === 0 || !isOnline()) return;
    
    isSyncing = true;
    console.log(`[SyncManager] Processing ${queue.size} items...`);
    
    const client = supabase();
    if (!client) {
      isSyncing = false;
      return;
    }

    const entries = Array.from(queue.entries());
    let successCount = 0;

    for (const [key, item] of entries) {
      try {
        let error = null;
      
      if (item.operation === 'delete') {
        // Handle Delete
        if (!item.match) throw new Error('Delete operation requires match object');
        const { error: e } = await client.from(item.table).delete().match(item.match);
        error = e;
      } else if (item.operation === 'update') {
        // Handle Update (Partial)
        if (!item.match) throw new Error('Update operation requires match object');
        const { error: e } = await client.from(item.table).update(item.payload).match(item.match);
        error = e;
      } else {
        // Handle Upsert (Insert/Update full)
        const { error: e } = await client.from(item.table).upsert(item.payload);
        error = e;
      }

      if (error) throw error;
        
        queue.delete(key);
        successCount++;
      } catch (e) {
        console.error(`[SyncManager] Failed to sync ${key}`, e);
        // Keep in queue
      }
    }

    if (successCount > 0) {
      console.log(`[SyncManager] Successfully synced ${successCount} items.`);
      save();
    }

    isSyncing = false;
    
    // Retry if items remain
    if (queue.size > 0) {
      setTimeout(trigger, 10000); // Retry in 10s
    }
  };

  // Listen for online status
  window.addEventListener('online', trigger);
  window.addEventListener('ramc:ready', load);

  return {
    add,
    trigger,
    getQueueSize: () => queue.size
  };
})();
