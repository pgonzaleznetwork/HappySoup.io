<template>
    <div class="is-flex is-flex-direction-row is-justify-content-space-between mb-4">
        <div>
        <button class="button is-small is-info" @click="toggleTree">
            {{treeControlLabel}}
        </button>
        </div>

        <div>
        <button class="button is-small is-warning">Expand all</button>
        <button class="button is-small is-warning ml-3">Collapse all</button>
        <button class="button is-small is-warning ml-3">Collapse all</button>
        </div>
    </div>
    
    <MetadataTree :metadata="metadataTree" :parent-open="openTree"/>  
</template>

<script>

import MetadataTree from '@/components/MetadataTree.vue';

export default {

    components:{MetadataTree},

    props:['metadataTree','apiResponse'],

    data(){
        return{
            openTree:false;
        }
    },

    methods:{
        toggleTree(){
            this.openTree = !this.openTree;
        }
    },

    computed:{
        treeControlLabel(){
            return this.openTree ? 'Collapse All' : 'Expand All';
        }
    }

}
</script>

<style>

</style>