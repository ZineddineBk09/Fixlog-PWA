### 1. Database Schemas

We need to define two schemas: the **Remote (Supabase)** schema and the **Local (Dexie.js)** schema. They are almost identical, but the local one has an extra flag to track what needs to be uploaded.

#### A. Supabase PostgreSQL Schema (The Cloud)
You can run this directly in the Supabase SQL Editor.

```sql
-- 1. Mechanics (Users) Table
CREATE TABLE mechanics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    pin_code TEXT NOT NULL, -- Simple 4-digit PIN for quick factory floor login
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Maintenance Logs Table
CREATE TABLE maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    author_name TEXT NOT NULL, -- Stored as text to avoid complex joins when offline
    machine_name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Mechanical', 'Electrical', 'Software', 'Pneumatic'
    symptoms TEXT NOT NULL,
    solution_applied TEXT,
    status TEXT NOT NULL DEFAULT 'Pending', -- 'Fixed' or 'Pending'
    image_url TEXT -- URL from Supabase Storage
);

-- 3. Optional: Pre-defined Machines List (for the dropdown)
CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    department TEXT
);
```

#### B. Dexie.js Schema (The Offline Device DB)
Inside your Next.js app, your `Dexie.js` configuration will look like this. Notice the `sync_status` field—this is the secret to handling offline creation.

```javascript
import Dexie from 'dexie';

export const db = new Dexie('FixLogDB');

db.version(1).stores({
  // The '++id' is for local auto-increment, but we'll use UUIDs to match Supabase
  logs: 'id, created_at, machine_name, status, sync_status', 
  machines: 'id, name'
});

// sync_status can be: 'synced', 'pending_insert', 'pending_update'
```

---

### 2. Next.js Folder Structure (App Router)

We will use Next.js 14+ with the App Router (`/app`). This structure strictly separates your UI components from your offline database logic.

```text
fixlog-pwa/
├── app/
│   ├── layout.tsx             # Main layout, PWA meta tags, imports bottom nav
│   ├── page.tsx               # [Tab 1] Home: Shared Team Feed & Search Bar
│   ├── new/
│   │   └── page.tsx           # [Tab 2] Form to add a new breakdown log
│   ├── pending/
│   │   └── page.tsx           # [Tab 3] Filtered view of 'Pending' tasks
│   ├── log/
│   │   └── [id]/
│   │       └── page.tsx       # Detail view of a single log + WhatsApp Share button
│   └── login/
│       └── page.tsx           # Simple PIN/Name selection screen
│
├── components/
│   ├── ui/                    # Dumb/Reusable UI components
│   │   ├── BottomNav.tsx      # Huge tap targets for navigation
│   │   ├── StatusChip.tsx     # Green/Red indicator
│   │   └── MachineSelect.tsx  # Dropdown for machines
│   ├── LogCard.tsx            # The card displaying a single breakdown
│   └── SyncIndicator.tsx      # Tiny cloud icon showing if offline/syncing
│
├── lib/                       # The Brains of the App
│   ├── supabaseClient.ts      # Supabase initialization
│   ├── dexieDb.ts             # Local offline database setup
│   ├── syncService.ts         # The logic that pushes 'pending_insert' to Supabase
│   └── utils.ts               # Date formatting, Base64 image compression
│
├── public/
│   ├── manifest.json          # PWA configuration (name, colors, standalone mode)
│   └── icons/                 # 192x192 and 512x512 app icons
│
├── next.config.mjs            # Where next-pwa plugin is configured
├── package.json
└── tailwind.config.ts         # Styled with Tailwind CSS for speed
```

### 3. Workflow for Offline Sync (The Golden Rule)

To implement the PRD's rule of "Disable Edit When Offline":
1. **App Loads:** Pulls latest data from Supabase and overwrites Dexie local DB.
2. **Network Drops (Offline):** The user creates a new log. It is saved to Dexie with `sync_status: 'pending_insert'`. The image is saved locally as a compressed Base64 string.
3. **Attempting to Edit:** If the user clicks "Edit" on an old log, the app checks `navigator.onLine`. If false, it shows a toast: *"Cannot edit while offline. Please connect to Wi-Fi."*
4. **Network Returns (Online):** A background listener in `layout.tsx` detects the connection. It grabs all Dexie records where `sync_status === 'pending_insert'`, uploads their Base64 images to Supabase Storage, updates the records with the real image URL, inserts them into the Supabase database, and marks them as `'synced'` locally.