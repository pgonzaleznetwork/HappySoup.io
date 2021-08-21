<template>

  <Panel>
    <template v-slot:title>
      Bulk Impact Analysis
    </template>

    <template v-slot:tip>
      <p>Impact Analysis across multiple metadata types</p>
    </template>

    <template v-slot:form>

      <div>

        <div class="is-flex 
          is-flex-direction-row">

          <div>
            <div class="field">
              <BulkMetadataSelection/>
            </div>
          </div>
        </div>
      </div>
      
    </template>

    
    <template v-slot:results>
      <progress v-if="isLoading" class="progress is-small is-success" max="100">15%</progress>
      <DependencyResultPanel v-if="!isLoading && apiResponse" :metadata-tree="apiResponse.usageTree" :api-response="apiResponse"/>
      <Error v-if="!isLoading && apiError" :error="apiError"/> 
    </template>


  </Panel>
  
</template>

<script>


import BulkMetadataSelection from '@/components/metadata-visualization/BulkMetadataSelection.vue';
import Panel from '@/components/ui/Panel.vue'
import Flag from '@/components/ui/Flag.vue'
import jobSubmission from '@/functions/jobSubmission'
import DependencyResultPanel from '@/components/metadata-visualization/DependencyResultPanel.vue';


export default {

    components:{Panel,Flag,DependencyResultPanel,BulkMetadataSelection},

    setup(){
      let {submitJob,apiError,apiResponse,done,createPostRequest} = jobSubmission();
      return {submitJob,apiError,apiResponse,done,createPostRequest};
    },

   
     data(){
      return{
        selectedType:'',
        selectedMember:{},
        usageFlags:{},
        typesToExclude:['ValidationRule','Layout'],
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

      setFlag(data){
        this.usageFlags[data.value] = data.ticked;
      },

      async submitUsageJob(){

        this.done = false;

        let data = {
          entryPoint : {
            name:this.selectedMember.name,
            id:this.selectedMember.id,
            type:this.selectedType,
            options:this.usageFlags
          }
        }

        let fetchOptions = this.createPostRequest(data);
      
        this.submitJob('api/usage',fetchOptions);
      }
    },


    computed:{

      hasError(){
        
        return true;
      },

      isLoading(){
        return !this.done;
      },

      flags(){
        if(this.selectedType == 'CustomField'){
          return [
           
            {
              label:'Field in metadata types',
              value:'fieldInMetadataTypes',
              description:'Show whether the field is referenced in the FieldDefinition fields of Custom Metadata Types'
            },
            {
              label:'Field population by record type',
              value:'fieldUtilization',
              description:'Show in how many records the field is popuated, broken down by record type'
            }
          ]
        }
        else  if(this.selectedType == 'StandardField'){

          return [{
              label:'Field population by record type',
              value:'fieldUtilization',
              description:'Show in how many records the field is popuated, broken down by record type'
            }]

        }
        else if(this.selectedType == 'ApexClass'){
          return [
            {
              label:'Class in Metadata Types',
              value:'classInMetadataTypes',
              description:'Show whether the apex class is referenced in any field of any of Custom Metadata Type for dependency injection/table-driven triggers'
            }
          ]
        }
        else if(this.selectedType == 'CustomObject'){
          return [
            {
              label:'Object in Metadata Types',
              value:'objectInMetadataTypes',
              description:'Show whether the object is referenced in the EntityDefinition fields of Custom Metadata Types'
            }
          ]
        }
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