<template>
  <div>
    <span class="icon-text">
        <span v-if="isOpen" class="icon">
            <i class="fas fa-folder-open"></i>
        </span>
        <span v-if="!isOpen" class="icon">
            <i class="fas fa-folder"></i>
        </span>
        <span class="type" @click="toggle">{{type}}</span>
    </span>
  </div>
  <li v-if="isOpen" v-for="member in members" :key="member.id">
        <span class="icon-text">
            <span class="icon">
                <i class="fas fa-code"></i>
            </span>
            <span><a :href="member.url" target="_blank">{{member.name}}</a></span>
            <Pill v-for="pill in member.pills" :pill="pill"/>
        </span>
  </li>
</template>

<script>

import Pill from '@/components/Pill.vue'

export default {

    components:{Pill},

    props:['type','members','parentOpen'],

    data(){
        return{
            isOpen:false
        }
    },

    methods:{
        toggle(){
            this.isOpen = !this.isOpen
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
    }

    .fa-folder, .fa-folder-open{
        color:#f39c12;
    }   

    li{
        margin-left:25px;
        margin-bottom: 5px;
    }

    .tag{
        margin-left: 12px;
    }

</style>