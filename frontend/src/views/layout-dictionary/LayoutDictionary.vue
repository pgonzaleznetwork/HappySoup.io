<template>

  <Panel>
    <template v-slot:title>
      Page Layout Dictionary
    </template>

    <template v-slot:tip>
      <p>Page Layout info <a @click.prevent="toggleModal">Learn more</a></p>

      <Modal :is-active="showModal" @closeModal="toggleModal">
        <template v-slot:title>
          Page Layout
        </template>
        <template v-slot:content>
          <h3>What is Impact Analysis?</h3>
          <p>Your custom fields, apex classes and other types of metadata don't live in isolation. They are most likey used by other metadata types, for example:</p>
          <ul>
            <li>Custom fields are used by page layouts, apex classes, email templates, etc.</li>
            <li>Email templates are used by workflow alerts or approval processes; or even apex.</li>
            <li>Apex classes can be used by visualforce pages or apex triggers</li>
          </ul>
          <p>With this said, it's important to understand what is the impact of making changes to a particular piece of metadata.</p>
          <h3>Use cases</h3>
          <p>You can use this feature to answer questions like</p>
          <ul>
            <li>What reports will be impacted if I rename this picklist value?</li>
            <li>I keep getting this email when an account is created, which workflow is sending the email template?</li>
            <li>I'm converting custom labels into custom metadata types, how do I know where the labels are used?</li>
          </ul>
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
      
      <MetadataTable :source="source"/>

      <progress v-if="isLoading" class="progress is-small is-success" max="100">15%</progress>
      <div v-if="!isLoading && apiResponse">
       
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



export default {

    components:{MetadataSelection,Panel,Flag,MetadataTable},

    setup(){
      let {submitJob,apiError,apiResponse,done} = jobSubmission();
      return {submitJob,apiError,apiResponse,done};
    },

   
     data(){
      return{
        selectedType:'',
        selectedMember:{},
        usageFlags:{},
        showModal:false,
        source:{
          columns:[{field: 'name', header: 'API Name'},
            {field: 'type', header: 'Metadata Type'},
            {field: 'id', header: 'Id'},
            {field: 'url', header: 'URL'}],
          data:[
            {
              name:'My 2 Layout',
              type:'Layout',
              id:'004340546565',
              url:'000406506050/salesforce.com'
            },
            {
              name:'A My Layout',
              type:'WebLink',
              id:'4444',
              url:'000406344506050/salesforce.com'
            },
            {
              name:'A My 3 Layout',
              type:'Layout',
              id:'4444',
              url:'000406344506050/salesforce.com'
            },
            {
              name:'A My5  Layout',
              type:'WebLink',
              id:'44gggg44',
              url:'000406344506050/salesforce.com'
            }
          ]
        }
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