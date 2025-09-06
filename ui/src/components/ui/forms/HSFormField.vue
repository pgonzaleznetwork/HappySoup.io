<script setup>
defineProps({
    label: {
        type: String,
        required: true
    }
});
</script>

<template>
    <div class="flex flex-col gap-2 w-full">
        <p class="body-small text-center lg:text-left">{{ label }}</p>
        <slot name="input">
            <!-- Default slot for the main input -->
        </slot>
        <slot name="helper">
            <!-- Optional slot for helper text or error messages -->
        </slot>
    </div>
</template>
