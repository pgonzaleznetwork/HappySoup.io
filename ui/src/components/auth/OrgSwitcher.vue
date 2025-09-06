<script setup>
import Avatar from 'primevue/avatar';
import Divider from 'primevue/divider';
import { PhSignOut, PhBuildingOffice, PhPlus } from '@phosphor-icons/vue';
import InputSwitch from 'primevue/inputswitch';
import Button from 'primevue/button';
import { useLayout } from '@/layout/composables/layout';
import { useRouter } from 'vue-router';
import { ref, computed } from 'vue';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import AddOrgDialog from './AddOrgDialog.vue';

const { layoutConfig } = useLayout();
const router = useRouter();
const authStore = useAuthStore();

const userEmail = computed(() => authStore.user?.email || '');
const userName = computed(() => authStore.user?.firstName || 'User');
const userInitial = computed(() => userName.value.charAt(0).toUpperCase());
const connectedOrgs = computed(() => authStore.user?.salesforceOrgs || []);
const showAddOrgDialog = ref(false);

function executeDarkModeToggle() {
    layoutConfig.darkTheme = !layoutConfig.darkTheme;
    document.documentElement.classList.toggle('app-dark');
}

function handleToggleDarkMode() {
    if (!document.startViewTransition) {
        executeDarkModeToggle();
        return;
    }

    document.startViewTransition(() => {
        executeDarkModeToggle();
    });
}

async function logout() {
    try {
        await axios.post(`${import.meta.env.VITE_API_URL}/auth/logout`);
        router.push('/');
    } catch (error) {
        console.error('Failed to logout:', error);
        // Still redirect even if logout fails
        router.push('/');
    }
}
</script>
<template>
    <div class="relative">
        <button
            class="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
            v-styleclass="{
                selector: '@next',
                enterFromClass: 'hidden',
                enterActiveClass: 'animate-scalein',
                leaveActiveClass: 'animate-fadeout',
                leaveToClass: 'hidden',
                hideOnOutsideClick: true
            }"
        >
            <Avatar :label="userInitial" class="!w-8 !h-8 !text-base !bg-surface-500 !text-white" />
            <span class="truncate max-w-[12ch] text-base font-medium text-surface-800 dark:text-surface-100">{{ userName }}</span>
            <i class="pi pi-angle-down text-surface-500 dark:text-surface-300 text-base" />
        </button>

        <div class="absolute mt-2 right-0 w-80 bg-surface-0 dark:bg-surface-900 border border-surface rounded-2xl shadow-lg z-[999] p-4 hidden">
            <!-- User Profile Section -->
            <div class="flex flex-col items-start gap-3">
                <div class="flex items-center gap-3">
                    <Avatar :label="userInitial" class="!w-12 !h-12 !text-lg !bg-surface-500 !text-white" />
                    <div class="flex flex-col">
                        <span class="font-medium text-base text-surface-900 dark:text-surface-100">{{ userName }}</span>
                        <span class="text-sm text-surface-500 dark:text-surface-400">{{ userEmail }}</span>
                    </div>
                </div>
                <Divider type="dashed" class="w-full" />
            </div>

            <!-- Connected Salesforce Orgs -->
            <div class="flex flex-col items-start gap-2 w-full">
                <div class="flex items-center justify-between w-full px-3">
                    <div class="text-sm font-semibold text-surface-500 dark:text-surface-400">Connected Salesforce Orgs</div>
                    <Button
                        @click="showAddOrgDialog = true"
                        v-tooltip.left="{
                            value: 'Add new org',
                            pt: {
                                text: '!text-xs !px-2 !py-1'
                            }
                        }"
                        severity="secondary"
                        text
                        size="small"
                        class="!p-1.5"
                    >
                        <template #icon>
                            <PhPlus :size="16" />
                        </template>
                    </Button>
                </div>
                <div v-if="connectedOrgs.length > 0" class="flex flex-col gap-1 w-full">
                    <div v-for="org in connectedOrgs" :key="org.orgId" class="flex items-center py-2 px-3 gap-3 rounded-lg text-surface-700 dark:text-surface-200 text-sm">
                        <PhBuildingOffice :size="16" class="text-surface-500 dark:text-surface-400" />
                        <div class="flex flex-col flex-1 min-w-0">
                            <span class="font-medium truncate">{{ org.username }}</span>
                            <span class="text-xs text-surface-500 dark:text-surface-400 truncate">{{ org.instanceUrl.replace('https://', '') }}</span>
                        </div>
                    </div>

                    <AddOrgDialog v-model="showAddOrgDialog" />
                </div>
                <div v-else class="text-sm text-surface-500 dark:text-surface-400 px-3 py-2 italic">No orgs connected yet</div>
                <Divider type="dashed" class="w-full" />
            </div>

            <!-- Menu Actions -->
            <div class="flex flex-col items-start gap-2 w-full">
                <button @click="logout" class="flex items-center py-3 px-3 gap-3 text-base text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg w-full">
                    <PhSignOut :size="20" />
                    <span>Log out</span>
                </button>
                <Divider type="dashed" class="w-full" />
                <div class="flex items-center justify-between py-3 px-3 w-full">
                    <span class="text-base text-surface-700 dark:text-surface-200">Dark mode</span>
                    <InputSwitch @change="handleToggleDarkMode" />
                </div>
            </div>
        </div>
    </div>
</template>
