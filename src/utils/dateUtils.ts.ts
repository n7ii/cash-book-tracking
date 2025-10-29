/**
 * Formats a date string (from the API) into Laos local time (+07).
 * @param dateString The ISO date string from the database (e.g., "2025-10-23T02:16:50.000Z").
 * @param options Intl.DateTimeFormatOptions to customize the output format.
 * @returns A formatted date string in Laos time, or 'Invalid Date' if input is bad.
 */
export const formatToLaosTime = (
    dateString: string | null | undefined,
    options: Intl.DateTimeFormatOptions = {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', hour12: true,
        timeZone: 'Asia/Vientiane' // Directly specify the target timezone
    }
): string => {
    if (!dateString) {
        return '-'; // Or 'N/A', or whatever you prefer for missing dates
    }
    try {
        const date = new Date(dateString);
        // Check if the date object is valid
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        // Use Intl.DateTimeFormat for robust timezone handling
        return new Intl.DateTimeFormat('en-GB', options).format(date);
    } catch (error) {
        console.error("Error formatting date:", error);
        return 'Invalid Date';
    }
};

/**
 * Formats just the date part into Laos local time.
 */
export const formatToLaosDateOnly = (dateString: string | null | undefined): string => {
    return formatToLaosTime(dateString, {
        year: 'numeric', month: 'numeric', day: 'numeric',
        timeZone: 'Asia/Vientiane'
    });
};