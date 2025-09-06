<script setup>
import { ref, computed } from 'vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import HSFormField from '../ui/forms/HSFormField.vue';
import HSFormLayout from '../ui/forms/HSFormLayout.vue';
import EmailTagInput from './EmailTagInput.vue';
import { useToast } from 'primevue/usetoast';
import Select from 'primevue/select';
import { useMutation } from '@tanstack/vue-query';
import axios from 'axios';

const toast = useToast();

const props = defineProps({
    visible: Boolean
});
const emit = defineEmits(['update:visible']);

const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

const emails = ref([]);
const role = ref('');

function resetForm() {
    emails.value = [];
    role.value = '';
    selectedRole.value = roles[1];
}

const { mutate: sendInviteMutation, isPending } = useMutation({
    mutationKey: ['send-invites'],
    mutationFn: async () => {
        await axios.post(`${import.meta.env.VITE_API_URL}/invitation`, {
            emails: emails.value,
            role: selectedRole.value.label
        });
    },
    onSuccess: () => {
        resetForm();
        emit('update:visible', false);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Invites sent successfully', life: 3000 });
    },
    onError: (error) => {
        console.error('Failed to send invites:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to send invites. Please try again.',
            life: 5000
        });
    }
});

async function sendInvite() {
    sendInviteMutation();
}

const roles = [
    {
        label: 'Admin',
        description: 'Can manage users, Salesforce orgs, and global settings.'
    },
    {
        label: 'Standard',
        description: 'Can manage their own Salesforce orgs.'
    }
];

const selectedRole = ref(roles[1]);

const explanation = `Type or paste comma-separated emails. Formats like `;
const example = `Pablo <pablo@HappySoup.com>`;
const explanationEnd = ` work just fine.`;
</script>
<template>
    <Dialog v-model:visible="dialogVisible" modal :style="{ width: '40rem' }" @hide="resetForm">
        <template #header> <span class="font-medium">Invite Members</span> </template>
        <div class="flex items-center gap-2 mb-8">
            <span class="text-surface-500 dark:text-surface-400">
                {{ explanation }}<span class="bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded font-mono text-sm">{{ example }}</span
                >{{ explanationEnd }}
            </span>
        </div>
        <HSFormLayout>
            <HSFormField label="Email addresses">
                <template #input>
                    <EmailTagInput v-model="emails" @emailAdded="(email) => console.log('Email added:', email)" @emailRemoved="(email) => console.log('Email removed:', email)" />
                </template>
            </HSFormField>
            <HSFormField label="Role">
                <template #input>
                    <Select v-model="selectedRole" :options="roles" optionLabel="label" placeholder="Select Role" class="w-full">
                        <!-- Custom selected value display -->
                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="flex flex-col">
                                <span class="font-medium">{{ slotProps.value.label }}</span>
                            </div>
                            <span v-else>{{ slotProps.placeholder }}</span>
                        </template>

                        <!-- Custom dropdown option display -->
                        <template #option="slotProps">
                            <div class="flex flex-col p-2">
                                <span class="font-medium">{{ slotProps.option.label }}</span>
                                <span class="text-sm text-gray-500">{{ slotProps.option.description }}</span>
                            </div>
                        </template>
                    </Select>
                </template>
            </HSFormField>
        </HSFormLayout>
        <template #footer>
            <Button label="Send Invite" @click="sendInvite" :disabled="!emails.length || isPending" :loading="isPending" autofocus />
        </template>
    </Dialog>
</template>
