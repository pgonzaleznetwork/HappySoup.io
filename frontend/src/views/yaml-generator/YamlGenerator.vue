<template>
  <form @submit.prevent="login" >
   
    <div class="field">
      <label class="label">CI/CD Provider</label>
      <div class="control has-icons-left">
        <div class="select">
          <select v-model="cicdProvider">
            <option selected value="github">GitHub Actions</option>
          </select>
        </div>
        <div class="icon is-small is-left">
          <i class="fas fa-server"></i>
        </div>
      </div>
    </div>

     <div class="field">
      <label class="label">Run workfow when</label>
      <div class="control has-icons-left">
        <div class="select">
          <select v-model="trigger">
            <option selected value="github">Pull request is opened</option>
            <option selected value="github">Pull request is merged</option>
          </select>
        </div>
        <div class="icon is-small is-left">
          <i class="fas fa-server"></i>
        </div>
      </div>
    </div>

    <div class="field">
      <label class="label">x</label>
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
</template>

<script>
export default {

}
</script>

<style lang="scss" scoped>

</style>>
