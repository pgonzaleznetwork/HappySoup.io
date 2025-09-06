<script setup>
import { ref, markRaw } from 'vue';
import AppMenuItem from './AppMenuItem.vue';
import { PhMagnifyingGlass } from '@phosphor-icons/vue';

const model = ref([
    {
        label: 'Impact Analysis',
        icon: markRaw(PhMagnifyingGlass),
        items: [
            {
                label: 'Where is this used',
                icon: markRaw(PhMagnifyingGlass),
                to: '/app'
            }
        ]
    }
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model">
            <AppMenuItem v-if="!item.separator" :key="`menu-item-${i}`" :item="item" root :index="i" />
            <li v-else :key="`separator-${i}`" class="menu-separator" />
        </template>
    </ul>
</template>
