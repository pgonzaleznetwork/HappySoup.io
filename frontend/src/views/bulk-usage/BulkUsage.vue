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
              <BulkMetadataSelection @submit="submitBulkUsageJob" :parentIsLoading="isLoading"/>
            </div>
          </div>
        </div>
      </div>
      
    </template>

    
    <template v-slot:results>
      <progress v-if="isLoading" class="progress is-small is-success" max="100">15%</progress>
      <div v-if="!isLoading && apiResponse">
        <div class="notification is-warning is-light">
            <span v-html="resultsDescription"></span>
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


import BulkMetadataSelection from '@/components/metadata-visualization/BulkMetadataSelection.vue';
import Panel from '@/components/ui/Panel.vue'
import Flag from '@/components/ui/Flag.vue'
import jobSubmission from '@/functions/jobSubmission'
import fileExports from '@/functions/fileExports'
import MetadataTable from '@/components/metadata-visualization/MetadataTable.vue';
import FileDownloadButtons from '@/components/metadata-visualization/FileDownloadButtons.vue'


export default {

    components:{Panel,Flag,MetadataTable,BulkMetadataSelection,FileDownloadButtons},

    setup(){
      let {submitJob,apiError,apiResponse,done,createPostRequest} = jobSubmission();
      let {copyFile} = fileExports();
      return {submitJob,apiError,apiResponse,done,createPostRequest,copyFile};
    },

   
     data(){
      return{
        selectedType:'',
        resultsDescription:`The Bulk Impact Analysis is <b>NOT</b> as powerful as the single impact analysis. If you want detailed information about a component, use the Impact Analysis tab`,
        selectedMember:{},
        usageFlags:{},
        typesToExclude:['ValidationRule','Layout'],
        showModal:false,
      }
    },

    methods:{

      downloadXml(){
        alert('package.xml is not available for bulk impact analysis at this time.');
      },
      
      async submitBulkUsageJob(event){

        this.done = false;

        let data = {
          ids : event
        }

        let fetchOptions = this.createPostRequest(data);
      
        this.submitJob('api/bulkusage',fetchOptions);
      }
    },


    computed:{

      hasError(){
        
        return true;
      },

      isLoading(){
        return !this.done;
      },

    }

}
</script>

<style lang="scss" scoped>

  @import '/assets/bulma-tooltip.css';

  .progress{
    width: 50%;
  }

</style>