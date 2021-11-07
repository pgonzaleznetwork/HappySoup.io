<template>
    <ul>
        <li v-for="(value,key) in metadata">
            <TreeItem :type="key" :members="value" :parent-open="parentOpen" :key="key" />
        </li>
    </ul>
</template>

<script>

import TreeItem from '@/components/metadata-visualization/TreeItem.vue'
import MetadataTree from '@/components/metadata-visualization/MetadataTree.vue';

export default {

    components:{TreeItem,MetadataTree},

    name:'MetadataTree',

    props:['metadata','parentOpen']

}
</script>

<style lang="scss" scoped>

   

    ul{
        margin-left: 25px;
    }

    li{
        border-left: 1px dotted grey;
    }

</style>