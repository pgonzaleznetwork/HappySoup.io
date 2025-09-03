<script setup>
// No props needed as this is purely a layout component
</script>

<template>
    <div class="HS-form-layout">
        <slot />
    </div>
</template>

<style scoped>
.HS-form-layout {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 24px;
    align-self: stretch;
    width: 100%;
}

/* Ensure only direct children get the gap spacing */
.HS-form-layout > * {
    width: 100%;
}
</style>
