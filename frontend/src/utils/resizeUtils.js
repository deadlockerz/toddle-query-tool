/**
 * Utilities to help handle ResizeObserver more efficiently
 */

/**
 * Creates a debounced resize observer to prevent loops and excessive callbacks
 * @param {Function} callback - Function to call when resize is complete
 * @param {number} delay - Debounce delay in ms
 * @returns {ResizeObserver} - Debounced resize observer
 */
export function createDebouncedResizeObserver(callback, delay = 100) {
  let timeoutId = null;

  const observer = new ResizeObserver((entries) => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      callback(entries);
    }, delay);
  });

  return observer;
}

/**
 * Hook to safely observe element resizes
 * @param {Function} callback - Function to call when element resizes
 * @param {Array} deps - Dependencies array for the hook
 * @returns {Function} - Ref callback to attach to observed element
 */
export function useSafeResizeObserver(callback, deps = []) {
  const observer = React.useRef(null);
  const ref = React.useRef(null);

  React.useEffect(() => {
    // Clean up previous observer if it exists
    if (observer.current) {
      observer.current.disconnect();
    }

    // Create new debounced observer
    observer.current = createDebouncedResizeObserver(callback);

    // Observe element if ref is set
    if (ref.current) {
      observer.current.observe(ref.current);
    }

    // Clean up on unmount
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, deps);

  // Return ref setter function
  return (element) => {
    if (element) {
      ref.current = element;
      if (observer.current) {
        observer.current.observe(element);
      }
    } else if (ref.current && observer.current) {
      observer.current.unobserve(ref.current);
      ref.current = null;
    }
  };
}
