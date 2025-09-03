<script setup>
import { useLayout } from '@/layout/composables/layout';
import { ref } from 'vue';

const { layoutState } = useLayout();

const cards = ref([
    { label: '*****24', value: { id: 1, name: '*****24', code: 'A1' } },
    { label: '*****75', value: { id: 2, name: '*****75', code: 'A2' } }
]);
const selectedCard = ref();
const amountValue = ref('');
</script>

<template>
    <Drawer
        header="Menu"
        v-model:visible="layoutState.rightMenuVisible"
        position="right"
        class="layout-rightmenu !w-full sm:!w-[36rem]"
        :pt="{
            pcCloseButton: { root: 'ml-auto' }
        }"
    >
        <div>
            <h2 class="title-h7 text-left">Activity</h2>
            <div class="flex flex-col mt-7">
                <div class="flex gap-6">
                    <div class="flex flex-col items-center">
                        <span class="w-14 h-14 flex items-center justify-center border border-surface rounded-xl shadow-[0px_1px_2px_0px_rgba(18,18,23,0.05);]">
                            <i class="pi pi-dollar text-blue-600 !text-2xl" />
                        </span>
                        <span class="min-h-14 w-px bg-[var(--surface-border)]" />
                    </div>
                    <div class="mt-2">
                        <h5 class="label-large">New Sale</h5>
                        <p class="label-small mt-1">Richard Jones has purchased a blue t-shirt for <b class="body-small text-surface-950 dark:text-surface-0">$79</b></p>
                    </div>
                </div>
                <div class="flex gap-6">
                    <div class="flex flex-col items-center">
                        <span class="w-14 h-14 flex items-center justify-center border border-surface rounded-xl shadow-[0px_1px_2px_0px_rgba(18,18,23,0.05);]">
                            <i class="pi pi-download text-orange-600 !text-2xl" />
                        </span>
                        <span class="min-h-14 w-px bg-[var(--surface-border)]" />
                    </div>
                    <div class="mt-2">
                        <h5 class="label-large">Withdrawal Initiated</h5>
                        <p class="label-small mt-1">Your request for withdrawal of <b class="body-small text-surface-950 dark:text-surface-0">$2500</b> has been initiated.</p>
                    </div>
                </div>
                <div class="flex gap-6">
                    <div class="flex flex-col items-center">
                        <span class="w-14 h-14 flex items-center justify-center border border-surface rounded-xl shadow-[0px_1px_2px_0px_rgba(18,18,23,0.05);]">
                            <i class="pi pi-question-circle text-violet-600 !text-2xl" />
                        </span>
                        <span class="min-h-14 w-px bg-[var(--surface-border)]" />
                    </div>
                    <div class="mt-2">
                        <h5 class="label-large">Question Received</h5>
                        <p class="label-small mt-1">Jane Davis has posted a <b class="body-small text-surface-950 dark:text-surface-0">new question</b> about your product.</p>
                    </div>
                </div>
                <div class="flex gap-6">
                    <div class="flex flex-col items-center">
                        <span class="w-14 h-14 flex items-center justify-center border border-surface rounded-xl shadow-[0px_1px_2px_0px_rgba(18,18,23,0.05);]">
                            <i class="pi pi-comment text-blue-600 !text-2xl" />
                        </span>
                    </div>
                    <div class="mt-2">
                        <h5 class="label-large">Comment Received</h5>
                        <p class="label-small mt-1">Claire Smith has upvoted your store along with a <b class="body-small text-surface-950 dark:text-surface-0">comment.</b></p>
                    </div>
                </div>
            </div>
        </div>
        <Divider class="!my-10" />
        <div>
            <h2 class="title-h7 text-left">Quick Withdraw</h2>
            <div class="flex flex-col gap-3.5 mt-7 mb-6">
                <InputText type="text" v-model="amountValue" placeholder="Amount" />
                <Select v-model="selectedCard" :options="cards" optionLabel="label" placeholder="Select a Card" class="w-full" />
            </div>
            <Button label="Confirm" severity="success" class="!w-full" />
        </div>
        <Divider class="!my-10" />
        <div>
            <h2 class="title-h7 text-left">Shipment Tracking</h2>
            <p class="body-small mt-1 text-left">Track your ongoing shipments to customers.</p>
            <img class="w-full h-full max-h-60 object-cover border border-surface rounded-2xl mt-4" src="/layout/images/sidebar-right/staticmap.png" alt="diamond-vue" />
        </div>
    </Drawer>
</template>
