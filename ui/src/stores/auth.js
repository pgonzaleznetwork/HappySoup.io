import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';

/**
 * Masks an email address, showing only first 2 chars and domain
 * @param {string} email - The email to mask
 * @returns {string} - Masked email (e.g., "jo***@company.com")
 */
function maskEmail(email) {
    if (!email || !email.includes('@')) return email;

    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
        return `${localPart[0]}***@${domain}`;
    }

    return `${localPart.substring(0, 2)}***@${domain}`;
}

/**
 * Masks a username, showing more characters for longer usernames
 * Special handling for email-like usernames to show both local and domain parts
 * @param {string} username - The username to mask
 * @returns {string} - Masked username with better recognition
 */
function maskUsername(username) {
    if (!username) return username;

    // Special handling for email-like usernames
    if (username.includes('@')) {
        const [localPart, domain] = username.split('@');

        // Show first few chars of local part
        let maskedLocal;
        if (localPart.length <= 3) {
            maskedLocal = `${localPart[0]}**`;
        } else if (localPart.length <= 8) {
            maskedLocal = `${localPart.substring(0, 2)}**`;
        } else {
            maskedLocal = `${localPart.substring(0, 4)}**`;
        }

        // Show first few chars of domain
        let maskedDomain;
        if (domain.length <= 6) {
            maskedDomain = `**${domain.substring(domain.length - 3)}`;
        } else {
            maskedDomain = `**${domain.substring(domain.length - 4)}`;
        }

        return `${maskedLocal}@${maskedDomain}`;
    }

    // Regular username handling (non-email)
    const length = username.length;

    // Very short usernames - show first char only
    if (length <= 3) {
        return `${username[0]}***`;
    }

    // Short usernames (4-8 chars) - show first 2 and last 1
    if (length <= 8) {
        return `${username.substring(0, 2)}***${username.substring(length - 1)}`;
    }

    // Medium usernames (9-15 chars) - show first 3 and last 2
    if (length <= 15) {
        return `${username.substring(0, 3)}***${username.substring(length - 2)}`;
    }

    // Long usernames (16+ chars) - show first 4 and last 3
    return `${username.substring(0, 4)}***${username.substring(length - 3)}`;
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null);
    const isLoaded = ref(false);
    const isLoading = ref(false);

    const isAuthenticated = computed(() => !!user.value);

    async function fetchSession() {
        if (isLoading.value) return;

        console.log('[AUTH] Starting fetchSession...');
        isLoading.value = true;

        try {
            console.log('[AUTH] Making request to:', `${import.meta.env.VITE_API_URL}/api/auth/user`);
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/user`);
            console.log('[AUTH] Response received:', response.data);
            user.value = response.data.user;
            isLoaded.value = true;
            console.log('[AUTH] User set successfully:', user.value);

            // Store masked user data in localStorage for login page welcome message
            if (user.value.lastLoginUsername && user.value.email && user.value.firstName) {
                localStorage.setItem('happysoup-last-login-username', maskUsername(user.value.lastLoginUsername));
                localStorage.setItem('happysoup-user-email', maskEmail(user.value.email));
                localStorage.setItem('happysoup-user-firstname', user.value.firstName);

                // Store the original username separately for copy functionality
                // This is still a security consideration, but provides the UX benefit
                localStorage.setItem('happysoup-original-username', user.value.lastLoginUsername);
            }
        } catch (error) {
            console.error('[AUTH] Failed to fetch session:', error);
            console.error('[AUTH] Error details:', error.response?.data || error.message);
            user.value = null;
        } finally {
            isLoading.value = false;
            console.log('[AUTH] fetchSession completed. isAuthenticated:', !!user.value);
        }
    }

    async function logout() {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/logout`);
            user.value = null;

            // Keep localStorage data for welcome message on next login page visit
            // Data will be updated when user logs in again
        } catch (error) {
            console.error('Failed to logout:', error);
        }
    }

    return {
        user,
        isLoaded,
        isLoading,
        isAuthenticated,
        fetchSession,
        logout
    };
});
