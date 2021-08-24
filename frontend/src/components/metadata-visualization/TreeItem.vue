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
            <a v-if="supportsNestedImpact(type)" class="nestedImpactLink" @click="getNestedTree(member)">Where is this used?</a>
        </span>
        <progress   v-if="done == false && isMemberInProgress(member)" class="progress is-small is-primary" max="100">15%</progress>
        <MetadataTree v-if="apiResponse" :metadata="apiResponse" :parent-open="isOpen"/>
        <MetadataTree v-if="member.references" :key="member.name" :metadata="member.references" :parent-open="isOpen"/>
  </li>
</template>

<script>

import MetadataTree from '@/components/metadata-visualization/MetadataTree.vue';
import Pill from '@/components/ui/Pill.vue'
import TreeItem from '@/components/metadata-visualization/TreeItem.vue';
import jobSubmission from '@/functions/jobSubmission'

export default {

    components:{Pill,MetadataTree,TreeItem},

    name:'TreeItem',

    props:['type','members','parentOpen'],

    setup(){
      let {submitJob,apiError,apiResponse,done,createPostRequest} = jobSubmission();
      return {submitJob,apiError,apiResponse,done,createPostRequest};
    },

    data(){
        return{
            isOpen:false,
            memberInProgress:null,
        }
    },

    methods:{
        toggle(){
            this.isOpen = !this.isOpen
        },

        supportsNestedImpact(type){

            let supported = ['ApexClass','ApexPage','CustomField','WebLink','EmailTemplate'];
            return supported.includes(type);

        },

        async getNestedTree(member){

            this.memberInProgress = member;

            this.done = false;

            console.log(member);

            let data = {
                entryPoint : {
                    name:member.name,
                    id:member.id,
                    type:member.type,
                    options:{
                        treeOnly:true
                    }
                }
            }

            let fetchOptions = this.createPostRequest(data);
        
            this.submitJob('api/usage',fetchOptions);
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

    .progress{
        width: 400px;
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

    .nestedImpactLink{
        margin-left: 12px;
        font-size: 10px;
    }

</style>