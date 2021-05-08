import {ref} from 'vue';

function jobSubmission(){

    let intervalId;
    let apiError = ref(null);
    let apiResponse = ref(null);

    async function submitJob(jobDetails){

        let {url,fetchOptions} = jobDetails;

        let res = await fetch(url,fetchOptions);
        let json = await res.json();
    
        let {jobId,error} = json;
    
        if(jobId){
            intervalId = window.setInterval(checkJobStatus,4000,jobId);
        }     
        else if(error){
            apiError.value = error;
        }
        //got cached data
        else{
            apiResponse.value = json;
        }
    }

    async function checkJobStatus(jobId){

        let res = await fetch(`/api/job/${jobId}`);
        let result = await res.json();

        let {state,error,response} = result;

        if(state == 'completed'){
            window.clearInterval(intervalId);
            console.log('completed',response);
            apiResponse.value = response;
        }
        else if(state == 'failed'){
            window.clearInterval(intervalId);
            apiError.value = error;
            console.log('failed');
        }
    }

    return {submitJob,apiError,apiResponse};

}

export default jobSubmission;