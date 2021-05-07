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

      <form @submit.prevent="login">

        <div class="is-flex 
          is-flex-direction-row">

          <div>
            <div class="field">
              <MetadataSelection @typeSelected="getSelectedType" @memberSelected="getSelectedMember"/>
            </div>
             <SearchButton title="Where is this used?"/>
          </div>

          <div v-if="flags?.length" style="margin-left: 50px;">
            <div >
              <div class="has-text-weight-bold" >
                Choose your toppings
              </div>
              <Flag v-for="flag in flags" :name="flag.label" :content="flag.description"/>
            </div>
          </div>

        </div>
      </form>
    </template>

  </Panel>

</template>

<script>


import MetadataSelection from '@/components/MetadataSelection.vue';
import Panel from '@/components/Panel.vue'
import Flag from '@/components/Flag.vue'
import SearchButton from '@/components/SearchButton.vue'


export default {

    components:{MetadataSelection,Panel,Flag,SearchButton},

   
     data(){
      return{
        selectedType:'',
        selectedMember:{}
      }
    },

    methods:{
      getSelectedType(selectedType){
        this.selectedType = selectedType;
      },

      getSelectedMember(selectedMember){
        this.selectedMember = selectedMember;
      }
    },

    computed:{
      flags(){
        if(this.selectedType == 'CustomField'){
          return [
            {
              label:'enhanced report data',
              value:'EnhancedReportData',
              description:'Show whether the field is used in report filters, groupings or columns. Only available for the first 100 reports'
            },
            {
              label:'Field in metadata types',
              value:'fieldInMetadataTypes',
              description:'Show whether the field is referenced in the FieldDefinition fields of Custom Metadata Types'
            }
          ]
        }
      }
    }

}
</script>

<style lang="scss" scoped>

  @import '/assets/bulma-tooltip.css'

</style>