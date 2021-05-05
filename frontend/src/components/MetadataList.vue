<template>
    <section>
        <div class="field">
            <label class="label">Metadata Type</label>
            <div class="control has-icons-left">
            <div class="select"  :class="{'is-loading':isLoading}">
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
        <div class="field">
          <label class="label">Metadata Name</label>
          <div class="control">
           <Autocomplete
            :disabled="isLoading || selectedType == ''"
            @input="updateSearchText"
            :suggestions="memberNames"
            @onSelect="showItem"
            debounce=800
        ></Autocomplete>
          </div>
        </div>
    </section>
</template>

<script>
import Autocomplete from '../components/Autocomplete';


export default {
  components: { Autocomplete },

    props:['filter','values','mode'],

    data(){
        return{
            types:[],
            selectedType:'',
            intervalId:'',
            members:[],
            selectedMember:'',
            searchText:'',
            loading:false
        }
    },

    async beforeMount(){
        let res = await fetch('/api/supportedtypes');
        let types = await res.json();

        if(this.filter){
            if(this.filter == 'exclude'){

                this.types = types.filter(type => {
                    return !this.values.includes(type);
                })   
            }
            else if(this.filter == 'only'){
                this.types = types.filter(type => {
                    return type.value == this.values;
                })
            }
        }
        else{
            this.types = types;
        }
    },

    computed:{
        memberNames(){
            if(this.members.length){
                return this.members.map(member => member.name);
            }
            else{
                return [];
            }   
        },

        isLoading(){
            return this.loading;
        }
    },
    
    methods:{


        async getMembers(){
            
            this.loading = true;

            let res = await fetch(`/api/metadata?mdtype=${this.selectedType}`);
            let json = await res.json();

            let {jobId} = json;

            if(jobId){
                this.intervalId = window.setInterval(this.checkJobStatus,4000,jobId);
            }     

            else if(json.error){
                console.log('error',error);
                this.loading = false;
                //handleError(json);
               // UI.toggleDropdown(mdDropDown,false);
                //UI.hideProgressBar();
            }
            else{
                this.loading = false;
                this.members = json;
                this.renameSelectedLabel();
            }
        },

        async checkJobStatus(jobId){

            let res = await fetch(`/api/job/${jobId}`);
            let result = await res.json();

            let {state,error,response} = result;

            if(state == 'completed'){
                window.clearInterval(this.intervalId);
                console.log('completed',response);
                this.members = response;
                this.loading = false;
                this.renameSelectedLabel();
            }
            else if(state == 'failed'){
                window.clearInterval(this.intervalId);
                this.loading = false;
                console.log('failed');
            }
        },

        renameSelectedLabel(){
            this.$refs[this.selectedType].label = `${this.$refs[this.selectedType].label} (${this.members.length})`;
        }
    }

}
</script>

<style lang="scss" scoped>

    

    section{
        max-width: 362px;
    }

</style>