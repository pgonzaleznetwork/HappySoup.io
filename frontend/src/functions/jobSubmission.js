import {ref} from 'vue';

function jobSubmission(){

    let intervalId;
    let apiError = ref(null);
    let apiResponse = ref(null);
    let done = ref(true);

    async function submitJob(url,fetchOptions = {}){

        let res = await fetch(url,fetchOptions);
        let json = await res.json();
    
        let {jobId,error} = json;
    
        if(jobId){
            intervalId = window.setInterval(checkJobStatus,4000,jobId);
        }     
        else if(error){
            apiError.value = error;
            done.value = true;
        }
        //got cached data
        else{
            apiResponse.value = json;
            done.value = true;
        }
    }

    async function checkJobStatus(jobId){

        let res = await fetch(`/api/job/${jobId}`);
        let result = await res.json();

        let {state,error,response} = result;

        if(state == 'completed'){
            window.clearInterval(intervalId);
            apiResponse.value = response;
            done.value = true;
        }
        else if(state == 'failed'){
            window.clearInterval(intervalId);
            apiError.value = error;
            done.value = true;
            console.log('failed');
        }
    }

    return {submitJob,apiError,apiResponse,done};

}

export default jobSubmission;