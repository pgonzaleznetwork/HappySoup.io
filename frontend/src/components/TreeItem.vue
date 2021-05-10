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
  <li v-if="shouldBeOpen" v-for="member in members">
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

    computed:{
        shouldBeOpen(){
            if(this.isOpen){
                return true;
            }
            else if(!this.isOpen || this.parentOpen){
                return true;
            }
            return false;
        }
    },

    methods:{
        toggle(){
            this.isOpen = !this.isOpen
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