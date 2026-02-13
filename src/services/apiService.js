/**
 * API Service
 * Handles all HTTP requests to the backend server
 */

// Backend API configuration
// For Android emulator: 10.0.2.2 maps to host machine's localhost
// For iOS simulator: use localhost
// For physical device: use your machine's actual IP (e.g., 192.168.x.x)
const API_BASE_URL = 'http://10.0.2.2:5000/api';

/**
 * Update user service preferences
 * Sends updated preferences to backend and persists them
 * @param {string} email - User email
 * @param {object} servicePreferences - Service preferences object
 * @returns {Promise<object>} Updated user profile from backend
 */
export const updateServicePreferences = async (email, servicePreferences) => {
    try {
        console.log('[API-SERVICE] Updating preferences for:', email);
        console.log('[API-SERVICE] API_BASE_URL:', API_BASE_URL);
        console.log('[API-SERVICE] Preferences:', servicePreferences);

        const response = await fetch(`${API_BASE_URL}/auth/profile?email=${encodeURIComponent(email)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                servicePreferences,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update preferences: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[API-SERVICE] Service preferences updated successfully:', data);
        return data;
    } catch (error) {
        console.error('[API-SERVICE] Error updating service preferences:', error);
        throw error;
    }
};

/**
 * Update user grade/education standard
 * Sends grade update to backend
 * @param {string} email - User email
 * @param {string} grade - Grade number (1-12)
 * @returns {Promise<object>} Updated user profile from backend
 */
export const updateGrade = async (email, grade) => {
    try {
        console.log('[API-SERVICE] Updating grade for:', email);
        console.log('[API-SERVICE] New grade:', grade);

        const response = await fetch(`${API_BASE_URL}/auth/grade`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                educationStandard: grade,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to update grade: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[API-SERVICE] Grade updated successfully:', data);
        return data;
    } catch (error) {
        console.error('[API-SERVICE] Error updating grade:', error);
        throw error;
    }
};

/**
 * Logout user
 * Calls backend logout endpoint for audit logging
 * @param {string} email - User email
 * @returns {Promise<object>} Logout confirmation from backend
 */
export const logoutUser = async (email) => {
    try {
        console.log('[API-SERVICE] Logging out user:', email);

        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
            }),
        });

        // Don't throw on non-ok response - logout should proceed regardless
        const data = await response.json();
        console.log('[API-SERVICE] Logout response:', data);
        return data;
    } catch (error) {
        console.error('[API-SERVICE] Error during logout:', error);
        // Return error but don't throw - client-side logout will proceed
        return { error: error.message };
    }
};

export default {
    updateServicePreferences,
    updateGrade,
    logoutUser,
};
