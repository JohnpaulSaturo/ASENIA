# E-QR Attendance Monitoring System (Next.js)

## Requirements
- Node.js 20.9 or newer
- Internet for the first `npm install`

## Run the project
1. Extract this ZIP.
2. Open the extracted `eqr-attendance-nextjs` folder in VS Code.
3. Open Terminal in that folder.
4. Run:

   ```bash
   npm install
   npm run dev
   ```

5. Open http://localhost:3000

## Included in this prototype
- QR image upload and decoding in the browser using `jsQR` (no camera permission needed for image upload).
- Manual QR/student ID entry as a fallback.
- Create and delete class sections.
- Add students and assign sections.
- Attendance records with duplicate-scan prevention for the same date.
- Confirmation modals for delete, reject, and approve actions.
- Teacher request review example.
- Saves demo data to the current browser's localStorage.

## Important limitations
This is a front-end prototype, not a secure production attendance system. Data is stored in the browser on the current device and is not shared between teachers or devices. The Teacher/Student/Admin selector is only a preview switch, not real authentication or access control. The approve/reject actions are demonstrations. For a real school deployment, connect a backend/database, implement secure authentication and role-based authorization, and validate student QR identifiers server-side.

For image scanning to work, the QR image must contain a registered student's ID (for example `STU-1001`) or their LRN. The sample student has ID `STU-1001`.