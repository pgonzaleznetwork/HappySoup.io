<template>
    {{text}}
</template>

<script>
export default {

    props:['error'],

    data(){
        return{
            text:''
        }
    }

    mounted(){

        if(error.message === 'session-expired'){
            window.location = '/?logout=true';
        }

        else if(error.message === 'no-sfdc-connection'){     
            this.text = `Unable to connect to Salesforce. Please check your internet connection or the status of your org at trust.salesforce.com
            ${error.stack}`;     
        }
        else{
            this.text = `We are sorry, something went wrong. Please click <a style="font-weight: bold" href="https://github.com/pgonzaleznetwork/sfdc-happy-soup/issues/new" target="_blank">here</a> to log a Github 
            issue so that we can review the error. Please include the following details: ${error.message} 
            ${error.stack}
            
            <p>If you don't have a github account, please email us a <b>pgonzaleznetwork@gmail.com</b></p>
            `;
        }
    }

}
</script>

<style>

</style>