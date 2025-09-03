<script setup>
import { useLayout } from '@/layout/composables/layout';
import { ref } from 'vue';

const { layoutState } = useLayout();

const searchInput = ref(null);

function toggleSearchBar() {
    layoutState.searchBarActive = !layoutState.searchBarActive;
}

function focusOnInput() {
    searchInput.value.$el.focus();
}
</script>

<template>
    <Dialog
        v-model:visible="layoutState.searchBarActive"
        :breakpoints="{ '992px': '75vw', '576px': '90vw' }"
        modal
        dismissableMask
        @show="focusOnInput"
        :pt="{
            root: 'w-1/2',
            header: '!hidden',
            content: '!p-0'
        }"
    >
        <div class="search-container">
            <i class="pi pi-search" />
            <InputText type="text" class="p-inputtext search-input" ref="searchInput" placeholder="Search" @keydown.enter="toggleSearchBar" />
        </div>
    </Dialog>
</template>
