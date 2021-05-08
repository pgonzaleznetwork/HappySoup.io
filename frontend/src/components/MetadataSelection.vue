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
            :suggestions="members"
            debounce=700
            @memberSelected="getSelectedMember"
            @onEmpty="notifyEmpty"
        ></Autocomplete>
          </div>
        </div>
    </section>
</template>

<script>

import Autocomplete from '@/components/Autocomplete';
import jobSubmission from '@/functions/jobSubmission'



export default {
  components: { Autocomplete },

    props:['filter','values','mode','parentIsLoading'],

    setup(){
      let {submitJob,apiError,apiResponse,done} = jobSubmission();
      return {submitJob,apiError,apiResponse,done};
    },

    data(){
        return{
            types:[],
            selectedType:'',
        }
    },

    async beforeMount(){
        let res = await fetch('/api/supportedtypes');
        let types = await res.json();

        if(this.filter){
            if(this.filter == 'exclude'){

                this.types = types.filter(type => {
                    return !this.values.includes(type.value);
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
        
        isLoading(){
            return !this.done || this.parentIsLoading;
        },

        members(){
            return this.apiResponse;
        },

        error(){
            return this.apiError;
        }
    },

    watch: {
        
        done: function (newDone, oldDone) {
            if(!oldDone && newDone){
                this.renameSelectedLabel();
            }
        }
    },
    
    methods:{

        notifyEmpty(){
            this.$emit('emptyField')
        },

        getSelectedMember(data){
            this.$emit('memberSelected',data);
        },

        async getMembers(){
            
            this.done = false;
            this.$emit('typeSelected',this.selectedType);            
            this.submitJob(`/api/metadata?mdtype=${this.selectedType}`);

        },

        renameSelectedLabel(){
            let label = this.$refs[this.selectedType].label;
            if(label.includes('(') && label.includes(')')) return;
            this.$refs[this.selectedType].label = `${label} (${this.members.length})`;
        }
    }

}
</script>

<style lang="scss" scoped>

    section{
        max-width: 362px;
    }

</style>