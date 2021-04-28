<template>
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
</template>

<script>
export default {

    data(){
        return{
            types:[],
            selectedType:''
        }
    },

    async beforeMount(){
        let res = await fetch('/api/supportedtypes');
        this.types = await res.json();
    },

    methods:{
        getMembers(){
            console.log('getting members for ',this.selectedType);
        }
    }

}
</script>

<style>

</style>