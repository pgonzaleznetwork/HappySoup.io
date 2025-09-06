<template>
    <div class="space-y-4 max-w-sm">
        <!-- Metadata Type Selection -->
        <div class="space-y-2">
            <label class="block text-surface-700 dark:text-surface-300 text-sm font-medium">
                {{ dropdownName }}
            </label>
            <div class="relative">
                <i class="pi pi-code absolute left-3 top-1/2 transform -translate-y-1/2 text-surface-400 dark:text-surface-500 z-10" />
                <Select v-model="selectedType" :options="types" option-label="label" option-value="value" placeholder="Select..." :disabled="isLoading" @change="getMembers" fluid class="pl-10" />
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="!done" class="space-y-3">
            <p class="text-surface-600 dark:text-surface-400 text-sm">Loading metadata. This can take a minute in large orgs (specially sandboxes)</p>
            <ProgressBar mode="indeterminate" class="h-2" />
        </div>

        <!-- Error Display -->
        <div v-if="!isLoading && apiError">
            <Message severity="error" :closable="false">
                <template #messageicon>
                    <i class="pi pi-times-circle" />
                </template>
                <div class="ml-2">
                    <div v-if="apiError.message === 'session-expired'">
                        <p class="font-medium">Session Expired</p>
                        <p class="text-sm mt-1">Redirecting to login...</p>
                    </div>
                    <div v-else-if="apiError.message === 'no-sfdc-connection'">
                        <p class="font-medium">Unable to connect to Salesforce</p>
                        <p class="text-sm mt-1">
                            Please check your internet connection or the status of your org at
                            <a href="https://trust.salesforce.com" target="_blank" class="text-primary-600 hover:text-primary-700 underline"> trust.salesforce.com </a>
                        </p>
                    </div>
                    <div v-else>
                        <p class="font-medium">Something went wrong</p>
                        <p class="text-sm mt-1">
                            Please
                            <a href="https://github.com/pgonzaleznetwork/sfdc-happy-soup/issues/new" target="_blank" class="text-primary-600 hover:text-primary-700 underline"> log a GitHub issue </a>
                            with the following details:
                        </p>
                        <pre class="bg-red-100 dark:bg-red-900 p-2 rounded mt-2 text-xs overflow-auto">{{ apiError.message }}</pre>
                    </div>
                </div>
            </Message>
        </div>

        <!-- Metadata Member Autocomplete -->
        <HSAutoComplete
            v-model="selectedMemberDisplay"
            :suggestions="members"
            :label="autoCompleteName"
            :disabled="isLoading || selectedType === ''"
            :delay="700"
            option-label="name"
            :min-length="3"
            placeholder="Type at least 3 characters..."
            @complete="searchMembers"
            @select="onMemberSelect"
            @clear="onMemberClear"
        />

        <!-- Submit Button -->
        <div>
            <Button @click="emitSubmit" :disabled="isLoading || !isFormValid" icon="pi pi-search" :label="buttonLabel" fluid class="font-medium" />
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import HSAutoComplete from '@/components/ui/forms/HSAutoComplete.vue';

// Props (preserving original interface)
const props = defineProps({
    filter: String,
    values: Array,
    parentIsLoading: Boolean,
    buttonLabel: String,
    dropdownName: {
        type: String,
        default: 'Metadata Type'
    },
    autoCompleteName: {
        type: String,
        default: 'Metadata Name'
    }
});

// Emits (preserving original events)
const emit = defineEmits(['typeSelected', 'memberSelected', 'submitted']);

// Component state (preserving original data structure)
const types = ref([]);
const selectedType = ref('');
const selectedMember = ref(null);
const selectedMemberDisplay = ref('');


// API state (preserving original jobSubmission logic)
const apiError = ref(null);
const apiResponse = ref(null);
const done = ref(true);

// Job submission logic (preserved from original)
let intervalId;

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const submitJob = async (url, fetchOptions = {}) => {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

    try {
        const res = await fetch(fullUrl, {
            ...fetchOptions,
            credentials: 'include'
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

// Computed properties (preserving original logic)
const isLoading = computed(() => !done.value || props.parentIsLoading);

const isFormValid = computed(() => {
    return selectedType.value !== '' && selectedType.value !== null && selectedMember.value !== null && Object.keys(selectedMember.value || {}).length !== 0;
});

const members = computed(() => apiResponse.value || []);

// Methods (preserving original functionality)
const emitSubmit = () => {
    emit('submitted');
};

const onMemberSelect = (event) => {
    const member = event.value;
    selectedMember.value = member;
    selectedMemberDisplay.value = member.name;
    emit('memberSelected', member);
};

const onMemberClear = () => {
    selectedMember.value = null;
    selectedMemberDisplay.value = '';
    emit('memberSelected', null);
};

const searchMembers = () => {
    // HSAutoComplete handles the filtering internally
    // We just need to emit the complete event if needed
    // The component will handle highlighting and filtering automatically
};

const getMembers = async () => {
    if (!selectedType.value) return;

    const data = {
        metadataType: selectedType.value
    };

    const fetchOptions = createPostRequest(data);

    done.value = false;
    emit('typeSelected', selectedType.value);
    await submitJob('/api/metadata', fetchOptions);
};

// Watchers (preserving original behavior)
watch(done, (newDone, oldDone) => {
    if (!oldDone && newDone && !apiError.value) {
        renameSelectedLabel();
    }
});

// Helper methods (preserving original functionality)
const renameSelectedLabel = () => {
    if (!members.value || members.value.length === 0) return;

    const typeIndex = types.value.findIndex((type) => type.value === selectedType.value);
    if (typeIndex >= 0) {
        const label = types.value[typeIndex].label;
        if (label.includes('(') && label.includes(')')) return;
        types.value[typeIndex].label = `${label} (${members.value.length})`;
    }
};

// Error handling (preserving original logic)
watch(
    apiError,
    (error) => {
        if (error?.message === 'session-expired') {
            window.location = '/?logout=true';
        }
    },
    { immediate: true }
);

// Initialization (preserving original beforeMount logic)
onMounted(async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/metadata`, {
            credentials: 'include'
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        let allTypes = await res.json();

        if (props.filter) {
            if (props.filter === 'exclude') {
                types.value = allTypes.filter((type) => {
                    return !props.values.includes(type.value);
                });
            } else if (props.filter === 'only') {
                types.value = allTypes.filter((type) => {
                    return props.values.includes(type.value);
                });
            }
        } else {
            types.value = allTypes;
        }
    } catch (error) {
        console.error('Failed to load metadata types:', error);
        apiError.value = {
            message: 'Failed to load metadata types',
            details: error.message
        };
    }
});
</script>

<style scoped>
/* Component is styled using Tailwind and PrimeVue themes */
</style>
