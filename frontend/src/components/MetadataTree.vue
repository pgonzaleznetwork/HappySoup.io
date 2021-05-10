<template>
    <ul>
        <li v-for="(value,key) in metadata">
            <TreeItem :type="key" :members="value" :parent-open="openTree"/>
        </li>
    </ul>
</template>

<script>

import TreeItem from '@/components/TreeItem.vue'
import TheButton from '@/components/TheButton.vue'

export default {

    components:{TreeItem,TheButton},

    props:['metadata','openTree'],

}
</script>

<style lang="scss" scoped>

    ul{
        margin-left: 12px;
    }

</style>