# Side-by-Side UI Comparison Setup

## Quick Start

Run both UIs simultaneously for comparison:

```bash
npm run start:compare
```

This will:
1. Start Docker services (backend + old UI) on port 3000
2. Start the new UI on port 5173

## Access URLs

- **Old UI (Bulma + Vue CLI)**: http://localhost:3000
- **New UI (Tailwind + Vite)**: http://localhost:5173
- **Backend API**: http://localhost:3000/api

## What to Compare

### Login Page Functionality
Both UIs should have identical functionality:

#### ✅ Test Cases
1. **Login Type Selection**
   - Select Sandbox → form should be valid with privacy policy
   - Select Production → form should be valid with privacy policy  
   - Select My Domain → should show domain input field

2. **My Domain Validation**
   - Enter invalid domain → should show red border/error
   - Enter valid domain (https://test.my.salesforce.com) → should show green checkmark

3. **Privacy Policy**
   - Checkbox must be checked for form to be valid
   - Link should point to GitHub privacy policy

4. **Error Scenarios**
   - Visit: http://localhost:5173/?logout=true → should show logout error
   - Visit: http://localhost:5173/?oauthfailed=true → should show OAuth error

5. **OAuth Flow** (requires valid Salesforce org)
   - Submit form → should redirect to Salesforce OAuth
   - OAuth callback → goes to backend (http://localhost:3000/oauth2/callback)
   - After login → should redirect to new UI usage page (http://localhost:5173/app/usage)
   - You should see a success page with session information

### Visual Differences (Expected)

#### Old UI (Port 3000)
- Bulma CSS framework
- Two-column layout with Google Form iframe
- Traditional form styling
- FontAwesome icons

#### New UI (Port 5173)  
- Tailwind CSS framework
- Single column with feature showcase
- Modern PrimeVue components
- Phosphor icons
- Better responsive design
- Welcome message for returning users

## Development Workflow

### Making Changes to New UI
```bash
cd ui/
npm run start  # Runs on port 5173
```

### Making Changes to Old UI  
```bash
cd frontend/
npm run start  # Runs on port 8080 (development)
```

### Backend Changes
```bash
# Restart Docker services
npm run start:compare
```

## Troubleshooting

### CORS Issues
If you get CORS errors, make sure the backend includes both ports in CORS_DOMAINS:
- http://localhost:3000 (old UI)
- http://localhost:5173 (new UI)

### Environment Variables
The new UI expects a `.env.local` file with:
```env
VITE_API_URL=http://localhost:3000
VITE_NODE_ENV=development
VITE_HIGHLIGHT_PROJECT_ID=
```

### Port Conflicts
- Old UI (production build): Port 3000
- New UI (development): Port 5173
- Backend API: Port 3000
- MongoDB: Port 27017
- Redis: Port 6379

## Next Steps

Once you're satisfied with the login page migration:

1. Test all functionality thoroughly
2. Compare user experience
3. Note any issues or improvements needed
4. Use this setup to migrate other pages (usage, workflows, etc.)

## Stopping Services

```bash
# Stop Docker services
docker-compose down

# Stop new UI development server
# Ctrl+C in the terminal running the new UI
```
