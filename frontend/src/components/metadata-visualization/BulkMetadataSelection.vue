<template>
  Bulk Selection
    <div class="field">
        <label class="label label-size">Metadata Type</label>
        <div class="control has-icons-left">
        <div class="select is-small" >
            <select v-model="selectedType" @change="getMembers" :disabled="isLoading">
            <option value="" disabled selected hidden>Select...</option>
            <option  v-for="type in types" :key="type.label" :value="type.value" :ref="type.value">
                {{type.label}}
            </option>
            </select>
        </div>
        <div class="icon is-small is-left">
            <i class="fas fa-code"></i>
        </div>
        </div>
    </div>
    <div class="field" v-if="!done">
        <p class="is-size-7">Loading metadata. This can take a minute in large orgs (specially sandboxes)</p>
        <progress  class="progress is-small is-primary" max="100">15%</progress>
    </div>
    <Listbox v-if="!isLoading" v-model="selectedMember" :options="suggestedMembers" optionLabel="name" :multiple="true" :filter="true" @change="captureSelected" @filter="processFilter"/>
</template>

<script>


import jobSubmission from '@/functions/jobSubmission';
import Error from '@/components/ui/Error';

export default {

    setup(){
      let {submitJob,apiError,apiResponse,done,createPostRequest} = jobSubmission();
      return {submitJob,apiError,apiResponse,done,createPostRequest};
    },

    data() {
        return {
            selectedMember: null,
            types:[],
            selectedType:'',
            members:[],
            suggestedMembers:[],
            isLoading:false
        }
    },

    async beforeMount(){
        let res = await fetch('/api/metadata');
        let types = await res.json();
        this.types = types;
    },

    watch: {
        
        done: function (newDone, oldDone) {
            if(!oldDone && newDone && !this.apiError){

                this.members = this.apiResponse;
                this.members.sort((a,b) =>{
                 return (a.name > b.name) ? 1 : -1
               });

                this.isLoading = false;
                this.renameSelectedLabel();
            }
        }
    },

    methods:{

        captureSelected(event){
            console.log(event)
        },

        processFilter(event){
            let keyword = event.value;

            if(keyword == ''){
                this.suggestedMembers = [];
                return;
            }
            
            this.suggestedMembers = this.members.filter(member => {
                let memberLowerCase = member.name.toLowerCase();
                let keywordLowerCase = keyword.toLowerCase();
                if(memberLowerCase.includes(keywordLowerCase)){
                    return member;
                }
            });
        },

        async getMembers(){

            this.isLoading = true;

            let data = {
                metadataType:this.selectedType
            }

            let fetchOptions = this.createPostRequest(data);
            
            this.done = false;
            this.$emit('typeSelected',this.selectedType);            
            this.submitJob(`/api/metadata`,fetchOptions);

        },

        renameSelectedLabel(){
            let label = this.$refs[this.selectedType].label;
            if(label.includes('(') && label.includes(')')) return;
            this.$refs[this.selectedType].label = `${label} (${this.members.length})`;        
        }
    }


}
</script>

<style>

</style>