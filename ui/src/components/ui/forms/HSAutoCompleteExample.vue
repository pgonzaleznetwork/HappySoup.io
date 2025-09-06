<template>
    <div class="space-y-6 p-6">
        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">HSAutoComplete Examples</h2>
        
        <!-- Basic Usage -->
        <div class="space-y-4">
            <h3 class="text-lg font-semibold">Basic Usage</h3>
            <HSAutoComplete
                v-model="basicValue"
                :suggestions="basicSuggestions"
                label="Choose a fruit"
                placeholder="Type to search fruits..."
                help-text="Start typing to see suggestions"
            />
            <p class="text-sm text-surface-600 dark:text-surface-400">
                Selected: {{ basicValue }}
            </p>
        </div>

        <!-- Object-based suggestions (like metadata) -->
        <div class="space-y-4">
            <h3 class="text-lg font-semibold">Object-based Suggestions</h3>
            <HSAutoComplete
                v-model="objectValue"
                :suggestions="objectSuggestions"
                label="Select a metadata type"
                placeholder="Type to search metadata..."
                option-label="name"
                :min-length="2"
                required
            />
            <p class="text-sm text-surface-600 dark:text-surface-400">
                Selected: {{ objectValue?.name || 'None' }}
            </p>
        </div>

        <!-- With custom styling -->
        <div class="space-y-4">
            <h3 class="text-lg font-semibold">Custom Styling</h3>
            <HSAutoComplete
                v-model="styledValue"
                :suggestions="styledSuggestions"
                label="Large autocomplete with custom highlight"
                placeholder="Type a programming language..."
                size="large"
                highlight-color="#10b981"
                :delay="300"
            />
        </div>

        <!-- With loading state -->
        <div class="space-y-4">
            <h3 class="text-lg font-semibold">With Loading State</h3>
            <HSAutoComplete
                v-model="loadingValue"
                :suggestions="loadingSuggestions"
                label="Search with loading"
                placeholder="Type to trigger loading..."
                :loading="isLoading"
                @complete="handleAsyncSearch"
            />
        </div>

        <!-- With error state -->
        <div class="space-y-4">
            <h3 class="text-lg font-semibold">With Validation</h3>
            <HSAutoComplete
                v-model="validationValue"
                :suggestions="basicSuggestions"
                label="Required field"
                placeholder="This field is required..."
                required
                :invalid="!validationValue"
                :error-message="!validationValue ? 'This field is required' : ''"
            />
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import HSAutoComplete from './HSAutoComplete.vue';

// Basic example data
const basicValue = ref('');
const basicSuggestions = ref([
    'Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 
    'Fig', 'Grape', 'Honeydew', 'Kiwi', 'Lemon'
]);

// Object-based example (like metadata)
const objectValue = ref(null);
const objectSuggestions = ref([
    { id: '1', name: 'Account.CustomField__c', type: 'CustomField' },
    { id: '2', name: 'Case.CustomDate__c', type: 'CustomField' },
    { id: '3', name: 'Customer_Support_Setting__c.Email_Address__c', type: 'CustomField' },
    { id: '4', name: 'Opportunity.Amount', type: 'StandardField' },
    { id: '5', name: 'MyApexClass', type: 'ApexClass' },
    { id: '6', name: 'MyCustomObject__c', type: 'CustomObject' }
]);

// Styled example
const styledValue = ref('');
const styledSuggestions = ref([
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 
    'Go', 'Rust', 'Swift', 'Kotlin', 'Vue.js'
]);

// Loading example
const loadingValue = ref('');
const loadingSuggestions = ref([]);
const isLoading = ref(false);

const handleAsyncSearch = async (event) => {
    if (event.query.length < 2) return;
    
    isLoading.value = true;
    
    // Simulate API call
    setTimeout(() => {
        loadingSuggestions.value = [
            `${event.query} Result 1`,
            `${event.query} Result 2`,
            `${event.query} Result 3`,
            `Advanced ${event.query}`,
            `Custom ${event.query} Item`
        ];
        isLoading.value = false;
    }, 1000);
};

// Validation example
const validationValue = ref('');
</script>
