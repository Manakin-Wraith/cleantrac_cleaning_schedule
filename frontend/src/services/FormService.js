/**
 * Form Service - Handles form submissions locally
 * This service simulates form submissions and can be extended to connect to a backend API
 */

/**
 * Submit waitlist form data
 * @param {Object} formData - The form data to submit
 * @returns {Promise} - A promise that resolves with the submission result
 */
export const submitWaitlistForm = (formData) => {
  return new Promise((resolve, reject) => {
    // Simulate network request
    setTimeout(() => {
      try {
        // Log the form data (for development purposes)
        console.log('Form submitted with data:', formData);
        
        // Simulate successful submission (90% of the time)
        if (Math.random() > 0.1) {
          resolve({
            success: true,
            message: "Thank you for joining our waitlist! We'll be in touch soon."
          });
        } else {
          // Simulate occasional error for testing error handling
          reject({
            success: false,
            message: "Oops! Something went wrong. Please try again later."
          });
        }
      } catch (error) {
        reject({
          success: false,
          message: "An unexpected error occurred. Please try again."
        });
      }
    }, 1500); // Simulate network delay
  });
};

/**
 * In a real application, this would be replaced with an actual API call
 * Example with fetch:
 * 
 * export const submitWaitlistForm = (formData) => {
 *   return fetch('/api/waitlist', {
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *     },
 *     body: JSON.stringify(formData),
 *   })
 *   .then(response => {
 *     if (!response.ok) {
 *       throw new Error('Network response was not ok');
 *     }
 *     return response.json();
 *   });
 * };
 */
