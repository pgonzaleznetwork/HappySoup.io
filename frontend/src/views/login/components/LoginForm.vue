<template>
  <form @submit.prevent="login" >
    <div class="is-flex is-flex-direction-row is-justify-content-center field">
      <div class="happy-logo">
        <img src="../../../assets/logo.png" />
      </div>
    </div>
    <div class="line field"></div>
    <p class="has-text-centered is-size-6 mb-5">
      Don't break your Salesforce org, drink a happy soup instead
    </p>
    <div class="field">
      <label class="label">Login Type</label>
      <div class="control has-icons-left">
        <div class="select">
          <select v-model="loginType">
            <option selected value="test">Sandbox</option>
            <option value="login">Production</option>
            <option value="domain">My Domain</option>
          </select>
        </div>
        <div class="icon is-small is-left">
          <i class="fas fa-server"></i>
        </div>
      </div>
    </div>
    <div v-if="showDomain" class="field">
      <label class="label">My Domain</label>
      <div class="control has-icons-right">
        <input
          class="input"
          v-model="domain"
          type="text"
          @keyup="showMe"
          placeholder="https://your-domain.my.salesforce.com"
          :class="domainColor"
        />
        <span v-if="!validDomain" class="icon is-small is-right">
          <i class="fas fa-exclamation-triangle" ></i>
        </span>
        <span v-else class="icon is-small is-right">
          <i class="fas fa-check"></i>
        </span>
      </div>
      <p v-if="!validDomain" class="help is-danger">Invalid domain URL</p>
    </div>

    <div class="field">
      <div class="control">
        <label>
          <input v-model="privacyAccepted" type="checkbox" />
          I agree to the HappySoup.io <a  href="https://github.com/pgonzaleznetwork/sfdc-happy-soup#privacy-policy" target="_blank">Privacy Policy</a>
        </label>
      </div>
    </div>

    <div class="field">
      <div class="control">
        <button class="button is-link" :disabled="!isFormValid">
          <span class="icon">
            <i class="fas fa-cloud"></i>
          </span>
          <span>Log in with Salesforce</span>
        </button>
      </div>
    </div>
    <p><a  href="https://github.com/pgonzaleznetwork/sfdc-happy-soup#happysoupio" target="_blank">Documentation</a></p>
  </form>
  <Alert v-if="showError" @close="showError = false" maxWidth="600px">
   <span v-html="error"></span>
  </Alert>

  
</template>

<script>

import Alert from '@/components/ui/Alert.vue'

export default {

  components:{Alert},

  

  data() {
    return {
      privacyAccepted: false,
      isFormInvalid: true,
      loginType: "test",
      domain:'',
      error:'',
      clientId:'',
      showError:false
    };
  },

  computed: {
    showDomain() {
      return this.loginType == "domain";
    },

    isFormValid() {
      if (this.loginType == 'domain' && this.privacyAccepted && this.validDomain) {
        return true;
      }
      else if(this.loginType != 'domain' && this.privacyAccepted){
        return true;
      }
      return false;
    },

    validDomain(){
      return (this.domain.indexOf('my.salesforce.com') != -1 && this.domain.indexOf('https://') == 0);
    },

    domainColor(){
      return{
        'is-danger' : !this.validDomain,
        'is-success': this.validDomain
      }
    }
  },
  methods:{

        processUrlParams(){

            let params = new URLSearchParams(location.search);

            if(params.has('logout')){           
                this.error = 'Your Salesforce session has expired. <b>Please</b> log in again.';
                this.showError = true;
            }

            if(params.has('oauthfailed')){
                this.error = '<span>We were unable to log into your salesforce org. Try <b>clearing</b> the cache and cookies, using another browser or another org.</span>';
                this.showError = true;
            }

            /**
             * The very first time the login page is loaded, the no-session parameter
             * will not be on the URL. If the parameter is not there, we immediately
             * redirect the to dependencies page.
             * 
             * The dependencies page however, needs a server side session to be rendered,
             * if there's no session, it'll redirect back to THIS page with the attribute
             * no-session.
             * 
             * So the 2nd time the page is loaded (by the redirect) and the attribute is in the URL
             * we don't redirect the user, and allow them to log in. 
             * 
             * What this whole ping-pong does is to ensure that users cannot use the login page
             * if they are already authenticated. This prevents a single session cookie from
             * being used for 2 different logins/orgs.
             * 
             * If users want to use the login page again, they must use the logout button, which
             * will kill the server side session.
             */
            if(!params.has('no-session') && !params.has('logout') && !params.has('oauthfailed')){
                //window.location = '/dependencies?session-active=true';
            }
        },

        async getClientId(){
            let res = await fetch('/api/oauthinfo/clientid');
            this.clientId = await res.json();
        },

        login(){

          let baseURL;
          
          if(this.loginType == 'domain'){

            this.domain = this.domain.trim();
            let lastCharacter = this.domain.substr(this.domain.length-1);
            
            //remove last slash
            if(lastCharacter === '/'){
                this.domain = this.domain.substr(0,this.domain.length-1);
            }

            baseURL = this.domain;
          }
          else{
            baseURL =  `https://${this.loginType}.salesforce.com`;
          }
          
          let authEndPoint = `${baseURL}/services/oauth2/authorize`;
          let redirectURI = encodeURIComponent(`${window.location.origin}/oauth2/callback`);
  
          let state = JSON.stringify({
              'baseURL':baseURL,
              'redirectURI':redirectURI
          });
            
          let requestURL = `${authEndPoint}?client_id=${this.clientId}&response_type=code&redirect_uri=${redirectURI}&state=${state}&prompt=select_account`;
          window.location = requestURL;
        }
  },
  
  mounted(){

        this.processUrlParams();
        this.getClientId();
    }
}
</script>

<style lang="scss" scoped>

.happy-logo {
    background-color: #4d5e7b;
    padding: 30px;
}

.field:not(:last-child) {
  margin-bottom: 20px;
}

form {
  padding: 40px;
  max-width: 400px;
  border-radius: 5px;
  border:thin solid black;
}

img {
  width: 200px;
  height: 100px;
}

.line {
  height: 5px;
  margin: 0 auto;
  background: $alternative-background;
  width: 300px;
}

a{
  text-decoration: underline;
}

.button.is-link{
    background-color: $alternative-background;
  }

</style>

