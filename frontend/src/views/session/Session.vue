<template>
  <Panel>
    <template v-slot:title>
      API Session Info
    </template>

     <template v-slot:tip>
         Use this session ID to connect to the API
     </template>

     <template v-slot:results>
        <p><b>Token</b>: {{token}}</p>
        <p><b>Refresh Token</b>: {{refreshToken}}</p>
        <p><b>URL</b>: {{url}}</p>
       
     </template>

  </Panel>
</template>

<script>

import Panel from '@/components/ui/Panel.vue'

export default {

    components:{Panel},

    data(){
        return{
            token:'',
            refreshToken:'',
            url:''
        }
    },

    async mounted(){
        let res = await fetch('/api/session');
        let sessionData = await res.json();
        this.token = sessionData.token;
        this.refreshToken = sessionData.refreshToken;
        this.url = sessionData.url;
    }

}
</script>

<style>

</style>