<script setup>
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import Logo from '@/components/ui/svgs/Logo.vue';
import ZeroSad from '@/components/ui/svgs/ZeroSad.vue';
import HSFormContainer from '@/components/ui/forms/HSFormContainer.vue';
import HSFormLayout from '@/components/ui/forms/HSFormLayout.vue';

const router = useRouter();

const goHome = () => {
    router.push('/');
};

const goBack = () => {
    if (window.history.length > 1) {
        router.go(-1);
    } else {
        router.push('/');
    }
};
</script>

<template>
    <div class="w-full h-full flex items-center justify-center min-h-screen">
        <div class="flex items-start justify-center gap-[100px] max-w-4xl w-full bg-white rounded-xl shadow-none p-0 mx-auto">
            <!-- Left Column -->
            <div class="flex-1 min-w-[340px] max-w-md">
                <HSFormContainer>
                    <template #icon>
                        <Logo />
                    </template>
                    <template #title>
                        <h1 class="title-h5 text-center lg:text-left">Page Not Found</h1>
                    </template>
                    <template #form>
                        <HSFormLayout>
                            <p class="body-large mt-3.5 text-center lg:text-left text-slate-600">
                                Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
                            </p>
                            
                            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                                <h6 class="font-semibold text-blue-900 mb-2">What can you do?</h6>
                                <ul class="text-blue-800 space-y-1">
                                    <li>• Check the URL for any typos</li>
                                    <li>• Go back to the previous page</li>
                                    <li>• Return to the homepage</li>
                                    <li>• Contact support if you believe this is an error</li>
                                </ul>
                            </div>
                            
                            <div class="flex flex-col sm:flex-row gap-4 mt-8">
                                <Button 
                                    @click="goBack" 
                                    class="flex-1" 
                                    label="Go Back" 
                                    severity="secondary" 
                                    outlined 
                                />
                                <Button 
                                    @click="goHome" 
                                    class="flex-1" 
                                    label="Return Home" 
                                />
                            </div>
                        </HSFormLayout>
                    </template>
                </HSFormContainer>
            </div>

            <!-- Right Column -->
            <div class="flex-1 min-w-[320px]">
                <ZeroSad />
            </div>
        </div>
    </div>
</template>
