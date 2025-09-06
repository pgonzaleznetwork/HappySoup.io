<script setup>
import { useLayout } from '@/layout/composables/layout';
import AppMenu from './AppMenu.vue';
import AppTopbar from './AppTopbar.vue';

const { layoutState, isHorizontal } = useLayout();

let timeout = null;

function onMouseEnter() {
    if (!layoutState.anchored) {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        layoutState.sidebarActive = true;
    }
}

function onMouseLeave() {
    if (!layoutState.anchored) {
        if (!timeout) {
            timeout = setTimeout(() => (layoutState.sidebarActive = false), 300);
        }
    }
}

function onAnchorToggle() {
    layoutState.anchored = !layoutState.anchored;
}
</script>

<template>
    <div class="layout-sidebar" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
        <div class="sidebar-header">
            <router-link :to="{ name: 'impact-analysis' }" class="logo">
                <span class="app-name title-h7">HappySoup</span>
            </router-link>
            <i
                v-show="layoutState.sidebarActive || layoutState.anchored"
                v-tooltip.bottom="layoutState.anchored ? 'Close menu' : 'Lock menu'"
                :class="['sidebar-lock', layoutState.anchored ? 'pi pi-lock' : 'pi pi-lock-open']"
                @click="onAnchorToggle"
            />
        </div>
        <div class="layout-menu-container">
            <AppMenu />
        </div>
        <AppTopbar v-if="isHorizontal" />
    </div>
</template>

<style scoped>
.sidebar-lock {
    color: rgba(255, 255, 255, 0.87);
    cursor: pointer;
}
</style>
