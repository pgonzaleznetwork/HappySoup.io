<script setup>
import HappySoupSvg from './happy_soup_transparent_bg.svg?url'

defineProps({
    className: {
        type: String,
        default: ''
    },
    reverseTheme: {
        type: Boolean,
        default: false
    },
    width: {
        type: [String, Number],
        default: 128
    },
    height: {
        type: [String, Number],
        default: 128
    }
});
</script>

<template>
    <img 
        :src="HappySoupSvg"
        :class="[className, reverseTheme ? 'filter brightness-0 invert dark:brightness-100 dark:invert-0' : '']"
        :width="width" 
        :height="height"
        alt="Happy Soup Logo"
    />
</template>
