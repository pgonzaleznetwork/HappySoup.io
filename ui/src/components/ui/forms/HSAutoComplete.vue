<template>
    <div class="hs-autocomplete-wrapper">
        <!-- Label (optional) -->
        <label 
            v-if="label" 
            :for="fieldId"
            class="block text-surface-700 dark:text-surface-300 text-sm font-medium mb-2"
        >
            {{ label }}
            <span v-if="required" class="text-red-500 ml-1">*</span>
        </label>

        <!-- AutoComplete Component -->
        <AutoComplete
            :id="fieldId"
            :model-value="modelValue"
            @update:model-value="handleModelUpdate"
            :suggestions="filteredSuggestions"
            :disabled="disabled"
            :delay="delay"
            :option-label="optionLabel"
            :min-length="minLength"
            :placeholder="placeholder"
            :invalid="invalid"
            :loading="loading"
            :complete-on-focus="completeOnFocus"
            :size="size"
            fluid
            @complete="handleComplete"
            @option-select="handleSelect"
            @clear="handleClear"
            @focus="handleFocus"
            @blur="handleBlur"
        >
            <!-- Custom option template with highlighting -->
            <template #option="{ option }">
                <div 
                    v-if="enableHighlighting && option[highlightField]" 
                    v-html="option[highlightField]"
                    class="hs-autocomplete-option"
                />
                <div v-else class="hs-autocomplete-option">
                    {{ getOptionDisplay(option) }}
                </div>
            </template>

            <!-- Loading template -->
            <template v-if="$slots.loading" #loading>
                <slot name="loading" />
            </template>

            <!-- Empty template -->
            <template v-if="$slots.empty" #empty>
                <slot name="empty" />
            </template>
        </AutoComplete>

        <!-- Help text or error message -->
        <div v-if="helpText || errorMessage" class="mt-2">
            <p 
                v-if="errorMessage" 
                class="text-red-600 dark:text-red-400 text-sm"
                :id="`${fieldId}-error`"
            >
                {{ errorMessage }}
            </p>
            <p 
                v-else-if="helpText" 
                class="text-surface-500 dark:text-surface-400 text-sm"
                :id="`${fieldId}-help`"
            >
                {{ helpText }}
            </p>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';

// Props
const props = defineProps({
    // Core functionality
    modelValue: {
        type: [String, Object, Array],
        default: ''
    },
    suggestions: {
        type: Array,
        default: () => []
    },
    
    // Display options
    label: {
        type: String,
        default: ''
    },
    placeholder: {
        type: String,
        default: 'Type to search...'
    },
    optionLabel: {
        type: String,
        default: 'label'
    },
    
    // Search behavior
    minLength: {
        type: Number,
        default: 3
    },
    delay: {
        type: Number,
        default: 700
    },
    completeOnFocus: {
        type: Boolean,
        default: true
    },
    
    // Highlighting
    enableHighlighting: {
        type: Boolean,
        default: true
    },
    highlightField: {
        type: String,
        default: 'highlightedLabel'
    },
    highlightColor: {
        type: String,
        default: 'var(--p-primary-color)'
    },
    
    // State
    disabled: {
        type: Boolean,
        default: false
    },
    loading: {
        type: Boolean,
        default: false
    },
    invalid: {
        type: Boolean,
        default: false
    },
    required: {
        type: Boolean,
        default: false
    },
    
    // Styling
    size: {
        type: String,
        default: 'normal',
        validator: (value) => ['small', 'normal', 'large'].includes(value)
    },
    variant: {
        type: String,
        default: 'default',
        validator: (value) => ['default', 'filled', 'outlined'].includes(value)
    },
    
    // Messages
    helpText: {
        type: String,
        default: ''
    },
    errorMessage: {
        type: String,
        default: ''
    },
    
    // Advanced
    fieldId: {
        type: String,
        default: () => `hs-autocomplete-${Math.random().toString(36).substr(2, 9)}`
    }
});

// Emits
const emit = defineEmits([
    'update:modelValue',
    'complete',
    'select',
    'clear',
    'focus',
    'blur'
]);

// Reactive data
const filteredSuggestions = ref([]);
const currentQuery = ref('');


// Methods
const getOptionDisplay = (option) => {
    if (typeof option === 'string') return option;
    if (typeof option === 'object' && option !== null) {
        return option[props.optionLabel] || option.label || option.name || String(option);
    }
    return String(option);
};

const createHighlightedLabel = (item, query) => {
    if (!props.enableHighlighting || !query) return item;
    
    const displayText = getOptionDisplay(item);
    const lowerDisplayText = displayText.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const startIndex = lowerDisplayText.indexOf(lowerQuery);
    
    if (startIndex >= 0) {
        const beforeMatch = displayText.substr(0, startIndex);
        const matchText = displayText.substr(startIndex, query.length);
        const afterMatch = displayText.substr(startIndex + query.length);
        
        return `${beforeMatch}<strong style="color: ${props.highlightColor};">${matchText}</strong>${afterMatch}`;
    }
    
    return displayText;
};

const filterSuggestions = (query) => {
    if (!query || query.length < props.minLength) {
        filteredSuggestions.value = [];
        return;
    }
    
    const lowerQuery = query.toLowerCase();
    
    const filtered = props.suggestions
        .filter(item => {
            const displayText = getOptionDisplay(item).toLowerCase();
            return displayText.includes(lowerQuery);
        })
        .map(item => {
            // Create a copy with highlighted label
            const itemCopy = typeof item === 'object' ? { ...item } : { [props.optionLabel]: item };
            
            if (props.enableHighlighting) {
                itemCopy[props.highlightField] = createHighlightedLabel(item, query);
            }
            
            return itemCopy;
        })
        .sort((a, b) => {
            const aText = getOptionDisplay(a);
            const bText = getOptionDisplay(b);
            return aText.localeCompare(bText);
        });
    
    filteredSuggestions.value = filtered;
};

// Event handlers
const handleModelUpdate = (value) => {
    emit('update:modelValue', value);
};

const handleComplete = (event) => {
    currentQuery.value = event.query;
    filterSuggestions(event.query);
    emit('complete', event);
};

const handleSelect = (event) => {
    emit('update:modelValue', event.value);
    emit('select', event);
};

const handleClear = (event) => {
    emit('update:modelValue', '');
    emit('clear', event);
};

const handleFocus = (event) => {
    emit('focus', event);
};

const handleBlur = (event) => {
    emit('blur', event);
};

// Watchers
watch(() => props.suggestions, () => {
    if (currentQuery.value) {
        filterSuggestions(currentQuery.value);
    }
}, { deep: true });

// Expose methods for parent components
defineExpose({
    focus: () => {
        nextTick(() => {
            const input = document.getElementById(props.fieldId);
            if (input) input.focus();
        });
    },
    clear: () => {
        emit('update:modelValue', '');
        emit('clear', { value: '' });
    }
});
</script>

<style scoped>
.hs-autocomplete-wrapper {
    @apply relative;
}

.hs-autocomplete-option {
    @apply py-2 px-3 cursor-pointer transition-colors duration-150;
}

.hs-autocomplete-option:hover {
    @apply bg-surface-100 dark:bg-surface-700;
}

/* Custom styling for highlighted text */
:deep(.hs-autocomplete-option strong) {
    @apply font-semibold;
}

/* Loading state styling */
:deep(.p-autocomplete-loading) {
    @apply opacity-70;
}

/* Error state styling */
:deep(.p-invalid) {
    @apply border-red-500 dark:border-red-400;
}
</style>
