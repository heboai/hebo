# Analytics Implementation

This document outlines the analytics implementation using PostHog in the Hebo FE application.

## Setup

The application uses PostHog for analytics tracking with the following configuration:
- PostHog is initialized in the `PostHogProvider` component
- Uses both client-side (`posthog-js`)
- Configured to use the EU PostHog instance (`eu.posthog.com`)

## Tracked Events

### Automatic Events

The following events are automatically tracked by PostHog:

1. **Page Views**
   - Event Name: `$pageview`
   - Properties:
     - `$current_url`: The current URL of the page
   - Triggered: On every page navigation

### User Identification

User identification is handled in the `UserDisplay` component:
- Users are identified using their user ID
- Additional user properties are tracked when available

## Implementation Details

### Client-Side Setup

The PostHog client is initialized in `src/components/PostHogProvider.tsx` with the following configuration:
```typescript
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  ui_host: "https://eu.posthog.com",
  loaded: (posthog) => {
    if (process.env.NODE_ENV === 'development') posthog.debug()
  }
})
```

### Server-Side Setup

Server-side PostHog is configured in `src/lib/posthog.ts`:
```typescript
const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST
})
```

## Environment Variables

The following environment variables are required:
- `NEXT_PUBLIC_POSTHOG_KEY`: PostHog project API key
- `NEXT_PUBLIC_POSTHOG_HOST`: PostHog instance host URL

## Best Practices

1. Always use the `usePostHog` hook from `posthog-js/react` when tracking events in React components
2. Include relevant properties with each event to provide context
3. Use consistent event naming conventions
4. Test analytics implementation in development mode using PostHog's debug mode

## Future Improvements

Consider tracking additional events for:
- User actions (clicks, form submissions)
- Feature usage
- Error tracking
- Performance metrics 