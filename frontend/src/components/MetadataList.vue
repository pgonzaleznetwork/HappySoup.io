<template>
    <section>
        <div class="field">
            <label class="label">Metadata Type</label>
            <div class="control has-icons-left">
            <div class="select">
                <select v-model="selectedType" @change="getMembers">
                <option  v-for="type in types" :key="type.label" :value="type.value">{{type.label}}</option>
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
            searchText:''
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

        matchingMembers(){
            if (this.searchText.length < 1) { return [] }
                return this.memberNames.filter(member => {
                    return member.toLowerCase()
                    .includes(this.searchText.toLowerCase())
                })
        }
    },
    
    methods:{

        showItem(item){
            console.log(item);
        },

        updateSearchText(value){
            this.searchText = value;
            console.log(this.searchText);
        },

        async getMembers(){
            console.log('getting members for ',this.selectedType);

            let res = await fetch(`/api/metadata?mdtype=${this.selectedType}`);
            let json = await res.json();

            let {jobId} = json;

            if(jobId){
                this.intervalId = window.setInterval(this.checkJobStatus,4000,jobId);
            }     

            else if(json.error){
                console.log('error',error);
                //handleError(json);
               // UI.toggleDropdown(mdDropDown,false);
                //UI.hideProgressBar();
            }
            else{
                //we got cached data
                console.log('cached data');
                this.members = json;
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
                
            }
            else if(state == 'failed'){
                window.clearInterval(this.intervalId);
                console.log('failed');
            }
        }
    }

}
</script>

<style lang="scss" scoped>

    

    section{
        max-width: 362px;
    }

</style>