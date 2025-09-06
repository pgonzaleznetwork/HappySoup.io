# HSAutoComplete Component

A beautiful, reusable autocomplete component built on top of PrimeVue's AutoComplete with enhanced styling, search highlighting, and dark mode support.

## ✨ Features

- **🎨 Beautiful Design**: Professional styling with PrimeVue + Tailwind
- **🔍 Smart Highlighting**: Automatic bold highlighting of matching text
- **🌙 Dark Mode**: Full dark mode support
- **♿ Accessible**: Built-in ARIA labels and keyboard navigation
- **📱 Responsive**: Mobile-friendly design
- **🎯 Flexible**: Works with strings, objects, or arrays
- **⚡ Performance**: Debounced search with configurable delay
- **🔧 Customizable**: Multiple size variants, colors, and behaviors

## 📋 Basic Usage

```vue
<template>
    <HSAutoComplete
        v-model="selectedValue"
        :suggestions="suggestions"
        label="Choose an option"
        placeholder="Type to search..."
    />
</template>

<script setup>
import { ref } from 'vue';
import HSAutoComplete from '@/components/ui/forms/HSAutoComplete.vue';

const selectedValue = ref('');
const suggestions = ref(['Apple', 'Banana', 'Cherry', 'Date']);
</script>
```

## 🔧 Props

### Core Functionality
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `String\|Object\|Array` | `''` | The selected value |
| `suggestions` | `Array` | `[]` | Array of suggestions to search through |

### Display Options
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `String` | `''` | Label text above the input |
| `placeholder` | `String` | `'Type to search...'` | Placeholder text |
| `optionLabel` | `String` | `'label'` | Property name to display for objects |

### Search Behavior
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `minLength` | `Number` | `3` | Minimum characters before search starts |
| `delay` | `Number` | `700` | Debounce delay in milliseconds |
| `completeOnFocus` | `Boolean` | `true` | Show suggestions on focus |

### Highlighting
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableHighlighting` | `Boolean` | `true` | Enable search term highlighting |
| `highlightField` | `String` | `'highlightedLabel'` | Field name for highlighted text |
| `highlightColor` | `String` | `'var(--p-primary-color)'` | Color for highlighted text |

### State
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `disabled` | `Boolean` | `false` | Disable the input |
| `loading` | `Boolean` | `false` | Show loading state |
| `invalid` | `Boolean` | `false` | Show error state |
| `required` | `Boolean` | `false` | Mark as required field |

### Styling
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `String` | `'normal'` | Size variant: `'small'`, `'normal'`, `'large'` |
| `variant` | `String` | `'default'` | Style variant: `'default'`, `'filled'`, `'outlined'` |

### Messages
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `helpText` | `String` | `''` | Help text below input |
| `errorMessage` | `String` | `''` | Error message (overrides helpText) |

## 🎯 Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `value` | Emitted when selection changes |
| `complete` | `{ query }` | Emitted when user types (for async loading) |
| `select` | `{ value }` | Emitted when option is selected |
| `clear` | `{ value }` | Emitted when input is cleared |
| `focus` | `event` | Emitted when input gains focus |
| `blur` | `event` | Emitted when input loses focus |

## 📚 Examples

### String Array Suggestions
```vue
<HSAutoComplete
    v-model="fruit"
    :suggestions="['Apple', 'Banana', 'Cherry']"
    label="Choose a fruit"
    placeholder="Type fruit name..."
/>
```

### Object-based Suggestions
```vue
<HSAutoComplete
    v-model="selectedUser"
    :suggestions="users"
    option-label="name"
    label="Select user"
    placeholder="Type user name..."
/>

<script setup>
const users = ref([
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
]);
</script>
```

### With Async Loading
```vue
<HSAutoComplete
    v-model="searchResult"
    :suggestions="results"
    :loading="isLoading"
    label="Search API"
    @complete="handleAsyncSearch"
/>

<script setup>
const handleAsyncSearch = async (event) => {
    isLoading.value = true;
    try {
        const response = await fetch(`/api/search?q=${event.query}`);
        results.value = await response.json();
    } finally {
        isLoading.value = false;
    }
};
</script>
```

### With Validation
```vue
<HSAutoComplete
    v-model="requiredField"
    :suggestions="options"
    label="Required Selection"
    required
    :invalid="!requiredField"
    :error-message="!requiredField ? 'This field is required' : ''"
/>
```

### Custom Styling
```vue
<HSAutoComplete
    v-model="styledValue"
    :suggestions="options"
    label="Large with custom highlight"
    size="large"
    highlight-color="#10b981"
    :delay="300"
/>
```

## 🎨 Styling

The component uses Tailwind CSS classes and PrimeVue's design tokens. You can customize:

- **Colors**: Via CSS custom properties or `highlight-color` prop
- **Sizes**: Via `size` prop (`small`, `normal`, `large`)
- **Variants**: Via `variant` prop (future feature)

## 🚀 Advanced Usage

### Custom Option Template
The component automatically handles highlighting, but you can access slots if needed:

```vue
<HSAutoComplete v-model="value" :suggestions="items">
    <template #loading>
        <div class="p-3 text-center">
            <i class="pi pi-spin pi-spinner mr-2"></i>
            Loading...
        </div>
    </template>
    
    <template #empty>
        <div class="p-3 text-center text-surface-500">
            No results found
        </div>
    </template>
</HSAutoComplete>
```

### Exposed Methods
```vue
<script setup>
const autoCompleteRef = ref();

// Focus the input
autoCompleteRef.value.focus();

// Clear the selection
autoCompleteRef.value.clear();
</script>

<template>
    <HSAutoComplete ref="autoCompleteRef" v-model="value" :suggestions="items" />
</template>
```

## 🔄 Migration from PrimeVue AutoComplete

Replace your existing PrimeVue AutoComplete:

```vue
<!-- Before -->
<AutoComplete
    v-model="value"
    :suggestions="filteredItems"
    @complete="search"
    option-label="name"
    placeholder="Search..."
/>

<!-- After -->
<HSAutoComplete
    v-model="value"
    :suggestions="allItems"
    option-label="name"
    placeholder="Search..."
    label="Search Items"
/>
```

**Key differences:**
- ✅ No need to manually filter suggestions
- ✅ Automatic highlighting included
- ✅ Better accessibility and styling
- ✅ Built-in dark mode support

## 🐛 Troubleshooting

**Highlighting not working?**
- Ensure `enableHighlighting` is `true` (default)
- Check that suggestions are properly formatted

**Suggestions not showing?**
- Verify `minLength` setting (default: 3 characters)
- Check that `suggestions` array is populated
- Ensure `delay` isn't too long (default: 700ms)

**Styling issues?**
- Make sure Tailwind CSS is properly configured
- Check PrimeVue theme is loaded
- Verify CSS custom properties are available
