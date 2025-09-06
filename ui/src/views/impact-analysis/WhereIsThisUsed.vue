<script setup>
import { ref } from 'vue';
import axios from 'axios';

const searchTerm = ref('');
const isLoading = ref(false);
const searchResults = ref(null);
const error = ref(null);
const expandedSections = ref(new Set());

async function handleSearch() {
    if (!searchTerm.value.trim()) {
        return;
    }

    isLoading.value = true;
    error.value = null;
    searchResults.value = null;

    try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/salesforce/search`, {
            userId: '689f03ba3d53b0237d3efb3d',
            orgId: '00D3h000005XLUwEAO',
            searchQuery: searchTerm.value.trim()
        });

        searchResults.value = response.data;
        // Reset expanded sections for new search
        expandedSections.value = new Set();
    } catch (err) {
        console.error('Search failed:', err);
        error.value = err.response?.data?.error || 'Failed to perform search. Please try again.';
    } finally {
        isLoading.value = false;
    }
}

function handleKeydown(event) {
    if (event.key === 'Enter' && !isLoading.value) {
        handleSearch();
    }
}

function parseCodeContext(rawContext, searchQuery) {
    const lines = rawContext.split('\n');
    return lines.map((line) => {
        // Parse line format: "lineNumber:content" or "lineNumber-content"
        const match = line.match(/^(\d+)([:|-])(.*)$/);
        if (!match) {
            return { lineNumber: '', separator: '', content: line, isMatch: false };
        }

        const [, lineNumber, separator, content] = match;
        const isMatch = separator === ':'; // ":" indicates matching line, "-" indicates context

        return {
            lineNumber: parseInt(lineNumber),
            separator,
            content,
            isMatch,
            highlightedContent: isMatch ? highlightSearchTerm(content, searchQuery) : content
        };
    });
}

function highlightSearchTerm(content, searchQuery) {
    if (!searchQuery || !content) return content;

    // Escape special regex characters in search query
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');

    return content.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 px-1 rounded">$1</mark>');
}

function getMetadataType(filePath) {
    // Extract metadata type from Salesforce file path
    const pathParts = filePath.split('/');

    // Look for force-app/main/default/{metadataType} pattern
    const defaultIndex = pathParts.indexOf('default');
    if (defaultIndex !== -1 && defaultIndex < pathParts.length - 1) {
        return pathParts[defaultIndex + 1];
    }

    // Fallback: use file extension or last directory
    const fileName = pathParts[pathParts.length - 1];
    const extension = fileName.split('.').pop();

    // Map common extensions to metadata types
    const extensionMap = {
        cls: 'classes',
        trigger: 'triggers',
        page: 'pages',
        component: 'components',
        js: 'staticresources',
        css: 'staticresources',
        xml: 'other'
    };

    return extensionMap[extension] || 'other';
}

function formatMetadataTypeName(metadataType) {
    // Convert camelCase or snake_case to Title Case
    const formatted = metadataType
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .replace(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
        .replace(/\b\w/g, (l) => l.toUpperCase()) // Capitalize first letter of each word
        .trim();

    // Handle special cases
    const specialCases = {
        Classes: 'Apex Classes',
        Triggers: 'Apex Triggers',
        Pages: 'Visualforce Pages',
        Components: 'Visualforce Components',
        Custommetadata: 'Custom Metadata',
        Staticresources: 'Static Resources',
        Permissionsets: 'Permission Sets',
        Customobjects: 'Custom Objects',
        Customfields: 'Custom Fields',
        Workflows: 'Workflow Rules',
        Approvalprocesses: 'Approval Processes',
        Customtabs: 'Custom Tabs',
        Customapplications: 'Custom Applications',
        Flows: 'Flows',
        Processbuilderdefinitions: 'Process Builder',
        Quickactions: 'Quick Actions',
        Reporttypes: 'Report Types',
        Dashboards: 'Dashboards',
        Reports: 'Reports',
        Emailtemplates: 'Email Templates',
        Layouts: 'Page Layouts',
        Profiles: 'Profiles',
        Roles: 'Roles',
        Other: 'Other Files'
    };

    return specialCases[formatted] || formatted;
}

function groupResultsByMetadataType(results) {
    const grouped = {};

    results.forEach((fileResult) => {
        const metadataType = getMetadataType(fileResult.filePath);
        const formattedType = formatMetadataTypeName(metadataType);

        if (!grouped[formattedType]) {
            grouped[formattedType] = {
                type: formattedType,
                files: [],
                totalMatches: 0
            };
        }

        grouped[formattedType].files.push(fileResult);
        grouped[formattedType].totalMatches += fileResult.matches.length;
    });

    // Sort groups by total matches (descending)
    return Object.values(grouped).sort((a, b) => b.totalMatches - a.totalMatches);
}

function toggleSection(sectionType) {
    if (expandedSections.value.has(sectionType)) {
        expandedSections.value.delete(sectionType);
    } else {
        expandedSections.value.add(sectionType);
    }
}

function getFileName(filePath) {
    return filePath.split('/').pop();
}
</script>

<template>
    <div class="card">
        <div class="max-w-6xl">
            <div class="mb-6">
                <h2 class="text-surface-900 dark:text-surface-0 font-semibold text-lg mb-2">Search Salesforce Components</h2>
                <p class="text-surface-600 dark:text-surface-400 text-sm">Enter a component name, field, or metadata to analyze its impact across your Salesforce org</p>
            </div>

            <div class="flex flex-col sm:flex-row gap-4 mb-6">
                <div class="flex-1">
                    <IconField style="height: 3.5rem">
                        <InputIcon class="pi pi-search" style="left: 1.5rem" />
                        <InputText
                            id="search-term"
                            type="text"
                            v-model="searchTerm"
                            placeholder="e.g. Account.Name, MyCustomObject__c, MyApexClass"
                            class="!pl-16 text-surface-900 dark:text-surface-0"
                            fluid
                            style="height: 3.5rem"
                            :disabled="isLoading"
                            @keydown="handleKeydown"
                        />
                    </IconField>
                </div>

                <Button
                    type="button"
                    class="h-14 px-8 sm:w-auto"
                    :icon="isLoading ? 'pi pi-spin pi-spinner' : 'pi pi-search'"
                    :label="isLoading ? 'Searching...' : 'Analyze Impact'"
                    :disabled="!searchTerm.trim() || isLoading"
                    :loading="isLoading"
                    @click="handleSearch"
                />
            </div>

            <div class="mb-6">
                <p class="text-surface-500 dark:text-surface-400 text-xs">Tip: Use specific component names for more accurate results</p>
            </div>

            <!-- Error State -->
            <div v-if="error" class="mb-6">
                <div class="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div class="flex items-center">
                        <i class="pi pi-exclamation-triangle text-red-600 dark:text-red-400 mr-2"></i>
                        <span class="text-red-800 dark:text-red-200">{{ error }}</span>
                    </div>
                </div>
            </div>

            <!-- Search Results -->
            <div v-if="searchResults" class="space-y-6">
                <!-- Results Summary -->
                <div class="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-blue-900 dark:text-blue-100 font-semibold mb-1">Search Results for "{{ searchResults.searchQuery }}"</h3>
                            <p class="text-blue-700 dark:text-blue-300 text-sm">Found {{ searchResults.totalMatches }} matches across {{ searchResults.results.length }} files ({{ searchResults.searchStats.filesSearched }} files searched)</p>
                        </div>
                        <div class="text-blue-600 dark:text-blue-400 text-xs">
                            <i class="pi pi-clock mr-1"></i>
                            {{ new Date(searchResults.searchStats.searchedAt).toLocaleTimeString() }}
                            <span v-if="searchResults.searchStats.usedCache" class="ml-2">
                                <i class="pi pi-database text-green-600"></i>
                                Cached
                            </span>
                        </div>
                    </div>
                </div>

                <!-- No Results -->
                <div v-if="searchResults.results.length === 0" class="text-center py-8">
                    <i class="pi pi-search text-4xl text-surface-400 mb-4"></i>
                    <h3 class="text-surface-600 dark:text-surface-400 font-medium mb-2">No matches found</h3>
                    <p class="text-surface-500 dark:text-surface-400 text-sm">Try a different search term or check your spelling</p>
                </div>

                <!-- Grouped Results -->
                <div v-for="group in groupResultsByMetadataType(searchResults.results)" :key="group.type" class="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
                    <!-- Group Header -->
                    <div class="bg-surface-100 dark:bg-surface-800 px-4 py-3 cursor-pointer hover:bg-surface-150 dark:hover:bg-surface-750 transition-colors" @click="toggleSection(group.type)">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <i :class="['pi mr-3 transition-transform duration-200', expandedSections.has(group.type) ? 'pi-chevron-down' : 'pi-chevron-right']"></i>
                                <span class="font-semibold text-surface-900 dark:text-surface-0">
                                    {{ group.type }}
                                </span>
                            </div>
                            <div class="flex items-center space-x-3">
                                <span class="text-sm text-surface-600 dark:text-surface-400"> {{ group.totalMatches }} match{{ group.totalMatches !== 1 ? 'es' : '' }} in {{ group.files.length }} file{{ group.files.length !== 1 ? 's' : '' }} </span>
                                <div class="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-1 rounded text-xs font-medium">
                                    {{ group.files.length }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Expanded Content -->
                    <div v-if="expandedSections.has(group.type)" class="border-t border-surface-200 dark:border-surface-700">
                        <div v-for="fileResult in group.files" :key="fileResult.filePath" class="border-b border-surface-200 dark:border-surface-700 last:border-b-0">
                            <!-- File Header -->
                            <div class="bg-surface-50 dark:bg-surface-900 px-4 py-3 border-b border-surface-200 dark:border-surface-700">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center">
                                        <i class="pi pi-file text-surface-600 dark:text-surface-400 mr-2"></i>
                                        <span class="font-mono text-sm text-surface-900 dark:text-surface-0 font-medium">
                                            {{ getFileName(fileResult.filePath) }}
                                        </span>
                                    </div>
                                    <div class="text-xs text-surface-500 dark:text-surface-400">{{ fileResult.matches.length }} match{{ fileResult.matches.length !== 1 ? 'es' : '' }}</div>
                                </div>
                            </div>

                            <!-- Matches -->
                            <div class="divide-y divide-surface-200 dark:divide-surface-700">
                                <div v-for="(match, index) in fileResult.matches" :key="index" class="p-4">
                                    <div class="mb-2">
                                        <span class="inline-block bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-1 rounded text-xs font-medium"> Line {{ match.lineNumber }} </span>
                                    </div>

                                    <!-- Code Block -->
                                    <div class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
                                        <div class="text-xs font-mono overflow-x-auto">
                                            <div
                                                v-for="(line, lineIndex) in parseCodeContext(match.rawContext, searchResults.searchQuery)"
                                                :key="lineIndex"
                                                :class="['flex px-4 py-1 hover:bg-surface-100 dark:hover:bg-surface-800', line.isMatch ? 'bg-blue-50 dark:bg-blue-950 border-l-2 border-l-blue-400 dark:border-l-blue-600' : '']"
                                            >
                                                <!-- Line Number -->
                                                <div class="flex-shrink-0 w-12 text-right pr-4 text-surface-500 dark:text-surface-400 select-none">
                                                    {{ line.lineNumber || '' }}
                                                </div>

                                                <!-- Code Content -->
                                                <div class="flex-1 whitespace-pre-wrap break-words" :class="line.isMatch ? 'text-surface-900 dark:text-surface-0 font-medium' : 'text-surface-700 dark:text-surface-300'">
                                                    <span v-if="line.isMatch" v-html="line.highlightedContent"></span>
                                                    <span v-else>{{ line.content }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
