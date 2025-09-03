<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();
const userInfo = ref(null);
const isLoading = ref(true);

onMounted(async () => {
    console.log('[USAGE PAGE] Component mounted');
    try {
        console.log('[USAGE PAGE] Fetching user session...');
        // Fetch user session to confirm OAuth worked
        await auth.fetchSession();
        userInfo.value = auth.user;
        isLoading.value = false;
        
        console.log('[USAGE PAGE] Auth state after fetch:', {
            isAuthenticated: auth.isAuthenticated,
            user: auth.user
        });
        
        if (!auth.isAuthenticated) {
            console.log('[USAGE PAGE] Not authenticated, redirecting to login');
            router.push('/');
        } else {
            console.log('[USAGE PAGE] Successfully authenticated, staying on page');
        }
    } catch (error) {
        console.error('[USAGE PAGE] Failed to fetch user session:', error);
        router.push('/?logout=true');
    }
});
</script>

<template>
    <div class="card">
        <div class="max-w-4xl">
            <!-- Loading State -->
            <div v-if="isLoading" class="text-center py-8">
                <i class="pi pi-spin pi-spinner text-4xl text-primary-500 mb-4"></i>
                <h3 class="text-surface-600 dark:text-surface-400 font-medium mb-2">Loading...</h3>
                <p class="text-surface-500 dark:text-surface-400 text-sm">
                    Verifying your session
                </p>
            </div>

            <!-- Success State -->
            <div v-else-if="userInfo" class="space-y-6">
                <!-- Success Banner -->
                <div class="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6">
                    <div class="flex items-center mb-4">
                        <i class="pi pi-check-circle text-green-600 dark:text-green-400 text-2xl mr-3"></i>
                        <div>
                            <h2 class="text-green-900 dark:text-green-100 font-semibold text-xl">
                                🎉 OAuth Login Successful!
                            </h2>
                            <p class="text-green-700 dark:text-green-300 text-sm mt-1">
                                You have successfully logged in using the new UI
                            </p>
                        </div>
                    </div>
                </div>

                <!-- User Information -->
                <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg p-6">
                    <h3 class="text-surface-900 dark:text-surface-0 font-semibold text-lg mb-4 flex items-center">
                        <i class="pi pi-user mr-2"></i>
                        Session Information
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div v-if="userInfo.firstName" class="flex flex-col">
                            <span class="text-surface-500 dark:text-surface-400 text-xs uppercase tracking-wide font-medium">First Name</span>
                            <span class="text-surface-900 dark:text-surface-0 font-medium">{{ userInfo.firstName }}</span>
                        </div>
                        
                        <div v-if="userInfo.email" class="flex flex-col">
                            <span class="text-surface-500 dark:text-surface-400 text-xs uppercase tracking-wide font-medium">Email</span>
                            <span class="text-surface-900 dark:text-surface-0 font-medium">{{ userInfo.email }}</span>
                        </div>
                        
                        <div v-if="userInfo.lastLoginUsername" class="flex flex-col">
                            <span class="text-surface-500 dark:text-surface-400 text-xs uppercase tracking-wide font-medium">Salesforce Username</span>
                            <span class="text-surface-900 dark:text-surface-0 font-medium">{{ userInfo.lastLoginUsername }}</span>
                        </div>
                        
                        <div class="flex flex-col">
                            <span class="text-surface-500 dark:text-surface-400 text-xs uppercase tracking-wide font-medium">Login Time</span>
                            <span class="text-surface-900 dark:text-surface-0 font-medium">{{ new Date().toLocaleString() }}</span>
                        </div>
                    </div>
                </div>

                <!-- Migration Status -->
                <div class="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                    <h3 class="text-blue-900 dark:text-blue-100 font-semibold text-lg mb-4 flex items-center">
                        <i class="pi pi-cog mr-2"></i>
                        Migration Status
                    </h3>
                    
                    <div class="space-y-3">
                        <div class="flex items-center">
                            <i class="pi pi-check text-green-600 mr-3"></i>
                            <span class="text-blue-800 dark:text-blue-200">Login page migrated to new UI</span>
                        </div>
                        <div class="flex items-center">
                            <i class="pi pi-check text-green-600 mr-3"></i>
                            <span class="text-blue-800 dark:text-blue-200">OAuth flow working correctly</span>
                        </div>
                        <div class="flex items-center">
                            <i class="pi pi-check text-green-600 mr-3"></i>
                            <span class="text-blue-800 dark:text-blue-200">Session management functional</span>
                        </div>
                        <div class="flex items-center">
                            <i class="pi pi-clock text-orange-500 mr-3"></i>
                            <span class="text-blue-800 dark:text-blue-200">Usage/Impact Analysis page - <strong>Next to migrate</strong></span>
                        </div>
                    </div>
                </div>

                <!-- Next Steps -->
                <div class="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
                    <h3 class="text-purple-900 dark:text-purple-100 font-semibold text-lg mb-4 flex items-center">
                        <i class="pi pi-arrow-right mr-2"></i>
                        What's Next?
                    </h3>
                    
                    <div class="space-y-3 text-purple-800 dark:text-purple-200">
                        <p>✅ <strong>Login Migration Complete!</strong> Both UIs can now authenticate users.</p>
                        <p>🔄 <strong>Ready for next page:</strong> We can now migrate the Impact Analysis functionality.</p>
                        <p>📋 <strong>Other pages to migrate:</strong> Workflows, Bulk Usage, Boundaries, etc.</p>
                        <p>🎯 <strong>Goal:</strong> Gradually replace all pages while maintaining full functionality.</p>
                    </div>
                </div>

                <!-- Comparison Links -->
                <div class="bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg p-6">
                    <h3 class="text-surface-900 dark:text-surface-0 font-semibold text-lg mb-4 flex items-center">
                        <i class="pi pi-external-link mr-2"></i>
                        Compare UIs
                    </h3>
                    
                    <div class="flex flex-col sm:flex-row gap-4">
                        <a 
                            href="http://localhost:3000" 
                            target="_blank"
                            class="flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                            <i class="pi pi-external-link mr-2"></i>
                            Old UI (Port 3000)
                        </a>
                        <a 
                            href="http://localhost:5173" 
                            target="_blank"
                            class="flex items-center justify-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                        >
                            <i class="pi pi-external-link mr-2"></i>
                            New UI (Port 5173)
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
