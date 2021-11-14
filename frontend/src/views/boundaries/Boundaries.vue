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
              filter="only" 
              :values="typesToInclude"
              :parentIsLoading="isLoading"
              button-label="Show Deployment Boundary"/>
            </div>
          </div>
          <div v-if="flags?.length" style="margin-left: 50px;">
            <div >
              <div class="has-text-weight-bold" style="margin-bottom:10px;">
                <span class="label-size">Choose your toppings</span> 
              </div>
              <Flag v-for="flag in flags" :label="flag.label" :value="flag.value" :description="flag.description" @ticked="setFlag"/>
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


import MetadataSelection from '@/components/metadata-visualization/MetadataSelection.vue';
import Panel from '@/components/ui/Panel.vue'
import jobSubmission from '@/functions/jobSubmission'
import Flag from '@/components/ui/Flag.vue'
import DependencyResultPanel from '@/components/metadata-visualization/DependencyResultPanel.vue';
import Error from '@/components/ui/Error';


export default {

    components:{MetadataSelection,Panel,Flag,DependencyResultPanel,Error},

    setup(){
      let {submitJob,apiError,apiResponse,done,createPostRequest} = jobSubmission();
      return {submitJob,apiError,apiResponse,done,createPostRequest};
    },

   
     data(){
      return{
        selectedType:'',
        selectedMember:{},
        boundaryFlags:{},
        typesToInclude:['ApexTrigger','ApexClass','ApexPage','CustomField','ValidationRule'],
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

        let data = {
          entryPoint : {
            name:this.selectedMember.name,
            id:this.selectedMember.id,
            type:this.selectedType,
            options:this.boundaryFlags
          }
        }

        let fetchOptions = this.createPostRequest(data);
      
        this.submitJob('api/boundaries',fetchOptions);
      },

      setFlag(data){
        this.boundaryFlags[data.value] = data.ticked;
      }
    },


    computed:{

      selectedMemberKey(){
        return `${this.selectedMember.name}:::${this.selectedMember.id}`;
      },

      isLoading(){
        return !this.done;
      },

      flags(){
        return [
           {
              label:'Include Managed Package Metadata in package.xml',
              value:'includeManagedInPackageXml',
              description:'Managed packages in the deployment boundary will be added to the package.xml, even though it is not possible to deploy managed metadata via the API.'
            },
        ]
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