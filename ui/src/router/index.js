import AppLayout from '@/layout/AppLayout.vue';
import AuthLayout from '@/layout/AuthLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
    {
        path: '/',
        component: AuthLayout,
        children: [
            {
                path: '',
                name: 'login',
                meta: {
                    title: 'Login'
                },
                component: () => import('@/views/auth/LoginView.vue')
            }
        ]
    },
    {
        path: '/app',
        component: AppLayout,
        meta: {
            requiresAuth: true
        },
        children: [
            {
                path: '',
                name: 'impact-analysis',
                meta: {
                    breadcrumb: ['Impact Analysis', 'Where is this used'],
                    title: 'Where is this used'
                },
                component: () => import('@/views/impact-analysis/WhereIsThisUsed.vue')
            },
            {
                path: 'usage',
                name: 'usage',
                meta: {
                    breadcrumb: ['Impact Analysis', 'Where is this used'],
                    title: 'Impact Analysis'
                },
                component: () => import('@/views/impact-analysis/UsagePage.vue')
            }
        ]
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'notfound',
        meta: {
            title: 'Page Not Found'
        },
        component: () => import('@/views/pages/NotFound.vue')
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior() {
        return { left: 0, top: 0 };
    }
});

// Add navigation guard to update document title
router.beforeEach(async (to, from, next) => {
    console.log(`[ROUTER] Navigating from ${from.path} to ${to.path}`);

    // Set document title based on route meta title or fallback to default
    document.title = to.meta.title ? `${to.meta.title} | HappySoup` : 'HappySoup';

    // Auth check for protected routes
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
    console.log(`[ROUTER] Route ${to.path} requiresAuth:`, requiresAuth);

    if (requiresAuth) {
        const auth = useAuthStore();
        console.log(`[ROUTER] Auth state - isLoaded: ${auth.isLoaded}, isLoading: ${auth.isLoading}, isAuthenticated: ${auth.isAuthenticated}`);

        if (!auth.isLoaded && !auth.isLoading) {
            console.log('[ROUTER] Fetching session...');
            await auth.fetchSession();
        }

        console.log(`[ROUTER] After session check - isAuthenticated: ${auth.isAuthenticated}`);
        if (!auth.isAuthenticated) {
            console.log('[ROUTER] Not authenticated, redirecting to login');
            return next({ name: 'login' });
        }
    }

    console.log('[ROUTER] Allowing navigation to:', to.path);
    next();
});

export default router;
