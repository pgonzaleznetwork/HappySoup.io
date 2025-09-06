<script setup>
const features = [
    {
        title: 'Find where your fields are being used',
        description: 'See exactly where standard and custom fields show up across your org - in page layouts, formulas, workflows, apex code, and more. No more guessing what breaks when you change a field.',
        icon: 'pi-search'
    },
    {
        title: 'Track usage of any metadata type',
        description: "Beyond fields, see where email templates, custom settings, validation rules, and other metadata are referenced. Perfect for cleanup projects and understanding your org's complexity.",
        icon: 'pi-sitemap'
    },
    {
        title: 'Export workflows ready for Flow conversion',
        description: 'Get all your workflows exported in a format that makes converting to Flows much easier. Save hours of manual work when modernizing your automation.',
        icon: 'pi-download'
    },
    {
        title: 'Create deployment boundaries',
        description: 'Figure out exactly what metadata needs to be deployed together. Essential for scratch orgs, change sets, and understanding what depends on what in your org.',
        icon: 'pi-box'
    }
];
</script>

<template>
    <div class="w-full mx-auto flex flex-col gap-8 items-start justify-center p-16">
        <div class="flex flex-col gap-2 mb-6">
            <div class="text-surface-900 dark:text-surface-0 text-2xl font-semibold leading-tight">Welcome to HappySoup.io.io</div>
            <div class="text-surface-900/60 dark:text-surface-0/60 leading-normal">Impact and Dependency Analysis for Salesforce</div>
        </div>
        <div class="flex flex-col gap-6 w-full">
            <div v-for="feature in features" :key="feature.title" class="flex gap-4">
                <div class="h-9 w-9 bg-white rounded-lg flex items-center justify-center">
                    <i :class="`pi ${feature.icon} !text-base !leading-none text-primary-500`" />
                </div>
                <div class="flex flex-col gap-2 flex-1">
                    <div class="text-surface-900 dark:text-surface-0 font-medium">{{ feature.title }}</div>
                    <div class="text-surface-900/60 dark:text-surface-0/60 leading-normal">{{ feature.description }}</div>
                </div>
            </div>
        </div>
    </div>
</template>
