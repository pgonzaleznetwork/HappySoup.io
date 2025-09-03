<script setup>
// No props needed; this is a layout container
</script>

<template>
    <div class="HS-form-container">
        <slot name="icon" />
        <slot name="title" />
        <slot name="form" />
        <slot name="footer" />
    </div>
</template>

<style scoped>
.HS-form-container {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 40px;
    width: 100%;
}
</style>
