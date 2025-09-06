<script setup>
import Skeleton from 'primevue/skeleton';
</script>

<template>
    <!-- Dashboard-like skeleton -->
    <div class="min-h-screen bg-gray-50 flex">
        <!-- Sidebar -->
        <div class="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
            <!-- Logo area -->
            <div class="p-6 border-b border-gray-200">
                <Skeleton width="8rem" height="2rem" />
            </div>

            <!-- Navigation items -->
            <div class="flex-1 p-4 space-y-2">
                <div v-for="i in 6" :key="i" class="flex items-center space-x-3 p-3">
                    <Skeleton width="1.5rem" height="1.5rem" />
                    <Skeleton width="6rem" height="1rem" />
                </div>
            </div>

            <!-- Bottom section -->
            <div class="p-4 border-t border-gray-200">
                <div class="flex items-center space-x-3 p-3">
                    <Skeleton width="2rem" height="2rem" />
                    <div class="flex-1">
                        <Skeleton width="4rem" height="0.875rem" class="mb-1" />
                        <Skeleton width="6rem" height="0.75rem" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Main content -->
        <div class="flex-1 flex flex-col">
            <!-- Top navigation bar -->
            <div class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
                <div class="flex items-center justify-between">
                    <!-- Page title -->
                    <Skeleton width="8rem" height="1.5rem" />

                    <!-- Right side - user menu and settings -->
                    <div class="flex items-center space-x-4">
                        <!-- Settings button -->
                        <Skeleton width="2rem" height="2rem" />
                        <!-- User avatar -->
                        <Skeleton width="2rem" height="2rem" />
                    </div>
                </div>
            </div>

            <!-- Main dashboard content -->
            <div class="flex-1 p-6">
                <!-- Stats cards row -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div v-for="i in 4" :key="i" class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div class="flex items-center justify-between mb-4">
                            <Skeleton width="3rem" height="3rem" />
                            <Skeleton width="1.5rem" height="1.5rem" />
                        </div>
                        <Skeleton width="4rem" height="2rem" class="mb-2" />
                        <Skeleton width="6rem" height="1rem" />
                    </div>
                </div>

                <!-- Main content area -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Large chart/content area -->
                    <div class="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div class="flex items-center justify-between mb-6">
                            <Skeleton width="8rem" height="1.5rem" />
                            <Skeleton width="6rem" height="2rem" />
                        </div>
                        <Skeleton width="100%" height="20rem" />
                    </div>

                    <!-- Side panel -->
                    <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <Skeleton width="6rem" height="1.5rem" class="mb-6" />
                        <div class="space-y-4">
                            <div v-for="i in 5" :key="i" class="flex items-center space-x-3 p-3 border border-gray-100 rounded">
                                <Skeleton width="2rem" height="2rem" />
                                <div class="flex-1">
                                    <Skeleton width="70%" height="1rem" class="mb-2" />
                                    <Skeleton width="50%" height="0.75rem" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
