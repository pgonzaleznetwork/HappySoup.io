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
  <Modal :is-active="showModal">
        <template v-slot:title>
          Where is this used?
        </template>
        <template v-slot:content>
            <span v-html="waitingMessage"></span>
        </template>
      </Modal>
  <li v-if="isOpen" v-for="member in members" :key="member.id">
        <span class="icon-text">
            <span class="icon">
                <i class="fas fa-code"></i>
            </span>
            <span><a :href="member.url" target="_blank">{{getDisplayName(member.name)}}</a></span>
            <Pill v-for="pill in member.pills" :pill="pill"/>
            <span data-tooltip="Where is this used?" @click="getNestedTree(member)" v-if="supportsNestedImpact(member) && !member.notUsed" class="icon is-small nestedImpactLink has-tooltip-arrow has-tooltip has-tooltip-right">
                <i class="fas fa-sitemap" aria-hidden="true"></i>
            </span>
        </span>
        <progress  v-if="done == false && isMemberInProgress(member)" class="progress is-small is-primary" max="100">15%</progress>
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
            memberInProgress:{name:'HappySoupDefaultName'},
            nestedTreesRequested:[],
            showModal:false
        }
    },

    methods:{
        toggle(){
            this.isOpen = !this.isOpen
        },

        supportsNestedImpact(member){

            let supported = ['ApexClass','ApexPage','CustomField','WebLink','EmailTemplate','AuraDefinitionBundle','Flow','CustomLabel'];

            return (supported.includes(member.type) && member.name != member.id);

        },

        isMemberInProgress(member){
            return this.memberInProgress == member;
        },


        async getNestedTree(member){

            this.memberInProgress = member;
            this.nestedTreesRequested.push(member);      
            this.waitingMessage = `Searching where <b>${member.name}</b> is used. It'll take a min!`;      

            this.done = false;
            this.showModal = true;

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
        },

        done: function (newDone, oldDone) {
            if(!oldDone && newDone && !this.apiError){

                let lastMemberRequested = this.nestedTreesRequested.pop();

                //response is empty i.e the member is not used anywhere
                if(this.apiResponse && Object.keys(this.apiResponse).length === 0){

                    lastMemberRequested.notUsed = true;

                    lastMemberRequested.pills.push({
                        label:'Not used',
                        type:'warning',
                        description:'This item is not used anywhere'
                    })
                }
                else{
                lastMemberRequested.references = this.apiResponse;
                }
                
                this.showModal = false;
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
        margin-top: 20px;
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
        margin-left: 14px;
        font-size: 10px;
        margin-top: 5px;
        cursor: pointer;
    }

</style>