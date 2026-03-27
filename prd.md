# "FixLog" - Shared Maintenance Logbook PWA

## 1. Executive Summary
* **Product Name:** FixLog
* **Objective:** A highly ergonomic, offline-first Progressive Web App (PWA) designed for a team of factory maintenance mechanics to rapidly document machine breakdowns, search past solutions, and seamlessly share knowledge across shifts.
* **Core Philosophy:** Minimal typing, massive tap targets, and zero-configuration sharing. The system must work flawlessly in factory dead zones.

## 2. Target Audience & Environment
* **Users:** Maintenance specialists in a milk production facility.
* **Environment:** High noise, wet/dirty conditions, users wearing gloves, intermittent or nonexistent Wi-Fi/4G.
* **Tech Literacy:** Low to moderate. The app must behave like a simple digital notepad, not complex enterprise software.

## 3. Core Feature Specifications

### A. Fast Data Entry (Create Log)
* **Auto-population:** Date, Time, and Author (logged-in mechanic) are set automatically.
* **Machine Selection:** Searchable dropdown (e.g., "Pasteurizer A", "Conveyor 3").
* **Categorization:** Large, single-tap chips for issue type (Mechanical, Electrical, Software, Pneumatic).
* **Voice-Friendly Text Fields:** "Symptoms" and "Solution" text areas optimized for the mobile OS's native microphone/dictation button.
* **Quick Photo:** Native camera integration to snap a picture of an error code or broken part.
* **Status Toggle:** Large switch: `[🟢 Fixed]` or `[🔴 Pending]`.

### B. Robust Search & Knowledge Retrieval (Read)
* **Global Search:** Prominent top-of-screen search bar.
* **Fuzzy Text Matching:** Searches across Machine Name, Symptoms, Solution, and Author.
* **Quick Filters:** Filter by `[Pending]`, `[My Logs]`, `[Specific Machine]`.
* **Chronological Team Feed:** The default home screen is a shared timeline of all recent team activity.

### C. Seamless Team Sharing
* **Passive Sharing (Auto-Sync):** If online, all data syncs instantly to a central database so the next shift sees everything.
* **Active Sharing (Deep Links):** A "Share via WhatsApp/SMS" button on every log that sends a brief text summary and a deep link directly to that specific log in the PWA.

### D. Offline-First Capability
* **Local Caching:** The entire team database is downloaded to the device's IndexedDB for lightning-fast offline searching.
* **Offline Creation:** Mechanics can create new logs while entirely offline. These are stored in a local "Outbox".
* **Background Sync:** Upon detecting network connection, the app automatically pushes the Outbox to the cloud and pulls down any updates from the team.

---

## 4. Challenges & Simple Solutions (Engineering & UX)

To keep development fast and prevent bugs, we are strictly avoiding complex engineering where a simple rule will suffice.

| Challenge | The "Keep It Simple" Solution |
| :--- | :--- |
| **Offline Sync Conflicts** (e.g., Mechanic A and B edit the same log while offline). | **Disable Offline Editing.** When offline, users can *create* new logs and *read* all logs. Editing an existing log requires an active internet connection. |
| **Handling Offline Images** (Uploading a 5MB photo with no internet). | **Local Base64 Compression.** Compress the image heavily on the client side (under 500kb). Save it as a Base64 string in IndexedDB. When online, upload it to cloud storage and replace the DB string with the cloud URL. |
| **PWA Cache Invalidation** (Users stuck on an old version of the app). | **Toast Notification.** Use the `next-pwa` lifecycle hooks. When a new deployment happens on Vercel, a simple popup appears: *"New update available. Click to refresh."* |
| **Authentication Friction** (Mechanics forgetting passwords). | **Persistent Magic Links or Simple PIN.** Use persistent local storage. They log in once per device (via email magic link or a shared team password + selecting their name) and stay logged in forever. |

---

## 5. UI/UX & Ergonomics Guidelines
* **Navigation:** Bottom tab bar with exactly three options: `[🏠 Feed/Search]`, `[➕ Add New (Huge Button)]`, `[📋 Pending Tasks]`.
* **Tap Targets:** Minimum 48x48 pixels for all buttons to accommodate gloves.
* **Contrast & Colors:** Use distinct, color-blind-friendly indicators (e.g., clear icons alongside colors to denote Fixed vs. Pending).
* **Minimal Typing:** Use dropdowns and chips wherever possible. The only required typing should be the specific details of the fix.

---

## 6. Non-Goals (Out of Scope for V1)
*To prevent scope creep, the following are explicitly excluded from V1:*
* Complex role-based permissions (Admin vs. User). Everyone has equal access.
* Spare parts inventory tracking.
* Automated preventative maintenance scheduling.
* In-app chat/messaging (rely on WhatsApp for communication).
