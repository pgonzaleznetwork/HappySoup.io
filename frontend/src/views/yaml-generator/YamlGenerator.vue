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
      <label class="label">Job type</label>
      <div class="control has-icons-left">
        <div class="select">
          <select v-model="jobType">
            <option selected value="tests">Run all tests</option>
            <option selected value="github">Validate deployment</option>
            <option selected value="github">Deployment</option>
          </select>
        </div>
        <div class="icon is-small is-left">
          <i class="fas fa-server"></i>
        </div>
      </div>
    </div>

    <div class="field" v-if="jobType != 'tests'">
      <label class="label">Deployment type</label>
      <div class="control has-icons-left">
        <div class="select">
          <select v-model="deploymentType">
            <option selected value="github">Deploy entire sfdx project</option>
            <option selected value="github">Deploy delta (changed files)</option>
          </select>
        </div>
        <div class="icon is-small is-left">
          <i class="fas fa-server"></i>
        </div>
      </div>
    </div>

     <div class="field">
      <label class="label">Target org name</label>
      <div class="control has-icons-right">
        <input
          class="input"
          v-model="targetOrg"
          type="text"
          @keyup="showMe"
          placeholder="UAT"
        />
      </div>
    </div>

     <div class="field">
      <label class="label">Run workfow when</label>
      <div class="control has-icons-left">
        <div class="select">
          <select v-model="trigger">
            <option selected value="pr">Pull request is opened</option>
            <option selected value="push">Push is made</option>
            <option selected value="manual">Executed manually</option>
            <option selected value="release">Release is created</option>
          </select>
        </div>
        <div class="icon is-small is-left">
          <i class="fas fa-server"></i>
        </div>
      </div>
    </div>

    <div class="field" v-if="showBranchesAndPaths">
      <label class="label">Target branches</label>
      <div class="control has-icons-right">
        <input
          class="input"
          v-model="branches"
          type="text"
          @keyup="showMe"
          placeholder="Leave blank if any"
        />
      </div>
    </div>

    <div class="field" v-if="showBranchesAndPaths">
      <label class="label">Run when changes are made to these paths</label>
      <div class="control has-icons-right">
        <input
          class="input"
          v-model="paths"
          type="text"
          placeholder="force-app/** (default)"
        />
      </div>
    </div>

    <div class="field">
      <div class="control">
        <label>
          <input v-model="runPMD" type="checkbox" />
          Run static code analysis
        </label>
      </div>
    </div>

    <section v-if="runPMD == true" class="pmd">

        <p>Choose which <a href="https://pmd.github.io/latest/pmd_rules_apex.html" target="_blank">PMD Categories</a> you wish to analyse.</p>
        <br>
        <div class="field">
        <div class="control">
            <label>
            <input v-model="pdmDesign" type="checkbox" />
            Design
            </label>
        </div>
        </div>

        <div class="field">
        <div class="control">
            <label>
            <input v-model="pmdBestPractice" type="checkbox" />
            Best Practices
            </label>
        </div>
        </div>

        <div class="field">
        <div class="control">
            <label>
            <input v-model="pmdPerformance" type="checkbox" />
            Performance
            </label>
        </div>
        </div>

        <div class="field">
        <div class="control">
            <label>
            <input v-model="pmdCodeStyle" type="checkbox" />
            Code Style
            </label>
        </div>
        </div>

        <div class="field">
        <div class="control">
            <label>
            <input v-model="pmdSecurity" type="checkbox" />
            Security
            </label>
        </div>
        </div>

    </section>
    

    <div class="field">
      <div class="control">
        <button class="button is-link" :disabled="!isFormValid">
          <span class="icon">
            <i class="fas fa-cloud"></i>
          </span>
          <span>Generate CI file</span>
        </button>
      </div>
    </div>
  </form>
</template>

<script>
export default {

    data() {
        return {
            cicdProvider: "Github Actions",
            jobType:'tests',
            loginType: "test",
            trigger:'',
            runPMD:false,
            clientId:'',
            showError:false
        };
    },

    computed: {

        showBranchesAndPaths() {
            return ['pr','push'].includes(this.trigger);
        }

    }
}
</script>

<style lang="scss" scoped>

form {
  padding: 40px;
  max-width: 800px;
  border-radius: 5px;
  border:thin solid black;
  margin:auto;
  margin-top: 100px;
}

.pmd{
    margin-left: 50px;
    margin-bottom: 30px;
}

</style>>
