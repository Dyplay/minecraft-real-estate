import { PostHog } from 'posthog-js';

// Only initialize PostHog on the client side
let posthog = null;

// This will only run on the client
if (typeof window !== 'undefined') {
  posthog = new PostHog('YOUR_POSTHOG_API_KEY', { 
    api_host: 'https://app.posthog.com',
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') {
        ph.opt_out_capturing();
      }
    }
  });
}

// Helper to check if PostHog is available
export const isPostHogAvailable = () => Boolean(posthog && posthog.capture);

// Wrapper for capturing events safely with better error handling
export const captureEvent = (eventName, properties = {}) => {
  // Only run on client and add detailed logging
  if (typeof window !== 'undefined') {
    console.log(`Attempting to capture event: ${eventName}`, properties);
    
    setTimeout(() => {
      try {
        if (window.posthog) {
          console.log(`Sending event to PostHog: ${eventName}`);
          window.posthog.capture(eventName, properties);
          console.log(`Event sent successfully: ${eventName}`);
        } else {
          console.warn(`PostHog not available when trying to send: ${eventName}`);
        }
      } catch (error) {
        console.error(`Error capturing event ${eventName}:`, error);
      }
    }, 100);
  } else {
    console.log(`Skipped event ${eventName} - not on client side`);
  }
};

// Identify users when they log in
export const identifyUser = (userId, userProperties = {}) => {
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      if (window.posthog) {
        window.posthog.identify(userId, userProperties);
      }
    }, 100);
  }
};

// Reset user when they log out
export const resetUser = () => {
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      if (window.posthog) {
        window.posthog.reset();
      }
    }, 100);
  }
};

// No need to export posthog instance 