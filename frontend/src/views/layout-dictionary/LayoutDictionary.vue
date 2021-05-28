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
          <div v-if="flags?.length" style="margin-left: 50px;">
            <div >
              <div class="has-text-weight-bold" style="margin-bottom:10px;">
                Choose your toppings
              </div>
              <Flag v-for="flag in flags" :label="flag.label" :value="flag.value" :description="flag.description" @ticked="setFlag"/>
            </div>
          </div>

        </div>
      </div>
      
    </template>

    
    <template v-slot:results>
      
     

      <progress v-if="isLoading" class="progress is-small is-success" max="100">15%</progress>
      <div v-if="!isLoading && apiResponse">
        <div class="is-flex is-flex-direction-row is-justify-content-flex-end mb-4">
            <button @click="downloadXml(apiResponse)" class="button is-small is-warning">
                    <span class="icon">
                        <i class="fa fa-download"></i>
                    </span>
                    <span>Download package.xml</span>
            </button>
            <button @click="copyFile('excel',apiResponse)" class="button is-small is-warning ml-3">
                <span class="icon">
                    <i class="fa fa-copy"></i>
                </span>
                <span>Copy (Excel)</span>
            </button>
            <button @click="copyFile('csv',apiResponse)" class="button is-small is-warning ml-3">
                <span class="icon">
                    <i class="fa fa-copy"></i>
                </span>
                <span>Copy (csv)</span>
            </button>
        </div>
        <MetadataTable :source="apiResponse.datatable" title="Metadata in Page Layout"/>
      </div>
      <Error v-if="!isLoading && apiError" :error="apiError"/> 
    </template>


  </Panel>
  
</template>

<script>


import MetadataSelection from '@/components/MetadataSelection.vue';
import Panel from '@/components/Panel.vue'
import Flag from '@/components/Flag.vue'
import jobSubmission from '@/functions/jobSubmission'
import MetadataTable from '@/components/MetadataTable.vue'
import fileExports from '@/functions/fileExports'

export default {

    components:{MetadataSelection,Panel,Flag,MetadataTable},

    setup(){
      let {submitJob,apiError,apiResponse,done} = jobSubmission();
      let {copyFile,downloadXml} = fileExports();
      return {submitJob,apiError,apiResponse,done,copyFile,downloadXml};
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
        let options = JSON.stringify(this.usageFlags);
        let url = `api/dependencies?name=${this.selectedMember.name}&id=${this.selectedMember.id}&type=${this.selectedType}&options=${options}`;       
        this.submitJob(url);
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