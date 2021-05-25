<template>

  <Panel>
    <template v-slot:title>
      Deployment Boundaries
    </template>

    <template v-slot:tip>
      <p>A deployment boundary is all the metadata that an org needs to have in order for a particular feature/configuration to exist. <a @click.prevent="toggleModal">Learn more</a></p>
      <Modal :is-active="showModal" @closeModal="toggleModal">
        <template v-slot:title>
          Deployment Boundaries
        </template>
        <template v-slot:content>
          <h3>What are Deployment Boundaries?</h3>
          <p>Deployment Boundaries are a new concept in the Salesforce ecosystem and are relevant to administrators, developers and architects. 
            You can use deployment boundaries to answer key questions including:</p>
          <ul>
            <li>Admins – What are all the fields and buttons that make up a specific page layout?</li>
            <li>Developers & Architects – What metadata should my scratch orgs have before I can start using them for development?</li>
          </ul>
          <p>We recommend reading this SalesforceBen blog post to fully understand the power of this feature</p>
          <p><a href="https://www.salesforceben.com/introduction-to-deployment-boundaries/" target="_blank">Introduction to Deploment Boundaries</a></p>
        </template>
      </Modal>
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
        typesToExclude:['CustomLabel','Layout','StandardField'],
        showModal:false,
      }
    },

    methods:{
      getSelectedType(selectedType){
        this.selectedType = selectedType;
      },

      getSelectedMember(selectedMember){
        this.selectedMember = selectedMember;
      },

       toggleModal(){
        this.showModal = !this.showModal;
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