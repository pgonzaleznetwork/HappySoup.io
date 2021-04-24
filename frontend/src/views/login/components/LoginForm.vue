<template>
  <div>
     <form>
       <div id="logo">
          <img src="../../../assets/logo.png"/>
        </div>
      <div class="field">
        <label class="label">Login Type</label>
        <div class="control has-icons-left">
              <div class="select">
                <select v-model="loginType" @change="handleLoginType">
                  <option selected value="sandbox">Sandbox</option>
                  <option value="production">Production</option>
                  <option value="domain">My domain</option>
                </select>
              </div>
              <div class="icon is-small is-left">
                <i class="fas fa-server"></i>
              </div>
            </div>
      </div>
      <div v-if="showDomain" class="field">
        <label class="label">My Domain</label>
        <div class="control">
          <input class="input is-danger" type="text" placeholder="https://your-domain.my.salesforce.com">
        </div>
        <p class="help is-danger">Invalid domain URL</p>
      </div>

      <div class="field">
        <div class="control">
          <label class="checkbox">
            <input v-model="privacyAccepted" type="checkbox">
            I agree to the HappySoup.io privacy policy
          </label>
        </div>
      </div>

      <div class="field">
      <div class="control">
         <button class="button is-primary" :disabled="!isFormValid">
          <span class="icon">
            <i class="fas fa-cloud"></i>
          </span>
          <span>Log in with Salesforce</span>
        </button>
      </div>
    </div>
     
     

     </form>
      
  </div>
</template>

<script>

export default {

  

  data(){
    return{
      privacyAccepted:false,
      isFormInvalid:true,
      loginType:'sandbox'
    }
  },

  computed:{
    showDomain(){
      return this.loginType == 'domain';
    },

    isFormValid(){
      if(this.loginType == 'domain'  && this.privacyAccepted){
        return true;
      }
      return false;
    }

  },

  methods:{

  }


}
</script>

<style>
  .label{
    color:white;
  }

  form{
    padding:30px;
    border: 2px solid white;
    height: 400px;
    position: absolute;
    top: 30%;
    left: 50%;
    transform: translate(-50%,-30%);
  }

  img{
    width:200px; 
    height:100px;
    
  }
</style>

