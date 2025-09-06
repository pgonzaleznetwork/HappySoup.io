<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import MetadataSelection from '@/components/metadata-visualization/MetadataSelection.vue';

// Composables and stores
const auth = useAuthStore();
const router = useRouter();

// Component state
const userInfo = ref(null);
const isLoading = ref(true);

// Usage form state (preserving original logic)
const selectedType = ref('');
const selectedMember = ref({});
const usageFlags = ref({});
const showModal = ref(false);


// API state (preserving original jobSubmission logic)
const apiError = ref(null);
const apiResponse = ref(null);
const done = ref(true);

// Types to exclude from metadata selection (preserved from original)
const typesToExclude = ['ValidationRule', 'Layout'];

// Job submission logic (preserved from original)
let intervalId;

// API base URL - in development, proxy to backend on port 3000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const submitJob = async (url, fetchOptions = {}) => {
    // Ensure URL is absolute for cross-origin requests
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}/${url}`;

    try {
        const res = await fetch(fullUrl, {
            ...fetchOptions,
            credentials: 'include' // Include cookies for session management
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const json = await res.json();
        const { jobId, error } = json;

        if (jobId) {
            intervalId = window.setInterval(checkJobStatus, 6000, jobId);
        } else if (error) {
            apiError.value = json;
            done.value = true;
        } else {
            // got cached data
            apiResponse.value = json;
            done.value = true;
        }
    } catch (error) {
        console.error('API call failed:', error);
        apiError.value = {
            message: 'Failed to connect to the server',
            details: error.message
        };
        done.value = true;
    }
};

const checkJobStatus = async (jobId) => {
    const fullUrl = `${API_BASE_URL}/api/job/${jobId}`;

    try {
        const res = await fetch(fullUrl, {
            credentials: 'include'
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const result = await res.json();
        const { state, error, response } = result;

        if (state === 'completed') {
            window.clearInterval(intervalId);
            apiResponse.value = response;
            done.value = true;
            console.log(response);
        } else if (state === 'failed') {
            window.clearInterval(intervalId);
            apiError.value = error;
            done.value = true;
            console.error('failed', apiError.value);
        }
    } catch (error) {
        console.error('Job status check failed:', error);
        window.clearInterval(intervalId);
        apiError.value = {
            message: 'Failed to check job status',
            details: error.message
        };
        done.value = true;
    }
};

const createPostRequest = (data) => {
    return {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
};

// Component methods (preserving original logic)
const getSelectedType = (type) => {
    selectedType.value = type;
};

const getSelectedMember = (member) => {
    selectedMember.value = member;
};

const toggleModal = () => {
    showModal.value = !showModal.value;
};

const setFlag = (data) => {
    usageFlags.value[data.value] = data.ticked;
};

const submitUsageJob = async () => {
    done.value = false;

    const data = {
        entryPoint: {
            name: selectedMember.value.name,
            id: selectedMember.value.id,
            type: selectedType.value,
            options: usageFlags.value
        }
    };

    const fetchOptions = createPostRequest(data);
    await submitJob('api/usage', fetchOptions);
};

// Computed properties (preserving original logic)
const isLoadingJob = computed(() => !done.value);

const flags = computed(() => {
    if (selectedType.value === 'CustomField') {
        return [
            {
                label: 'Field in metadata types',
                value: 'fieldInMetadataTypes',
                description: 'Show whether the field is referenced in the FieldDefinition fields of Custom Metadata Types'
            },
            {
                label: 'Field population by record type',
                value: 'fieldUtilization',
                description: 'Show in how many records the field is populated, broken down by record type'
            }
        ];
    } else if (selectedType.value === 'StandardField') {
        return [
            {
                label: 'Field population by record type',
                value: 'fieldUtilization',
                description: 'Show in how many records the field is populated, broken down by record type'
            }
        ];
    } else if (selectedType.value === 'ApexClass') {
        return [
            {
                label: 'Class in Metadata Types',
                value: 'classInMetadataTypes',
                description: 'Show whether the apex class is referenced in any field of any of Custom Metadata Type for dependency injection/table-driven triggers'
            }
        ];
    } else if (selectedType.value === 'CustomObject') {
        return [
            {
                label: 'Object in Metadata Types',
                value: 'objectInMetadataTypes',
                description: 'Show whether the object is referenced in the EntityDefinition fields of Custom Metadata Types'
            }
        ];
    }
    return [];
});

// Auth check on mount
onMounted(async () => {
    console.log('[USAGE PAGE] Component mounted');
    try {
        console.log('[USAGE PAGE] Fetching user session...');
        await auth.fetchSession();
        userInfo.value = auth.user;
        isLoading.value = false;

        console.log('[USAGE PAGE] Auth state after fetch:', {
            isAuthenticated: auth.isAuthenticated,
            user: auth.user
        });

        if (!auth.isAuthenticated) {
            console.log('[USAGE PAGE] Not authenticated, redirecting to login');
            router.push('/');
        } else {
            console.log('[USAGE PAGE] Successfully authenticated, staying on page');
        }
    } catch (error) {
        console.error('[USAGE PAGE] Failed to fetch user session:', error);
        router.push('/?logout=true');
    }
});
</script>

<template>
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center min-h-64">
        <div class="text-center">
            <i class="pi pi-spin pi-spinner text-4xl text-primary-500 mb-4" />
            <h3 class="text-surface-600 dark:text-surface-400 font-medium mb-2">Loading...</h3>
            <p class="text-surface-500 dark:text-surface-400 text-sm">Verifying your session</p>
        </div>
    </div>

    <!-- Impact Analysis Page -->
    <div v-else-if="userInfo" class="card">
        <div class="max-w-6xl">
            <!-- Page Header -->
            <div class="mb-6">
                <h2 class="text-surface-900 dark:text-surface-0 font-semibold text-lg mb-2">Impact Analysis</h2>
                <p class="text-surface-600 dark:text-surface-400 text-sm">
                    Understand what could break when you make changes to your metadata by discovering all the dependencies.
                    <button @click="toggleModal" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium ml-1 inline-flex items-center">
                        Learn more
                        <i class="pi pi-external-link ml-1 text-xs" />
                    </button>
                </p>
            </div>

            <!-- Form Section -->
            <div class="flex flex-col lg:flex-row gap-6 mb-6">
                <!-- Metadata Selection Section -->
                <div class="flex-1">
                    <div class="bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg p-6">
                        <h3 class="text-surface-900 dark:text-surface-0 font-semibold text-lg mb-4">Select Metadata</h3>

                        <!-- MetadataSelection Component -->
                        <MetadataSelection
                            @type-selected="getSelectedType"
                            @member-selected="getSelectedMember"
                            @submitted="submitUsageJob"
                            :filter="'exclude'"
                            :values="typesToExclude"
                            :parent-is-loading="isLoadingJob"
                            :button-label="'Analyze Impact'"
                        />
                    </div>
                </div>

                <!-- Options Section -->
                <div v-if="flags?.length" class="flex-1 lg:max-w-md">
                    <div class="bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg p-6">
                        <h3 class="text-surface-900 dark:text-surface-0 font-semibold text-lg mb-4">Additional Options</h3>

                        <div class="space-y-4">
                            <div v-for="flag in flags" :key="flag.value" class="flex items-start space-x-3">
                                <Checkbox :id="flag.value" v-model="usageFlags[flag.value]" :binary="true" @change="setFlag({ value: flag.value, ticked: usageFlags[flag.value] })" />
                                <div class="flex-1">
                                    <label :for="flag.value" class="text-surface-900 dark:text-surface-0 text-sm font-medium cursor-pointer">
                                        {{ flag.label }}
                                    </label>
                                    <div class="flex items-center mt-1">
                                        <p class="text-surface-600 dark:text-surface-400 text-xs">
                                            {{ flag.description }}
                                        </p>
                                        <i class="pi pi-question-circle text-surface-400 dark:text-surface-500 ml-2 cursor-help" :title="flag.description" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Results Section -->
            <div class="space-y-6">
                <!-- Loading Progress -->
                <div v-if="isLoadingJob" class="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-blue-900 dark:text-blue-100 font-semibold mb-1">Analyzing Dependencies</h3>
                            <p class="text-blue-700 dark:text-blue-300 text-sm">Searching for metadata references across your org...</p>
                        </div>
                        <div class="flex items-center space-x-3">
                            <i class="pi pi-spin pi-spinner text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <ProgressBar mode="indeterminate" class="h-2 mt-4" />
                </div>

                <!-- Results Content -->
                <div v-else-if="!isLoadingJob && apiResponse" class="space-y-4">
                    <!-- Results Summary -->
                    <div class="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-green-900 dark:text-green-100 font-semibold mb-1">Analysis Complete</h3>
                                <p class="text-green-700 dark:text-green-300 text-sm">Found dependencies for {{ selectedMember.name || 'selected metadata' }}</p>
                            </div>
                            <div class="text-green-600 dark:text-green-400 text-xs">
                                <i class="pi pi-clock mr-1" />
                                {{ new Date().toLocaleTimeString() }}
                            </div>
                        </div>
                    </div>

                    <!-- Placeholder for DependencyResultPanel -->
                    <div class="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
                        <div class="bg-surface-100 dark:bg-surface-800 px-4 py-3">
                            <div class="flex items-center">
                                <i class="pi pi-sitemap text-surface-600 dark:text-surface-400 mr-2" />
                                <span class="font-semibold text-surface-900 dark:text-surface-0">Dependency Results</span>
                            </div>
                        </div>
                        <div class="p-4">
                            <p class="text-surface-600 dark:text-surface-400 text-sm mb-3">Results received! This component will display the metadata dependency tree.</p>
                            <pre class="bg-surface-100 dark:bg-surface-800 p-3 rounded text-xs overflow-auto">{{ JSON.stringify(apiResponse, null, 2) }}</pre>
                        </div>
                    </div>
                </div>

                <!-- Error Display -->
                <div v-else-if="!isLoadingJob && apiError" class="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div class="flex items-center">
                        <i class="pi pi-exclamation-triangle text-red-600 dark:text-red-400 mr-2" />
                        <div>
                            <h4 class="text-red-800 dark:text-red-200 font-medium">{{ apiError.message || 'An unexpected error occurred' }}</h4>
                            <p v-if="apiError.details" class="text-red-700 dark:text-red-300 text-sm mt-1">{{ apiError.details }}</p>
                        </div>
                    </div>
                    <pre v-if="apiError.details" class="bg-red-100 dark:bg-red-900 p-2 rounded mt-3 text-xs overflow-auto">{{ JSON.stringify(apiError, null, 2) }}</pre>
                </div>

                <!-- Empty State -->
                <div v-else class="text-center py-12">
                    <i class="pi pi-search text-4xl text-surface-400 mb-4" />
                    <h3 class="text-surface-600 dark:text-surface-400 font-medium mb-2">Ready to analyze</h3>
                    <p class="text-surface-500 dark:text-surface-400 text-sm">Select a metadata type and member to see where it's used</p>
                </div>
            </div>

            <!-- Learn More Modal -->
            <Dialog v-model:visible="showModal" modal :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
                <template #header>
                    <div class="flex items-center">
                        <i class="pi pi-info-circle mr-2" />
                        <span class="font-semibold">Impact Analysis</span>
                    </div>
                </template>

                <div class="space-y-4">
                    <div>
                        <h3 class="text-surface-900 dark:text-surface-0 font-semibold text-lg mb-3">What is Impact Analysis?</h3>
                        <p class="text-surface-600 dark:text-surface-400 mb-4">Your custom fields, apex classes and other types of metadata don't live in isolation. They are most likely used by other metadata types, for example:</p>
                        <ul class="list-disc list-inside space-y-1 text-surface-600 dark:text-surface-400 ml-4">
                            <li>Custom fields are used by page layouts, apex classes, email templates, etc.</li>
                            <li>Email templates are used by workflow alerts or approval processes; or even apex.</li>
                            <li>Apex classes can be used by visualforce pages or apex triggers</li>
                        </ul>
                        <p class="text-surface-600 dark:text-surface-400 mt-4">With this said, it's important to understand what is the impact of making changes to a particular piece of metadata.</p>
                    </div>

                    <div>
                        <h3 class="text-surface-900 dark:text-surface-0 font-semibold text-lg mb-3">Use cases</h3>
                        <p class="text-surface-600 dark:text-surface-400 mb-3">You can use this feature to answer questions like:</p>
                        <ul class="list-disc list-inside space-y-1 text-surface-600 dark:text-surface-400 ml-4">
                            <li>What reports will be impacted if I rename this picklist value?</li>
                            <li>I keep getting this email when an account is created, which workflow is sending the email template?</li>
                            <li>I'm converting custom labels into custom metadata types, how do I know where the labels are used?</li>
                        </ul>
                    </div>
                </div>
            </Dialog>
        </div>
    </div>
</template>
