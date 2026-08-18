/** Sign-in expires after this much time with no user activity. */
export const SESSION_IDLE_MS = 5 * 60 * 60 * 1000;
export const SESSION_IDLE_SECONDS = 5 * 60 * 60;

/** How often an active tab may refresh the JWT so the idle clock can extend. */
export const SESSION_TOUCH_THROTTLE_MS = 60 * 1000;
