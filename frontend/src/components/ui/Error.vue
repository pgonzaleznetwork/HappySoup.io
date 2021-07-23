<template>
    <div class="notification is-danger is-light">
        <div v-if="genericError">
            <p>We are sorry, something went wrong. Please click <a href="https://github.com/pgonzaleznetwork/sfdc-happy-soup/issues/new" target="_blank">here</a> to log a Github 
            issue so that we can review the error. Please include the following details: {{error.message}}</p>
            <p>{{error.stack}}</p>
        </div>
         <div v-if="salesforceError">
            <p>Unable to connect to Salesforce. Please check your internet connection or the status of your org at trust.salesforce.com. If the error persists, 
            please click <a href="https://github.com/pgonzaleznetwork/sfdc-happy-soup/issues/new" target="_blank">here</a> to log a Github 
            issue so that we can review the error. Please include the following details: </p>
            <p>{{error.stack}}</p>
        </div>
    </div>
</template>

<script>
export default {

    props:['error'],

    data(){
        return{
            text:'',
            genericError:false,
            salesforceError:false
            
        }
    },

    mounted(){

        if(this.error.message === 'session-expired'){
            window.location = '/?logout=true';
        }

        else if(this.error.message === 'no-sfdc-connection'){     
            this.salesforceError = true;     
        }
        else{
            this.genericError = true;
        }
    }

}
</script>

<style>

</style>