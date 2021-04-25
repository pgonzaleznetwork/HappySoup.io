<template>
  <form class="has-text-light pure-center">
    <div class="is-flex is-flex-direction-row is-justify-content-center field">
      <div>
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
            <option selected value="sandbox">Sandbox</option>
            <option value="production">Production</option>
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
          I agree to the HappySoup.io <a class="has-text-light" href="https://github.com/pgonzaleznetwork/sfdc-happy-soup#privacy-policy" target="_blank">Privacy Policy</a>
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
    <p><a class="has-text-light" href="http://" target="_blank">Documentation</a></p>
  </form>
</template>

<script>

export default {

  data() {
    return {
      privacyAccepted: false,
      isFormInvalid: true,
      loginType: "sandbox",
      domain:''
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
    },

    domainIcon(){
      return{
        'fa-exclamation-triangle' : !this.validDomain,
        'fa-check': this.validDomain
      }
    }

  }
}
</script>

<style lang="scss">

.label {
  color: $text-color;
}

.field:not(:last-child) {
  margin-bottom: 20px;
}

form {
  padding: 40px;
  background-color: black;
  max-width: 400px;
  background-color:#2e3243;
  border-radius: 5px;
}

img {
  width: 200px;
  height: 100px;
}

.line {
  height: 5px;
  margin: 0 auto;
  background: #3498db;
  width: 300px;
}

a{
  text-decoration: underline;
}
</style>

