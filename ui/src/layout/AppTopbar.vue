<script setup>
import { useLayout } from '@/layout/composables/layout';
import { ref } from 'vue';
import AppBreadcrumb from './AppBreadcrumb.vue';
import { useAuthStore } from '@/stores/auth';
import OrgSwitcher from '@/components/auth/OrgSwitcher.vue';
import InviteMembersDialog from '@/components/auth/InviteMembersDialog.vue';
const { layoutState, isDarkTheme, toggleMenu, toggleConfigSidebar } = useLayout();
const auth = useAuthStore();

const showInviteDialog = ref(false);

const notificationsBars = [
    {
        id: 'inbox',
        label: 'Inbox',
        badge: '2'
    },
    {
        id: 'general',
        label: 'General'
    },
    {
        id: 'archived',
        label: 'Archived'
    }
];

const selectedNotificationBar = ref(notificationsBars?.[0].id ?? 'inbox');

const notifications = [
    {
        id: 'inbox',
        data: [
            {
                image: '/demo/images/avatar/avatar-square-m-2.jpg',
                name: 'Michael Lee',
                description: 'You have a new message from the support team regarding your recent inquiry.',
                time: '1 hour ago',
                new: true
            },
            {
                image: '/demo/images/avatar/avatar-square-f-1.jpg',
                name: 'Alice Johnson',
                description: 'Your report has been successfully submitted and is under review.',
                time: '10 minutes ago',
                new: true
            },
            {
                image: '/demo/images/avatar/avatar-square-f-2.jpg',
                name: 'Emily Davis',
                description: 'The project deadline has been updated to September 30th. Please check the details.',
                time: 'Yesterday at 4:35 PM',
                new: false
            }
        ]
    },
    {
        id: 'general',
        data: [
            {
                image: '/demo/images/avatar/avatar-square-f-1.jpg',
                name: 'Alice Johnson',
                description: 'Reminder: Your subscription is about to expire in 3 days. Renew now to avoid interruption.',
                time: '30 minutes ago',
                new: true
            },
            {
                image: '/demo/images/avatar/avatar-square-m-2.jpg',
                name: 'Michael Lee',
                description: 'The server maintenance has been completed successfully. No further downtime is expected.',
                time: 'Yesterday at 2:15 PM',
                new: false
            }
        ]
    },
    {
        id: 'archived',
        data: [
            {
                image: '/demo/images/avatar/avatar-square-m-1.jpg',
                name: 'Lucas Brown',
                description: 'Your appointment with Dr. Anderson has been confirmed for October 12th at 10:00 AM.',
                time: '1 week ago',
                new: true
            },
            {
                image: '/demo/images/avatar/avatar-square-f-2.jpg',
                name: 'Emily Davis',
                description: 'The document you uploaded has been successfully archived for future reference.',
                time: '2 weeks ago',
                new: false
            }
        ]
    }
];

function showRightMenu() {
    layoutState.rightMenuVisible = !layoutState.rightMenuVisible;
}

const logout = async () => {
    await auth.logout();
    window.location.href = '/';
};
</script>

<template>
    <div class="layout-topbar">
        <div class="topbar-left">
            <a tabindex="0" class="menu-button" @click="toggleMenu">
                <i class="pi pi-chevron-left" />
            </a>
            <img class="horizontal-logo" src="/layout/images/logo-white.svg" alt="diamond-layout" />
            <span class="topbar-separator" />
            <AppBreadcrumb />
            <img class="mobile-logo" :src="`/layout/images/logo-${isDarkTheme ? 'white' : 'dark'}.svg`" alt="diamond-layout" />
        </div>

        <div class="topbar-right">
            <ul class="topbar-menu">
                <li class="right-sidebar-item static sm:relative">
                    <a
                        v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveActiveClass: 'animate-fadeout', leaveToClass: 'hidden', hideOnOutsideClick: true }"
                        class="right-sidebar-button relative z-50"
                    >
                        <span class="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-2.5" />
                        <i class="pi pi-bell" />
                    </a>
                    <div
                        class="list-none m-0 rounded-2xl border border-surface absolute bg-surface-0 dark:bg-surface-900 overflow-hidden hidden origin-top min-w-72 sm:w-[22rem] mt-2 right-0 z-50 top-auto shadow-[0px_56px_16px_0px_rgba(0,0,0,0.00),0px_36px_14px_0px_rgba(0,0,0,0.01),0px_20px_12px_0px_rgba(0,0,0,0.02),0px_9px_9px_0px_rgba(0,0,0,0.03),0px_2px_5px_0px_rgba(0,0,0,0.04)]"
                    >
                        <div class="p-4 flex items-center justify-between border-b border-surface">
                            <span class="label-small text-surface-950 dark:text-surface-0">Notifications</span>
                            <button class="py-1 px-2 text-surface-950 dark:text-surface-0 label-x-small hover:bg-emphasis border border-surface rounded-lg shadow-[0px_1px_2px_0px_rgba(18,18,23,0.05)] transition-all">Mark all as read</button>
                        </div>
                        <div class="flex items-center border-b border-surface">
                            <button
                                v-for="(item, index) of notificationsBars"
                                :key="index"
                                @click="selectedNotificationBar = item.id"
                                :class="selectedNotificationBar === item.id ? 'border-surface-950 dark:border-surface-0' : 'border-transparent'"
                                class="px-3.5 py-2 inline-flex items-center border-b gap-2"
                            >
                                <span :class="selectedNotificationBar === item.id ? 'text-surface-950 dark:text-surface-0' : ''" class="label-small">{{ item.label }}</span>
                                <Badge v-if="item?.badge" :value="item.badge" severity="success" size="small" class="!rounded-md" />
                            </button>
                        </div>
                        <ul class="flex flex-col divide-y divide-[var(--surface-border)] max-h-80 overflow-auto">
                            <li v-for="(item, index) of notifications.find((f) => f.id === selectedNotificationBar).data" :key="index">
                                <div class="flex items-center gap-3 px-6 py-3.5 cursor-pointer hover:bg-emphasis transition-all">
                                    <OverlayBadge value="" severity="danger" class="inline-flex">
                                        <Avatar :image="item.image" size="large" pt:image:class="!rounded-lg" />
                                    </OverlayBadge>
                                    <div class="flex items-center gap-3">
                                        <div class="flex flex-col">
                                            <span class="label-small text-left text-surface-950 dark:text-surface-0">{{ item.name }}</span>
                                            <span class="label-xsmall text-left line-clamp-1">{{ item.description }}</span>
                                            <span class="label-xsmall text-left">{{ item.time }}</span>
                                        </div>
                                        <Badge v-if="item.new" value="" severity="success" />
                                    </div>
                                </div>
                                <span v-if="index !== notifications.length - 1" />
                            </li>
                        </ul>
                    </div>
                </li>

                <li class="right-sidebar-item">
                    <OrgSwitcher @invite-members="() => { showInviteDialog = true; }" />
                </li>
            </ul>
        </div>
        <InviteMembersDialog v-model:visible="showInviteDialog" />
    </div>
</template>
