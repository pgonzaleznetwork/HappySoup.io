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
            intervalId = window.setInterval(checkJobStatus,6000,jobId);
        }     
        else if(error){
            apiError.value = json;
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
            console.log(response);
        }
        else if(state == 'failed'){
            window.clearInterval(intervalId);
            apiError.value = error;
            done.value = true;
            console.error('failed',apiError.value);
        }
    }

    function createPostRequest(data){

        let fetchOptions = {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }

        return fetchOptions;
    }

    return {submitJob,apiError,apiResponse,done,createPostRequest};

}

export default jobSubmission;