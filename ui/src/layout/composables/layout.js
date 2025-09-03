import { computed, reactive } from 'vue';

const layoutConfig = reactive({
    preset: 'Aura',
    primary: 'indigo',
    surface: null,
    darkTheme: false,
    menuMode: 'reveal',
    menuTheme: 'dark',
    cardStyle: 'transparent'
});

const layoutState = reactive({
    staticMenuDesktopInactive: false,
    overlayMenuActive: false,
    rightMenuVisible: false,
    configSidebarVisible: false,
    staticMenuMobileActive: false,
    menuHoverActive: false,
    searchBarActive: false,
    sidebarActive: false,
    anchored: false,
    activeMenuItem: null,
    overlaySubmenuActive: false
});

export function useLayout() {
    const setActiveMenuItem = (item) => {
        layoutState.activeMenuItem = item.value || item;
    };

    const toggleMenu = () => {
        if (layoutConfig.menuMode === 'overlay') {
            layoutState.overlayMenuActive = !layoutState.overlayMenuActive;
        }

        if (window.innerWidth > 991) {
            layoutState.staticMenuDesktopInactive = !layoutState.staticMenuDesktopInactive;
        } else {
            layoutState.staticMenuMobileActive = !layoutState.staticMenuMobileActive;
        }
    };

    const toggleConfigSidebar = () => {
        if (isSidebarActive.value) {
            layoutState.overlayMenuActive = false;
            layoutState.overlaySubmenuActive = false;
            layoutState.staticMenuMobileActive = false;
            layoutState.menuHoverActive = false;
        }

        layoutState.configSidebarVisible = !layoutState.configSidebarVisible;
    };

    const isDarkTheme = computed(() => layoutConfig.darkTheme);
    const isSidebarActive = computed(() => layoutState.overlayMenuActive || layoutState.staticMenuMobileActive || layoutState.overlaySubmenuActive);
    const isDesktop = computed(() => window.innerWidth > 991);
    const isSlim = computed(() => layoutConfig.menuMode === 'slim');
    const isHorizontal = computed(() => layoutConfig.menuMode === 'horizontal');
    const isOverlay = computed(() => layoutConfig.menuMode === 'overlay');
    const isCompact = computed(() => layoutConfig.menuMode === 'compact');
    const isStatic = computed(() => layoutConfig.menuMode === 'static');
    const isReveal = computed(() => layoutConfig.menuMode === 'reveal');
    const isDrawer = computed(() => layoutConfig.menuMode === 'drawer');

    return {
        layoutConfig,
        layoutState,
        isDarkTheme,
        setActiveMenuItem,
        toggleConfigSidebar,
        toggleMenu,
        isSidebarActive,
        isSlim,
        isHorizontal,
        isCompact,
        isOverlay,
        isStatic,
        isReveal,
        isDrawer,
        isDesktop
    };
}
