<template>
    <ul>
        <li v-for="(value,key) in metadata">
            <TreeItem :type="key" :members="value" :parent-open="parentOpen" :key="key"/>
        </li>
    </ul>
</template>

<script>

import TreeItem from '@/components/TreeItem.vue'
import TheButton from '@/components/TheButton.vue'
import MetadataTree from '@/components/MetadataTree.vue';

export default {

    components:{TreeItem,TheButton,MetadataTree},

    name:'MetadataTree',

    props:['metadata','parentOpen']

}
</script>

<style lang="scss" scoped>

    ul{
        margin-left: 25px;
    }

</style>