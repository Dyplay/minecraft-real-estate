import { PostHog } from 'posthog-js';

// Initialize PostHog in a way that works with Next.js
export const posthog = typeof window !== 'undefined' 
  ? new PostHog('phc_h21zzWfAPEPB8iWh6rDbpKamIkLfo2pylAE3JX3SWia', { 
      api_host: 'https://eu.i.posthog.com',  // or your self-hosted URL
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          // Disable capturing in development
          posthog.opt_out_capturing();
        }
      }
    }) 
  : null;

// Helper to check if PostHog is available
export const isPostHogAvailable = () => Boolean(posthog && posthog.capture);

// Wrapper for capturing events safely
export const captureEvent = (eventName, properties = {}) => {
  if (isPostHogAvailable()) {
    posthog.capture(eventName, properties);
  }
};

// Identify users when they log in
export const identifyUser = (userId, userProperties = {}) => {
  if (isPostHogAvailable()) {
    posthog.identify(userId, userProperties);
  }
};

// Reset user when they log out
export const resetUser = () => {
  if (isPostHogAvailable()) {
    posthog.reset();
  }
}; 