<template>
    <section class="is-flex 
          is-flex-direction-row" @click="delesectInput">
        <section>
            <div class="field">
                <label class="label label-size">Metadata Type</label>
                <div class="control has-icons-left">
                <div class="select is-small" >
                    <select v-model="selectedType" @change="getMembers" :disabled="isLoading || parentIsLoading ">
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
                <progress  class="progress is-small is-link" max="100">15%</progress>
            </div>
        <div class="field">
            <label class="label label-size">Metadata Name  (Select 1 or more)</label>
            <div class="control">
                <MultiSelectAutoComplete
                :key="selectedType"
                :disabled="isLoading || selectedType == '' || parentIsLoading " 
                :suggestions="members"
                inputWidth="100%"
                debounce=700
                @memberSelected="getSelectedMember"
                @empty="selectedMember = null">
                </MultiSelectAutoComplete>
          </div>
        </div>
        
        <!--<Listbox  v-if="!isLoading" v-model="selectedMember" :options="suggestedMembers" optionLabel="name" :multiple="true" :filter="true" @change="captureSelected" @filter="processFilter"/>-->
        </section>
        <section class="selectedSection">
            <div>
            <DataTable :key="tableKey" :rowHover="true" :value="selectedMembers" responsiveLayout="scroll" class="metadataTable" :scrollable="true" scrollHeight="400px" @row-click="removeItem">
                <Column field="name" header="Name"></Column>
                <Column field="type" header="Metadata Type"></Column>
                <Column field="remove" header="Remove"></Column>
            </DataTable>
            </div>
            <p style="text-align:center;margin-top:10px;font-weight:bold;">{{selectedMembers.length}} selected</p>
        </section>
    </section>
    <div class="field">
        <div class="control">
            <button @click="emitSubmit" class="button is-info is-small" :disabled="isLoading || !isFormValid || parentIsLoading">
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
import MultiSelectAutoComplete from '@/components/ui/MultiSelectAutoComplete';

export default {

    components:{MultiSelectAutoComplete},

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
            selectedMembers:[],
            isLoading:false,
            tableKey:0
        }
    },

    async beforeMount(){
        
        let res = await fetch('/api/metadata');
        let types = await res.json();

        let typesToExclude = [
            'Layout',
            'ValidationRule',
            'StandardField',
            'ApexTrigger'
        ]

        this.types = types.filter(type => {
            return !typesToExclude.includes(type.value);
        });

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

        getSelectedMember(event){

            let {id,name} = event;
            let member = {
                id,
                name,
                type:this.selectedType,
                remove:'Remove'
            };

            if(this.selectedMembers.length == 40){
                alert(`You've reached the maximum number of selected items`);
                return;
            }
            else{

                let ids = this.selectedMembers.map(m => m.id);

                //don't allow duplicates in the list
                if(!ids.includes(member.id)){
                    this.selectedMembers.push(member);
                }
            }    
        },

        removeItem(event){

            let filteredArray = this.selectedMembers.filter((member,index) => {
                return index != event.index;
            })

            this.selectedMembers = filteredArray;
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

    .button.is-info{
        margin-top: 20px;
        background-color: $alternative-background;
    }

    .pui-datatable thead th:nth-child(1),
.pui-datatable tbody td:nth-child(1),
.pui-datatable tfoot td:nth-child(1) {
    width: 50px;
}

.pui-datatable thead th:nth-child(2),
.pui-datatable tbody td:nth-child(2),
.pui-datatable tfoot td:nth-child(2) {
    width: 100px;
}

</style>