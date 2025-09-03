<script setup>
import Logo from '@/components/ui/svgs/Logo.vue';
import DashboardSkeleton from './DashboardSkeleton.vue';
import OrgRegistration from '@/components/auth/OrgRegistration.vue';
import { ref, computed, onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';
import { useMutation } from '@tanstack/vue-query';
import FeatureList from '@/components/ui/features/FeatureList.vue';
import { useAuthStore } from '@/stores/auth';
import { useClipboard } from '@vueuse/core';
import Message from 'primevue/message';

const router = useRouter();
const auth = useAuthStore();
const isCheckingAuth = ref(true);
const errorMessage = ref('');
const showError = ref(false);

// Clipboard functionality with VueUse
const { copy, copied, isSupported: clipboardSupported } = useClipboard({ legacy: true });

const lastLoginData = computed(() => {
    if (typeof window !== 'undefined') {
        const maskedUsername = localStorage.getItem('happysoup-last-login-username');
        const maskedEmail = localStorage.getItem('happysoup-user-email');
        const firstName = localStorage.getItem('happysoup-user-firstname');
        const originalUsername = localStorage.getItem('happysoup-original-username');
        
        if (maskedUsername && maskedEmail && firstName && originalUsername) {
            return { 
                username: maskedUsername, 
                email: maskedEmail, 
                firstName,
                originalUsername 
            };
        }
    }
    return null;
});



const { isPending, mutate } = useMutation({
    mutationKey: ['salesforce-oauth'],
    mutationFn: async (requestURL) => {
        // Perform the redirect
        window.location.href = requestURL;
        
        // This return is just for completeness, the redirect will happen before this
        return { redirected: true };
    }
});

const handleOrgSubmit = ({ requestURL }) => {
    // Just trigger the mutation with the URL from the component
    mutate(requestURL);
};

const handleOrgError = (error) => {
    errorMessage.value = error;
    showError.value = true;
};

const processUrlParams = () => {
    const params = new URLSearchParams(location.search);

    if (params.has('logout')) {
        errorMessage.value = 'Your Salesforce session has expired. <b>Please</b> log in again.';
        showError.value = true;
    }

    if (params.has('oauthfailed')) {
        errorMessage.value = '<span>We were unable to log into your salesforce org. Try <b>clearing</b> the cache and cookies, using another browser or another org.</span>';
        showError.value = true;
    }

    // The original frontend had logic to redirect to dependencies page if no session parameter
    // For now, we'll keep it simple and just show the login form
};

onBeforeMount(async () => {
    // Process URL parameters first
    processUrlParams();
    
    // Ensure session is fetched before checking authentication status
    if (!auth.isLoaded && !auth.isLoading) {
        try {
            await auth.fetchSession();
            if (auth.isAuthenticated) {
                router.push('/app');
                return;
            }
        } catch (error) {
            // Expected when not logged in - just continue to show login form
            console.log('Not authenticated (expected):', error.message);
        }
    }
    
    isCheckingAuth.value = false;
});
</script>

<template>
    <div>
        
        <!-- Dashboard-like skeleton while checking auth -->
        <DashboardSkeleton v-if="isCheckingAuth" />
        
        <!-- Original login form -->
        <section v-else class="flex min-h-screen h-screen w-full items-stretch animate-fadein animate-duration-300 animate-ease-in max-w-[100rem] mx-auto">
            

            
            <div class="w-1/2 flex flex-col justify-center h-full">
                

                
                <div class="max-w-md mx-auto w-full py-20">
                    <!-- Logo -->
                    <div class="flex items-center justify-center lg:justify-start mb-8">
                        <router-link to="/">
                            <Logo />
                        </router-link>
                    </div>

                    <!-- Title -->
                    <h5 class="title-h5 text-center lg:text-left mb-4">Enter HappySoup.io</h5>

                    <!-- Subtitle -->
                    <p class="body-medium text-center lg:text-left text-slate-600 mb-6">Don't break your Salesforce org, drink a happy soup instead</p>
                    
                    <!-- Welcome Message -->
                    <div v-if="lastLoginData" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div class="text-green-800">
                            <div class="flex items-center mb-3">
                                <i class="pi pi-user mr-2" />
                                <span class="text-base">Welcome, {{ lastLoginData.firstName }} ({{ lastLoginData.email }})</span>
                            </div>
                            
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-gray-600">You last logged in with username:</span>
                                <div class="flex items-center gap-2">
                                    <span class="font-medium text-gray-800">{{ lastLoginData.username }}</span>
                                    <button 
                                        @click="copy(lastLoginData.originalUsername)"
                                        :class="[
                                            'transition-colors p-1 rounded',
                                            copied ? 'text-green-600' : 'text-gray-400 hover:text-green-600'
                                        ]"
                                        type="button"
                                        :title="copied ? 'Copied!' : 'Copy full username'"
                                        v-if="clipboardSupported"
                                    >
                                        <i :class="copied ? 'pi pi-check text-xs' : 'pi pi-copy text-xs'" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Divider -->
                    <div class="border-t border-gray-200 mb-8" />

                    <!-- Error Message -->
                    <Message v-if="showError" severity="error" class="mb-6" @close="showError = false">
                        <span v-html="errorMessage"></span>
                    </Message>

                    <!-- Form -->
                    <OrgRegistration @submit="handleOrgSubmit" @error="handleOrgError" :disabled="isPending" />

                    <!-- Footer -->
                    <div class="mt-8 text-center lg:text-left">
                        <a href="https://github.com/pgonzaleznetwork/sfdc-happy-soup#happysoupio" target="_blank" class="text-sm text-blue-600 hover:text-blue-800 underline">Documentation</a>
                    </div>
                </div>
            </div>
            <div class="hidden lg:flex w-1/2 h-full bg-slate-100 flex-col justify-center">
                <FeatureList />
            </div>
        </section>
    </div>
</template>
