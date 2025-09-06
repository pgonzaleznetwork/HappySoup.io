<script setup>
import Button from 'primevue/button';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import Checkbox from 'primevue/checkbox';
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const props = defineProps({
    mode: {
        type: String,
        default: '' // '' for login, 'add-org' for adding org
    },
    disabled: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['submit', 'error']);

// Form fields for Salesforce OAuth
const loginType = ref('test'); // Default to Sandbox
const domain = ref('');
const privacyAccepted = ref(false);
const clientId = ref('');

const loginTypeOptions = [
    { label: 'Sandbox', value: 'test', description: 'Sandbox or scratch orgs' },
    { label: 'Production', value: 'login', description: 'Production, dev or trailhead orgs' },
    { label: 'My Domain', value: 'domain', description: 'When standard login is disabled' }
];

const showDomain = computed(() => {
    return loginType.value === 'domain';
});

const validDomain = computed(() => {
    if (loginType.value !== 'domain') return true;
    // Match original validation: must contain 'my.salesforce.com' and start with 'https://'
    return domain.value.includes('my.salesforce.com') && domain.value.indexOf('https://') === 0;
});

const showPrivacyCheckbox = computed(() => {
    return props.mode !== 'add-org';
});

const isFormValid = computed(() => {
    const domainValid = loginType.value !== 'domain' || validDomain.value;
    const privacyValid = !showPrivacyCheckbox.value || privacyAccepted.value;
    return domainValid && privacyValid;
});

const domainColor = computed(() => {
    return {
        'border-red-500': showDomain.value && !validDomain.value,
        'border-green-500': showDomain.value && validDomain.value
    };
});

// Get client ID from backend (matching original behavior)
const getClientId = async () => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/oauthinfo/clientid`);
        clientId.value = response.data;
    } catch (error) {
        console.error('Failed to get client ID:', error);
        emit('error', 'Failed to load OAuth configuration');
    }
};

const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    try {
        // Build OAuth URL exactly like the original frontend
        let baseURL;

        if (loginType.value === 'domain') {
            let domainValue = domain.value.trim();
            // Remove trailing slash if present
            const lastCharacter = domainValue.substr(domainValue.length - 1);
            if (lastCharacter === '/') {
                domainValue = domainValue.substr(0, domainValue.length - 1);
            }
            baseURL = domainValue;
        } else {
            baseURL = `https://${loginType.value}.salesforce.com`;
        }

        const authEndPoint = `${baseURL}/services/oauth2/authorize`;
        const redirectURI = encodeURIComponent(`${import.meta.env.VITE_API_URL}/oauth2/callback`);

        const state = JSON.stringify({
            baseURL: baseURL,
            redirectURI: redirectURI
        });

        const requestURL = `${authEndPoint}?client_id=${clientId.value}&response_type=code&redirect_uri=${redirectURI}&state=${state}&prompt=select_account`;

        // Emit the same event signature that consuming components expect
        emit('submit', { requestURL, loginType: loginType.value, domain: domain.value });
    } catch (error) {
        console.error('OAuth URL generation failed:', error);
        const errorMessage = error.message || 'Failed to generate OAuth URL';
        emit('error', `Failed to start OAuth flow: ${errorMessage}`);
    }
};

// Reset form function for parent components to use
const resetForm = () => {
    loginType.value = 'test';
    domain.value = '';
    privacyAccepted.value = false;
};

onMounted(() => {
    getClientId();
});

// Expose resetForm to parent
defineExpose({ resetForm });
</script>

<template>
    <form @submit="handleSubmit" class="space-y-6">
        <!-- Login Type Field -->
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Login Type</label>
            <div class="relative">
                <i class="pi pi-database absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                <Select v-model="loginType" :options="loginTypeOptions" optionLabel="label" optionValue="value" placeholder="Select Login Type" class="w-full pl-10" :disabled="disabled">
                    <template #option="slotProps">
                        <div class="flex flex-col p-2">
                            <span class="font-medium">{{ slotProps.option.label }}</span>
                            <span class="text-sm text-gray-500">{{ slotProps.option.description }}</span>
                        </div>
                    </template>
                </Select>
            </div>
        </div>

        <!-- My Domain Field (conditional) -->
        <div v-if="showDomain">
            <label class="block text-sm font-medium text-gray-700 mb-2">My Domain</label>
            <div class="relative">
                <InputText v-model="domain" type="text" class="w-full" :class="domainColor" placeholder="https://your-domain.my.salesforce.com" :disabled="disabled" />
                <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                    <i v-if="showDomain && !validDomain" class="pi pi-exclamation-triangle text-red-500" />
                    <i v-else-if="showDomain && validDomain" class="pi pi-check text-green-500" />
                </div>
            </div>
            <small v-if="showDomain && !validDomain" class="text-red-500 text-xs mt-1">Invalid domain URL</small>
        </div>

        <!-- Privacy Policy Checkbox (conditional) -->
        <div v-if="showPrivacyCheckbox" class="flex items-start gap-3">
            <Checkbox v-model="privacyAccepted" :disabled="disabled" binary class="mt-0.5" />
            <label class="text-sm text-gray-600">
                I agree to the HappySoup.io
                <a href="https://github.com/pgonzaleznetwork/sfdc-happy-soup#privacy-policy" target="_blank" class="text-blue-600 hover:text-blue-800 underline">Privacy Policy</a>
                <span class="text-xs text-gray-500"> (last updated Sept 1, 2025)</span>
            </label>
        </div>

        <!-- Submit Button -->
        <Button type="submit" :disabled="!isFormValid || disabled" :loading="disabled" severity="primary" class="w-full">
            <i class="pi pi-cloud mr-2" />
            {{ mode === 'add-org' ? 'Connect to Org' : 'Log in with Salesforce' }}
        </Button>
    </form>
</template>
