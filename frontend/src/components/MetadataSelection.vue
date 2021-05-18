<template>
    <section>
        <div class="field">
            <label class="label">Metadata Type</label>
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
        <Error v-if="!isLoading && apiError" :error="apiError"/>
        <div class="field">
            <label class="label">Metadata Name</label>
            <div class="control">
            <Autocomplete
            :key="selectedType"
            :disabled="isLoading || selectedType == ''"
            :suggestions="members"
            debounce=700
            @memberSelected="getSelectedMember"
            @empty="selectedMember = null">
            </Autocomplete>
          </div>
        </div>

        <div class="field">
            <div class="control">
                <button @click="emitSubmit" class="button is-success" :disabled="isLoading || !isFormValid">
                <span class="icon">
                    <i class="fas fa-search"></i>
                </span>
                <span>{{buttonLabel}}</span>
                </button>
            </div>
        </div>

    </section>
</template>

<script>

import Autocomplete from '@/components/Autocomplete';
import jobSubmission from '@/functions/jobSubmission';
import Error from '@/components/Error';

export default {
  components: { Autocomplete , Error},

    props:['filter','values','mode','parentIsLoading','buttonLabel'],

    setup(){
      let {submitJob,apiError,apiResponse,done} = jobSubmission();
      return {submitJob,apiError,apiResponse,done};
    },

    data(){
        return{
            types:[],
            selectedType:'',
            selectedMember:null
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

        isFormValid(){
            return (this.selectedType != '' || this.selectedType != null || Object.keys(this.selectedMember).length != 0) && this.selectedMember != null;
        },

        members(){
            return this.apiResponse;
        },

    },

    watch: {
        
        done: function (newDone, oldDone) {
            if(!oldDone && newDone && !this.apiError){
                this.renameSelectedLabel();
            }
        }
    },
    
    methods:{

        emitSubmit(){
            this.$emit('submitted')
        },

        getSelectedMember(data){
            this.selectedMember = data;
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