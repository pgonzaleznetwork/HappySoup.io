<template>
  <div>
    <span class="icon-text">
        <span v-if="isOpen" class="icon">
            <i class="fas fa-folder-open"></i>
        </span>
        <span v-if="!isOpen" class="icon">
            <i class="fas fa-folder"></i>
        </span>
        <span class="type" @click="toggle">{{type}} <span class="text-size">({{members.length}})</span> </span>
    </span>
  </div>
  <li v-if="isOpen" v-for="member in members" :key="member.id">
        <span class="icon-text">
            <span class="icon">
                <i class="fas fa-code"></i>
            </span>
            <span><a :href="member.url" target="_blank">{{getDisplayName(member.name)}}</a></span>
            <Pill v-for="pill in member.pills" :pill="pill"/>
        </span>
        <MetadataTree v-if="member.references" :key="member.name" :metadata="member.references" :parent-open="isOpen"/>
  </li>
</template>

<script>

import MetadataTree from '@/components/metadata-visualization/MetadataTree.vue';
import Pill from '@/components/ui/Pill.vue'
import TreeItem from '@/components/metadata-visualization/TreeItem.vue';

export default {

    components:{Pill,MetadataTree,TreeItem},

    name:'TreeItem',

    props:['type','members','parentOpen'],

    data(){
        return{
            isOpen:false,
        }
    },

    methods:{
        toggle(){
            this.isOpen = !this.isOpen
        },

        getDisplayName(name){
    
            let displayName = name;
            let indexOfSpecialChar = name.indexOf(':::');
            
            if(indexOfSpecialChar != -1){
                displayName = name.substr(0,indexOfSpecialChar);
            }
            
            return displayName;
        }
    },

    watch: {
        
        parentOpen: function (newValue, oldValue) {

            if(oldValue && !newValue){
                this.isOpen = false;
              
            }
            else if(!oldValue && newValue){
                this.isOpen = true;
               
            }
        }
    }
}
</script>

<style lang="scss" scoped>

    .type{
        cursor: pointer;
        font-weight:500;
    }

    .fa-folder, .fa-folder-open{
        color:$folder-color;
    }   

    li{
        margin-left:25px;
        margin-bottom: 5px;
    }

    .tag{
        margin-left: 12px;
    }

</style>