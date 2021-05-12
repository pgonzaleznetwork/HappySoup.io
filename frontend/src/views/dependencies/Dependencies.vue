<template>

  <Panel>
    <template v-slot:title>
      Impact Analysis
    </template>

    <template v-slot:tip>
      <p>If you know where a piece of metadata is used (i.e what depends on it), you will know what could break if you make changes to it.</p>
      <p>You can also use this to answer questions like: <i>What automation (workflow/apex/etc.) is assigning this value to this field?</i> or 
      <i>What workflow is sending this email template?</i>.</p>
      
    </template>

    <template v-slot:form>

      <div>

        <div class="is-flex 
          is-flex-direction-row">

          <div>
            <div class="field">
              <MetadataSelection @typeSelected="getSelectedType" 
              @memberSelected="getSelectedMember" 
              filter="exclude" 
              :values="typesToExclude"
              :parentIsLoading="isLoading"/>
            </div>
             <TheButton title="Where is this used?" @clicked="submitUsageJob" :disabled="isLoading || !formIsValid"/>
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
      <DependencyResultPanel v-if="apiResponse" :metadata-tree="apiResponse.usageTree" :api-response="apiResponse"/>      
    </template>


  </Panel>
  
</template>

<script>


import MetadataSelection from '@/components/MetadataSelection.vue';
import Panel from '@/components/Panel.vue'
import Flag from '@/components/Flag.vue'
import TheButton from '@/components/TheButton.vue'
import jobSubmission from '@/functions/jobSubmission'
import MetadataTree from '@/components/MetadataTree.vue'
import DependencyResultPanel from '@/components/DependencyResultPanel.vue';


export default {

    components:{MetadataSelection,Panel,Flag,TheButton,MetadataTree,DependencyResultPanel},

    setup(){
      let {submitJob,apiError,apiResponse,done} = jobSubmission();
      return {submitJob,apiError,apiResponse,done};
    },

   
     data(){
      return{
        selectedType:'',
        selectedMember:{},
        usageFlags:{},
        typesToExclude:['ValidationRule','Layout']
      }
    },

    methods:{
      getSelectedType(selectedType){
        this.selectedType = selectedType;
      },

      getSelectedMember(selectedMember){
        this.selectedMember = selectedMember;
      },

      setFlag(data){
        this.usageFlags[data.value] = data.ticked;
      },

      async submitUsageJob(){

        this.done = false;
        let options = JSON.stringify(this.usageFlags);
        let url = `api/usage?name=${this.selectedMember.name}&id=${this.selectedMember.id}&type=${this.selectedType}&options=${options}`;       
        this.submitJob(url);
      }

    },


    computed:{

      isLoading(){
        return !this.done;
      },

      formIsValid(){
        return this.selectedType != '' && this.selectedMember != null && Object.keys(this.selectedMember).length != 0;
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