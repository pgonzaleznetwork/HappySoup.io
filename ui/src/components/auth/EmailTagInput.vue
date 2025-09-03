<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
    modelValue: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['update:modelValue', 'emailAdded', 'emailRemoved']);

const input = ref('');
const inputRef = ref(null);
const error = ref(false);

const emails = computed(() => props.modelValue);

// Watch for changes in the input value
watch(input, (newValue) => {
    if (newValue.includes(',')) {
        submit();
    }
});

function handleKeydown(e) {
    if (e.key === ',') {
        e.preventDefault();
        submit();
    }
}

function submit() {
    const raw = input.value.trim();
    if (!raw) return;

    const tokens = raw
        .split(/[,;]+/)
        .map((t) => t.trim())
        .filter(Boolean);

    // Extract emails from angle brackets if present
    const processedTokens = tokens.map(token => {
        const match = token.match(/<([^>]+)>/);
        if (match) {
            // If we find an email in angle brackets, use that
            return match[1].trim();
        }
        // Otherwise use the token as is
        return token;
    });

    // First validate all emails
    const invalidEmails = processedTokens.filter(token => !isValidEmail(token));
    if (invalidEmails.length > 0) {
        error.value = true;
        return;
    }

    // If all emails are valid, process them
    const validNewEmails = processedTokens.filter(token => !emails.value.includes(token));

    if (validNewEmails.length) {
        const newEmails = [...emails.value, ...validNewEmails];
        emit('update:modelValue', newEmails);
        validNewEmails.forEach(email => emit('emailAdded', email));
        error.value = false;
    } else {
        error.value = true;
    }

    input.value = '';
}

function remove(index) {
    const removedEmail = emails.value[index];
    const next = [...emails.value];
    next.splice(index, 1);
    emit('update:modelValue', next);
    emit('emailRemoved', removedEmail);
    error.value = false;
}

function handleBackspace(e) {
    if (!input.value && emails.value.length) {
        const removedEmail = emails.value[emails.value.length - 1];
        const next = [...emails.value];
        next.pop();
        emit('update:modelValue', next);
        emit('emailRemoved', removedEmail);
    }
}

function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}
</script>
<template>
    <div class="flex flex-wrap items-center gap-1 border rounded px-2 py-1 focus-within:ring-1 focus-within:ring-primary-600" :class="error ? 'border-red-500' : 'border-gray-300'">
        <span v-for="(email, index) in modelValue" :key="email" class="flex items-center text-base bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 px-2 py-0.5 ">
            {{ email }}
            <button type="button" @click="remove(index)" class="ml-1 text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200" aria-label="Remove email">✕</button>
        </span>

        <input
            ref="inputRef"
            v-model="input"
            @keydown.enter.prevent="submit"
            @keydown.tab.prevent="submit"
            @keydown="handleKeydown"
            @keydown.backspace="handleBackspace"
            @blur="submit"
            placeholder="Enter email address"
            class="flex-grow min-w-[120px] border-0 focus:ring-0 focus:outline-none text-sm text-surface-700 dark:text-surface-300"
        />
    </div>
</template>
