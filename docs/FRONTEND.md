# Frontend Documentation

## Overview

Smart Link Hub Generator frontend is a modern React/Next.js application built with TypeScript, Tailwind CSS, and Recharts for data visualization.

## Architecture

### File Structure

```
frontend/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Button.tsx      # Button component
│   │   ├── Input.tsx       # Input component
│   │   ├── Card.tsx        # Card container
│   │   ├── Modal.tsx       # Modal dialog
│   │   ├── Alert.tsx       # Alert messages
│   │   └── Layout.tsx      # Main layout with sidebar
│   ├── pages/              # Next.js pages
│   │   ├── _app.tsx        # App wrapper
│   │   ├── index.tsx       # Home page
│   │   ├── login.tsx       # Login page
│   │   ├── register.tsx    # Register page
│   │   ├── dashboard.tsx   # Hub list dashboard
│   │   ├── hubs/
│   │   │   ├── [hubId]/
│   │   │   │   ├── editor.tsx      # Hub editor with links
│   │   │   │   └── analytics.tsx   # Analytics dashboard
│   │   └── public/
│   │       └── [slug].tsx  # Public hub view
│   ├── stores/             # Zustand state management
│   │   └── auth.ts         # Auth store
│   ├── lib/                # Utilities
│   │   └── api.ts          # API client
│   └── styles/
│       └── globals.css     # Global styles
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Pages

### Public Pages (No Auth Required)

#### Login Page (`/login`)

- Email and password input
- Registration link
- Error handling
- Redirect to dashboard on success

#### Register Page (`/register`)

- Email, username, password input
- Password confirmation
- Validation
- Redirect to login on success

#### Public Hub (`/public/:slug`)

- View shared hub with links
- Click tracking
- Responsive design
- No authentication needed

### Protected Pages (Auth Required)

#### Dashboard (`/dashboard`)

- Hub list with grid layout
- Create, edit, delete hubs
- Hub statistics (views, links)
- Hub visibility toggle (public/private)
- Quick hub stats

#### Hub Editor (`/hubs/:hubId/editor`)

- Add/edit/delete links
- Link click count
- Rule configuration
- Rule list with priority
- Hub statistics

#### Analytics (`/hubs/:hubId/analytics`)

- Time window selection (24h, 7d, 30d, 90d)
- Total views and clicks
- Click rate percentage
- Views over time chart
- Clicks over time chart
- Top performing links chart
- CSV/JSON export

## Components

### Button

```tsx
<Button
  variant="primary|secondary|danger|ghost"
  size="sm|md|lg"
  isLoading={false}
  onClick={handler}
>
  Click me
</Button>
```

### Input

```tsx
<Input
  label="Field name"
  type="text|email|password"
  placeholder="Enter value"
  error="Optional error message"
  onChange={handler}
/>
```

### Card

```tsx
<Card className="optional-classes">Content here</Card>
```

### Modal

```tsx
<Modal isOpen={boolean} title="Modal Title" onClose={handler} size="sm|md|lg">
  Content here
</Modal>
```

### Alert

```tsx
<Alert
  type="success|error|warning|info"
  message="Alert message"
  onClose={handler}
/>
```

### Layout

```tsx
<Layout>Page content here (with sidebar)</Layout>
```

## State Management

### Auth Store (Zustand)

```typescript
const {
  user, // Current user or null
  isLoading, // Loading state
  error, // Error message
  isAuthenticated, // Auth status
  register, // Register function
  login, // Login function
  logout, // Logout function
  getProfile, // Get current user
  clearError, // Clear error
} = useAuth();
```

## API Client

### Methods

#### Authentication

```typescript
api.register(email, username, password);
api.login(email, password);
api.getProfile();
api.logout();
```

#### Hubs

```typescript
api.getHubs(page, limit);
api.getHub(id);
api.createHub(data);
api.updateHub(id, data);
api.deleteHub(id);
```

#### Links

```typescript
api.getLinks(hubId);
api.createLink(hubId, data);
api.updateLink(hubId, linkId, data);
api.deleteLink(hubId, linkId);
api.reorderLinks(hubId, links);
```

#### Rules

```typescript
api.getRules(hubId);
api.createRule(hubId, data);
api.updateRule(hubId, ruleId, data);
api.deleteRule(hubId, ruleId);
```

#### Analytics

```typescript
api.getAnalytics(hubId, timeWindow);
api.getLinkAnalytics(hubId, timeWindow);
api.exportAnalytics(hubId, format, timeWindow);
```

#### Public

```typescript
api.getPublicHub(slug);
```

## Styling

### Color Scheme

**Dark Theme**

- Background: `#0f172a` (slate-900)
- Surface: `#1e293b` (slate-800)
- Border: `#334155` (slate-700)

**Accent Colors**

- Primary: `#10b981` (green-600)
- Secondary: `#059669` (green-700)

### Tailwind Configuration

Custom colors defined in `tailwind.config.js`:

- `bg-dark`: Background color
- `bg-dark-surface`: Surface color
- `text-primary`: Primary text
- `hover:text-green-*`: Green hover states

## Installation & Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
# Edit .env.local with your API URL

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type check
npm run type-check
```

## Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Authentication Flow

1. User registers at `/register`
2. User logs in at `/login`
3. JWT tokens stored in cookies
4. Auth store checks on app load
5. Protected pages redirect to `/login` if not authenticated
6. Logout clears cookies and redirects

## API Integration

### Request Flow

1. User performs action
2. Component calls API method
3. API client attaches JWT token
4. Request sent to backend
5. Response returned
6. State updated in component/store

### Error Handling

- 401 Unauthorized: Redirects to login
- 400 Bad Request: Shows validation error
- 500 Server Error: Shows error alert
- Network error: Shows error message

## Development Tips

### Adding a New Page

1. Create file in `src/pages/`
2. Wrap with `<Layout>` if authenticated
3. Use API client for backend calls
4. Use Auth store for user data
5. Show/hide content based on auth state

### Adding a New Component

1. Create file in `src/components/`
2. Export as function component
3. Accept props with TypeScript interface
4. Use Tailwind for styling
5. Export from component barrel (create index.ts if needed)

### Dark Theme Utilities

- `bg-slate-900`: Dark background
- `bg-slate-800`: Card background
- `border-slate-700`: Border color
- `text-white`: Light text
- `text-gray-400`: Secondary text
- `hover:bg-slate-700`: Hover state

## Performance Optimization

- Code splitting with Next.js
- Image optimization
- API response caching (via Zustand)
- Component lazy loading ready
- CSS-in-JS with Tailwind

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Accessibility

- Semantic HTML
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators
- Color contrast compliance
- Form validation

## Security

- JWT token in secure cookies
- CORS headers respected
- XSS prevention via React
- CSRF token handling
- Input sanitization
- Password minimum length validation

## Deployment

### Vercel

```bash
npm i -g vercel
vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment for Production

```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Troubleshooting

### Port 3000 already in use

```bash
npm run dev -- -p 3001
```

### Clear cache and rebuild

```bash
rm -rf .next
npm run build
npm run dev
```

### TypeScript errors

```bash
npm run type-check
```

### Module not found

```bash
npm install
```

## Performance Metrics

- Time to interactive: < 2s
- First contentful paint: < 1.5s
- Layout shift: < 0.1
- Lighthouse score: 90+

## Future Enhancements

- Advanced rule editor with visual builder
- Real-time collaboration
- Dark/light theme toggle
- Mobile app (React Native)
- Advanced analytics (geographic, device breakdown)
- A/B testing for links
- Webhook integrations
- API rate limiting display
