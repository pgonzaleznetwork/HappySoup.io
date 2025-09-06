<script setup>
import { ref, computed } from 'vue';
import Dialog from 'primevue/dialog';
import OrgRegistration from './OrgRegistration.vue';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const props = defineProps({
    modelValue: Boolean
});
const emit = defineEmits(['update:modelValue']);

const dialogVisible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});

const isConnecting = ref(false);
const orgRegistrationRef = ref(null);

function resetForm() {
    if (orgRegistrationRef.value) {
        orgRegistrationRef.value.resetForm();
    }
}

const handleOrgSubmit = ({ requestURL }) => {
    isConnecting.value = true;

    try {
        // Close dialog and redirect
        emit('update:modelValue', false);
        window.location.href = requestURL;
    } catch (error) {
        console.error('Error starting OAuth flow:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to start org connection. Please try again.',
            life: 5000
        });
        isConnecting.value = false;
    }
};
</script>

<template>
    <Dialog :visible="dialogVisible" @update:visible="dialogVisible = $event" modal :style="{ width: '40rem' }" @hide="resetForm">
        <template #header>
            <span class="font-medium">Add Salesforce Org</span>
        </template>

        <div class="flex items-center gap-2 mb-6">
            <span class="text-surface-500 dark:text-surface-400"> Connect another Salesforce org to your HappySoup account. You can switch between connected orgs anytime. </span>
        </div>

        <OrgRegistration ref="orgRegistrationRef" @submit="handleOrgSubmit" mode="add-org" :disabled="isConnecting" />
    </Dialog>
</template>
