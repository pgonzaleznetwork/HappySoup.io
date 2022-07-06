<template>

  <Panel>
    <template v-slot:title>
      Workflow Migration Info
    </template>

    

    <template v-slot:tip>

      <p>This tool lets you export all the information of the workflow rules for a given object, in an easy to understand format. You can use this to audit your workflows and decide which ones to move over the flows</p>

      <iframe width="360" height="215" src="https://www.youtube.com/embed/X6k2msXeAgM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

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
              @submitted="submitWorkflowJob"
              filter="only" 
              values="CustomObject"
              :parentIsLoading="isLoading"
              dropdownName="Select any"
              autoCompleteName="Select the object you want to export workflows from"
              button-label="Export Workflow Info"/>
            </div>
          </div>
        </div>
      </div>
      
    </template>
    
    <template v-slot:results>
      
      <progress v-if="isLoading" class="progress is-small is-link" max="100">15%</progress>
      <div v-if="!isLoading && apiResponse">

        <div class="notification is-success is-light">
            Done! Click the "Copy" button below and  paste the results in a file .csv file. Then upload that to a spreadsheet (check the video above for more details!)
        </div>

        <FileDownloadButtons 
            :hideExcel=true
            :hideXml=true
            @csv="copyFile('csv',apiResponse)"
         />

        
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

      async submitWorkflowJob(){

        this.done = false;

        let data = {
          entryPoint : {
            name:this.selectedMember.name,
            id:this.selectedMember.id,
            type:this.selectedType,
          }
        }

        let fetchOptions = this.createPostRequest(data);
      
        this.submitJob('api/workflows',fetchOptions);
      }
    },


    computed:{

      hasError(){
        
        return true;
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