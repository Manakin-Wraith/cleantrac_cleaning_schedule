export const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) {
            // console.error('Invalid date string provided to formatDate:', dateString);
            return dateString; // Return original string if date is invalid
        }
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
            // options.second = '2-digit'; // Seconds might be too much detail often
        }
        return date.toLocaleDateString(undefined, options);
    } catch (error) {
        console.error('Error formatting date:', dateString, error);
        return dateString; // Fallback to original string if formatting fails
    }
};

export const getTodayDateString = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        // console.warn('Invalid or null date provided to getTodayDateString, using current date.');
        date = new Date(); // Fallback to current date if input is invalid
    }
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
};