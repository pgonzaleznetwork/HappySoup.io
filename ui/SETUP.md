# HappySoup UI Setup Guide

## Quick Start

### 1. Environment Variables

Create a `.env` file in the `ui/` directory:

```env
VITE_API_URL=http://localhost:3000
VITE_NODE_ENV=development
VITE_HIGHLIGHT_PROJECT_ID=
```

### 2. Install Dependencies

```bash
cd ui/
npm install
```

### 3. Start Development Server

```bash
npm run start
```

The UI will be available at `http://localhost:5173` (or the next available port).

### 4. Backend Requirements

Make sure the backend is running on port 3000:

```bash
cd ../backend/
# Install backend dependencies and start server
# The backend should be available at http://localhost:3000
```

## Testing the Login Migration

1. Visit `http://localhost:5173` 
2. You should see the new login page with:
   - HappySoup logo
   - Login type dropdown (Sandbox/Production/My Domain)
   - Privacy policy checkbox
   - Modern Tailwind styling
   - Feature list on the right side

3. Test functionality:
   - Select different login types
   - For "My Domain", enter a domain and verify validation
   - Try submitting the form (requires backend to be running)
   - Test error scenarios by adding URL parameters like `?logout=true` or `?oauthfailed=true`

## Development Commands

- `npm run start` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Key Features Migrated

✅ Login type selection (Sandbox/Production/My Domain)  
✅ Domain validation with visual feedback  
✅ Privacy policy checkbox  
✅ OAuth URL construction and client ID fetching  
✅ URL parameter processing for errors  
✅ Error message display  
✅ Modern responsive design  
✅ Accessibility improvements  

## Next Steps

This setup provides the foundation for migrating other pages from the old frontend. Each page should follow the same pattern established in the login migration.
