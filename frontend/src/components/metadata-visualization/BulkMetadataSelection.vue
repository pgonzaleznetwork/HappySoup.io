<template>
    <section class="is-flex 
          is-flex-direction-row" @click="delesectInput">
        <section>
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
        <p style="margin-bottom:5px;">Select up to 25 members</p>
        <Listbox  v-if="!isLoading" v-model="selectedMember" :options="suggestedMembers" optionLabel="name" :multiple="true" :filter="true" @change="captureSelected" @filter="processFilter"/>
        </section>
        <section class="selectedSection">
            <div>
            <DataTable :key="tableKey" :value="selectedMembers" responsiveLayout="scroll" class="metadataTable" :scrollable="true" scrollHeight="400px" @row-click="removeItem">
                <Column field="name" header="Name"></Column>
                <Column field="type" header="Metadata Type"></Column>
                <Column field="remove" header="Remove"></Column>
            </DataTable>
            </div>
        </section>
    </section>
    <div class="field">
        <div class="control">
            <button @click="emitSubmit" class="button is-info is-small" :disabled="isLoading || !isFormValid">
            <span class="icon">
                <i class="fas fa-search"></i>
            </span>
            <span style="font-weight:500;">Where are they used?</span>
            </button>
        </div>
    </div>
</template>

<script>


import jobSubmission from '@/functions/jobSubmission';
import Error from '@/components/ui/Error';

export default {

    props:['parentIsLoading'],

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
            selectedMembers:[],
            isLoading:false,
            tableKey:0
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

               this.members = this.members.map(member => {
                   member.type = this.selectedType;
                   member.remove = 'Remove';
                   return member;
               })

                this.isLoading = false;
                this.renameSelectedLabel();
            }
        }
    },

    computed:{
        isFormValid(){
            return this.selectedMembers.length > 0;
        }
    },

    methods:{

        removeItem(event){

            let newArray = this.selectedMembers.filter((member,index) => {
                return index != event.index;
            })

            console.log('NEW',newArray)

            this.selectedMembers = newArray;

            //this.selectedMembers.splice(event.index);
            console.log(this.selectedMembers)
        },

        delesectInput(event){

            let lookupClicked = event.target.className == 'p-listbox-filter p-inputtext p-component';
            let optionClicked = event.target.className == 'p-listbox-item p-highlight'

            if(lookupClicked || optionClicked){
               //valid click
                
            }
            else{
                //the user clicked outside the selection box
                //so we remove the members so that the dropdown disappears
                this.suggestedMembers = [];
            }
        },

        captureSelected(event){

            if(event.value.length == 25){
                alert(`You've reached the maximum number of selected items`);
            }
            this.selectedMembers = event.value;
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
        },

        emitSubmit(){

            let ids = this.selectedMembers.map(m => m.id);
            console.log(ids);
            this.$emit('submit',ids);   
        }
    }


}
</script>

<style lang="scss" scoped>

    .selectedSection{
        margin-left: 200px;
    }

    .metadataTable{
        width: 700px;
        @extend .text-size;
    }

    .button{
        margin-top: 20px;
    }

</style>