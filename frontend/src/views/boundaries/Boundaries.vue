<template>

  <Panel>
    <template v-slot:title>
      Deployment Boundaries
    </template>

    <template v-slot:tip>
      <p>If you know where a piece of metadata is used (i.e what depends on it), you will know what could break if you make changes to it. <a>Learn more</a></p>
      
    </template>

    <template v-slot:form>

      <div>

        <div class="is-flex 
          is-flex-direction-row">

          <div>
            <div class="field">
              <MetadataSelection @typeSelected="getSelectedType" 
              @memberSelected="getSelectedMember" 
              @submitted="submitUsageJob"
              filter="exclude" 
              :values="typesToExclude"
              :parentIsLoading="isLoading"
              button-label="Show Deployment Boundary"/>
            </div>
          </div>
        </div>
      </div>
      
    </template>

    
    <template v-slot:results>
      <progress v-if="isLoading" class="progress is-small is-success" max="100">15%</progress>
      <DependencyResultPanel v-if="!isLoading && apiResponse && apiResponse.dependencyTree[selectedMemberKey]" :metadata-tree="apiResponse.dependencyTree[selectedMemberKey].references" :api-response="apiResponse"/>
      <Error v-if="!isLoading && apiError" :error="apiError"/> 
    </template>


  </Panel>
  
</template>

<script>


import MetadataSelection from '@/components/MetadataSelection.vue';
import Panel from '@/components/Panel.vue'
import jobSubmission from '@/functions/jobSubmission'
import DependencyResultPanel from '@/components/DependencyResultPanel.vue';
import Error from '@/components/Error';


export default {

    components:{MetadataSelection,Panel,DependencyResultPanel,Error},

    setup(){
      let {submitJob,apiError,apiResponse,done} = jobSubmission();
      return {submitJob,apiError,apiResponse,done};
    },

   
     data(){
      return{
        selectedType:'',
        selectedMember:{},
        typesToExclude:['CustomLabel','Layout','StandardField']
      }
    },

    methods:{
      getSelectedType(selectedType){
        console.log('selectedType',selectedType)
        this.selectedType = selectedType;
      },

      getSelectedMember(selectedMember){
        this.selectedMember = selectedMember;
      },

      async submitUsageJob(){

        this.done = false;
        let options = JSON.stringify(this.usageFlags);
        let url = `api/dependencies?name=${this.selectedMember.name}&id=${this.selectedMember.id}&type=${this.selectedType}&options=${options}`;       
        this.submitJob(url);
      }
    },


    computed:{

      selectedMemberKey(){
        return `${this.selectedMember.name}:::${this.selectedMember.id}`;
      },

      isLoading(){
        return !this.done;
      }
    }

}
</script>

<style lang="scss" scoped>

  @import '/assets/bulma-tooltip.css';

  .progress{
    width: 50%;
  }

</style>