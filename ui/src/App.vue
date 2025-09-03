<script setup>
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
</script>

<template>
    <div>
        <router-view />
        <VueQueryDevtools />
    </div>
</template>

<style></style>
