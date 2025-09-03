<script setup>
import { useLayout } from '@/layout/composables/layout';
import { nextTick, onBeforeMount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute();

const { layoutConfig, layoutState, setActiveMenuItem, toggleMenu, isHorizontal, isSlim, isCompact, isDesktop, isStatic } = useLayout();

const props = defineProps({
    item: {
        type: Object,
        default: () => ({})
    },
    index: {
        type: Number,
        default: 0
    },
    root: {
        type: Boolean,
        default: true
    },
    parentItemKey: {
        type: String,
        default: null
    },
    rootIndex: {
        type: Number,
        default: 0
    }
});

const isActiveMenu = ref(false);
const itemKey = ref(null);
const subMenuRef = ref(null);
const menuItemRef = ref(null);

onBeforeMount(() => {
    itemKey.value = props.parentItemKey ? props.parentItemKey + '-' + props.index : String(props.index);

    const activeItem = layoutState.activeMenuItem;

    isActiveMenu.value = activeItem === itemKey.value || activeItem ? activeItem.startsWith(itemKey.value + '-') : false;
    handleRouteChange(route.path);
});

watch(
    () => isActiveMenu.value,
    () => {
        if ((isSlim.value || isCompact.value || isHorizontal.value) && isDesktop) {
            nextTick(() => {
                if (subMenuRef.value && subMenuRef.value.parentElement) {
                    calculatePosition(subMenuRef.value, subMenuRef.value.parentElement);
                }
            });
        }
    }
);

watch(
    () => layoutState.activeMenuItem,
    (newVal) => {
        isActiveMenu.value = newVal === itemKey.value || newVal.startsWith(itemKey.value + '-');
    }
);

watch(
    () => layoutConfig.menuMode,
    () => {
        isActiveMenu.value = false;
    }
);

watch(
    () => layoutState.overlaySubmenuActive,
    (newValue) => {
        if (!newValue) {
            isActiveMenu.value = false;
        }
    }
);
watch(
    () => route.path,
    (newPath) => {
        if (!(isSlim.value || isCompact.value || isHorizontal.value) && props.item.to && props.item.to === newPath) {
            setActiveMenuItem(itemKey);
        } else if (isSlim.value || isCompact.value || isHorizontal.value) {
            isActiveMenu.value = false;
        }
    }
);

watch(() => route.path, handleRouteChange);

function handleRouteChange(newPath) {
    if (!(isSlim.value || isCompact.value || isHorizontal.value) && props.item.to && props.item.to === newPath) {
        setActiveMenuItem(itemKey);
    } else if (isSlim.value || isCompact.value || isHorizontal.value) {
        isActiveMenu.value = false;
    }
}

const itemClick = async (event, item) => {
    if (item.disabled) {
        event.preventDefault();
        return;
    }

    const { overlayMenuActive, staticMenuMobileActive } = layoutState;

    if ((item.to || item.url) && (staticMenuMobileActive || overlayMenuActive)) {
        toggleMenu();
    }

    if (item.command) {
        item.command({ originalEvent: event, item: item });
    }

    if (item.items) {
        if (props.root && isActiveMenu.value && (isSlim.value || isCompact.value || isHorizontal.value)) {
            layoutState.overlaySubmenuActive = false;
            layoutState.menuHoverActive = false;

            return;
        }

        setActiveMenuItem(isActiveMenu.value ? props.parentItemKey : itemKey);

        if (props.root && !isActiveMenu.value && (isSlim.value || isCompact.value || isHorizontal.value)) {
            layoutState.overlaySubmenuActive = true;
            layoutState.menuHoverActive = true;
            isActiveMenu.value = true;

            removeAllTooltips();
        }
    } else {
        if (!isDesktop.value) {
            layoutState.staticMenuMobileActive = !layoutState.staticMenuMobileActive;
        }

        if (isSlim.value || isCompact.value || isHorizontal.value) {
            layoutState.overlaySubmenuActive = false;
            layoutState.menuHoverActive = false;

            return;
        }

        setActiveMenuItem(itemKey);
    }
};

const onMouseEnter = () => {
    if (props.root && (isSlim.value || isCompact.value || isHorizontal.value) && isDesktop) {
        if (!isActiveMenu.value && layoutState.menuHoverActive) {
            setActiveMenuItem(itemKey);
        }
    }
};
const removeAllTooltips = () => {
    const tooltips = document.querySelectorAll('.p-tooltip');
    tooltips.forEach((tooltip) => {
        tooltip.remove();
    });
};
const calculatePosition = (overlay, target) => {
    if (overlay && target) {
        const { left, top } = target.getBoundingClientRect();

        const vHeight = window.innerHeight;
        const oHeight = overlay.offsetHeight;

        overlay.style.top = '';
        overlay.style.left = '';

        if (isHorizontal.value) {
            overlay.style.left = `${left}px`;
        } else if (isSlim.value || isCompact.value) {
            const height = top + oHeight;
            overlay.style.top = vHeight < height ? `${top - (height - vHeight)}px` : `${top}px`;
        }
    }
};

const checkActiveRoute = (item) => {
    return route.path === item.to;
};
</script>

<template>
    <li ref="menuItemRef" :class="{ 'layout-root-menuitem': root, 'active-menuitem': isStatic ? !root && isActiveMenu : isActiveMenu }">
        <div v-if="root && item.visible !== false" class="layout-menuitem-root-text">{{ item.label }}</div>
        <a
            v-if="(!item.to || item.items) && item.visible !== false"
            :href="item.url"
            @click="itemClick($event, item, index)"
            :class="item.class"
            :target="item.target"
            tabindex="0"
            @mouseenter="onMouseEnter"
            v-tooltip.hover="isCompact && root && !isActiveMenu ? item.label : null"
        >
            <component :is="item.icon" class="layout-menuitem-icon" weight="regular" />
            <span class="layout-menuitem-text label-small text-inherit">{{ item.label }}</span>
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="item.items" />
        </a>
        <router-link
            v-if="item.to && !item.items && item.visible !== false"
            @click="itemClick($event, item, index)"
            :class="[item.class, { 'active-route': checkActiveRoute(item) }]"
            tabindex="0"
            :to="item.to"
            @mouseenter="onMouseEnter"
            v-tooltip.hover="isCompact && root && !isActiveMenu ? item.label : null"
        >
            <component :is="item.icon" class="layout-menuitem-icon" weight="regular" />
            <span class="layout-menuitem-text label-small text-inherit">{{ item.label }}</span>
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="item.items" />
        </router-link>

        <ul ref="subMenuRef" :class="{ 'layout-root-submenulist': root }" v-if="item.items && item.visible !== false">
            <app-menu-item v-for="(child, i) in item.items" :key="child" :index="i" :item="child" :parentItemKey="itemKey" :root="false" :rootIndex="props.index" />
        </ul>
    </li>
</template>
