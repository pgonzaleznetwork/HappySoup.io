<script setup>
import Logo from '@/components/ui/svgs/Logo.vue';
import DashboardSkeleton from './DashboardSkeleton.vue';
import OrgRegistration from '@/components/auth/OrgRegistration.vue';
import { ref, computed, onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';
import { useMutation } from '@tanstack/vue-query';
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

// Testimonials data
const testimonials = [
    {
        comment: `"Other tools pivoted to DevOps. HappySoup stayed true to impact analysis and keeping Salesforce orgs clean."`,
        name: 'Jamie Seyler',
        title: 'Senior Salesforce Administrator',
        linkedinUrl: 'https://linkedin.com/in/jamieseyler'
    },
    {
        comment: `"HappySoup is my first step for dependency analysis. We've embedded it into our work estimation process."`,
        name: 'Chris Pearson',
        title: 'CRM Engineering Director',
        linkedinUrl: 'https://linkedin.com/in/chrispearson'
    },
    {
        comment: `"HappySoup's impact analysis provides a clear, organized and exportable view of dependencies - I highly recommend it for Salesforce professionals."`,
        name: 'Gidi Abramovich',
        title: 'Salesforce Solutions Architect',
        linkedinUrl: 'https://linkedin.com/in/gidiabramovich'
    },
    {
        comment: `"HappySoup comes in after you have looked everywhere else. You have checked the code, the flows, what's impacted, the default logs, your custom logs, and still something is missing. Fear not, HappySoup will find it."`,
        name: 'Luke Buthman',
        title: 'Senior Salesforce Developer',
        linkedinUrl: 'https://linkedin.com/in/lukebuthman'
    }
];

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
                    <h5 class="title-h5 text-center lg:text-left mb-2">HappySoup.io</h5>

                    <!-- Community Edition Badge -->
                    <div class="text-center lg:text-left mb-4">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            <i class="pi pi-globe mr-1.5 text-blue-600" style="font-size: 10px;"></i>
                            Community Edition
                        </span>
                    </div>

                    <!-- Subtitle -->
                    <p class="body-medium text-center lg:text-left text-slate-600 mb-6">Don't break your Salesforce org, drink a happy soup instead</p>
                    
                    

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
                <div class="bg-surface-50 dark:bg-surface-950 p-8 lg:p-20 h-full overflow-y-auto">
                    <div class="flex flex-col items-center gap-8 h-full justify-center">
                        <div class="flex flex-col items-center gap-4">
                            <h1 class="text-4xl font-medium text-surface-900 dark:text-surface-0 leading-tight text-center">Trusted by Salesforce professionals</h1>
                        </div>

                        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-4xl">
                            <div v-for="testimonial in testimonials" :key="testimonial.name" class="rounded-xl shadow-sm p-6 flex flex-col gap-3" style="background-color: #eef2ff;">
                                <div class="flex items-center gap-2">
                                    <i v-for="n in 5" :key="n" class="pi pi-star-fill text-xl! leading-normal! text-yellow-500" />
                                </div>
                                <p class="text-base text-surface-700 dark:text-surface-0/70 leading-normal flex-1">{{ testimonial.comment }}</p>
                                <div class="flex items-center gap-2">
                                    <div class="flex flex-col">
                                        <h3 class="text-base font-medium text-surface-900 dark:text-surface-0 leading-tight">{{ testimonial.name }}</h3>
                                        <p class="text-sm text-surface-500 dark:text-surface-400 leading-tight">{{ testimonial.title }}</p>
                                    </div>
                                    <a :href="testimonial.linkedinUrl" target="_blank" rel="noopener noreferrer" class="shrink-0">
                                        <div class="w-6 h-6 bg-blue-600 rounded flex items-center justify-center hover:bg-blue-700 transition-colors">
                                            <i class="pi pi-linkedin text-white text-xs"></i>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>
