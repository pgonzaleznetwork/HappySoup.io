<template>

  <Panel>
    <template v-slot:title>
      Page Layout Dictionary
    </template>

    <template v-slot:tip>

      <p>Export all the fields, visualforce pages and buttons used in a page layout.</p>

      <Modal :is-active="showModal" @closeModal="toggleModal">
        <template v-slot:title>
          Page Layout
        </template>
        <template v-slot:content>
          placeholder
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
              values="Layout"
              :parentIsLoading="isLoading"
              button-label="Create Dictionary"/>
            </div>
          </div>
        </div>
      </div>
      
    </template>
    
    <template v-slot:results>
      
      <progress v-if="isLoading" class="progress is-small is-link" max="100">15%</progress>
      <div v-if="!isLoading && apiResponse">

        <div class="notification is-warning is-light">
            The layout dictionary only supports custom fields, custom buttons and inline visualforce pages. Support for standard fields is in development.
        </div>

        <FileDownloadButtons @xml="downloadXml(apiResponse)"
            @excel="copyFile('excel',apiResponse)"
            @csv="copyFile('csv',apiResponse)"
         />

        <MetadataTable :source="apiResponse.datatable" />
      </div>
      <Error v-if="!isLoading && apiError" :error="apiError"/> 
    </template>


  </Panel>
  
</template>

<script>


import MetadataSelection from '@/components/metadata-visualization/MetadataSelection.vue';
import Panel from '@/components/ui/Panel.vue'
import Flag from '@/components/ui/Flag.vue'
import jobSubmission from '@/functions/jobSubmission'
import MetadataTable from '@/components/metadata-visualization/MetadataTable.vue'
import fileExports from '@/functions/fileExports'
import FileDownloadButtons from '@/components/metadata-visualization/FileDownloadButtons.vue'

export default {

    components:{MetadataSelection,Panel,Flag,MetadataTable,FileDownloadButtons},

    setup(){
      let {submitJob,apiError,apiResponse,done,createPostRequest} = jobSubmission();
      let {copyFile,downloadXml} = fileExports();
      return {submitJob,apiError,apiResponse,done,createPostRequest,copyFile,downloadXml};
    },

   
     data(){
      return{
        selectedType:'',
        selectedMember:{},
        usageFlags:{},
        showModal:false
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
          }
        }

        let fetchOptions = this.createPostRequest(data);
      
        this.submitJob('api/boundaries',fetchOptions);
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
              label:'Enhanced report data',
              value:'enhancedReportData',
              description:'Show whether the field is used in report filters, groupings or columns. Only available for the first 100 reports'
            },
            {
              label:'Field in metadata types',
              value:'fieldInMetadataTypes',
              description:'Show whether the field is referenced in the FieldDefinition fields of Custom Metadata Types'
            }
          ]
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