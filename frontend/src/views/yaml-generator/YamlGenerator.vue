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
          <i class="fas fa-building"></i>
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
      <p class="help is-danger">
        This field is required
      </p>
    </div>

    <div class="field">
      <label class="label">Job type</label>
      <p class="explanation">
        What do you want to automate against the target org
      </p>
      <div class="control has-icons-left">
        <div class="select">
          <select v-model="jobType">
            <option selected value="tests">Run tests only</option>
            <option selected value="validation">Validate deployment</option>
            <option selected value="deployment">Deployment</option>
          </select>
        </div>
        <div class="icon is-small is-left">
          <i class="fas fa-briefcase"></i>
        </div>
      </div>
    </div>

     <div class="field">
      <label class="label">Event</label>
      <p class="explanation">
        The event in your git repository that triggers this workflow
      </p>
      <div class="control has-icons-left">
        <div class="select">
          <select v-model="trigger">
            <option selected value="pull_request">Pull request is opened/updated</option>
            <option selected value="push">On push</option>
          </select>
        </div>
        <div class="icon is-small is-left">
          <i class="fas fa-code-branch"></i>
        </div>
      </div>
    </div>

    

    <div class="field" v-if="jobType != 'tests'">
      <label class="label">Deployment type</label>
      <p class="explanation">
        You can deploy the entire metadata in the sfdx project or only the 
        metadata that has been created/updated in the commit
      </p>
      <div class="control has-icons-left">
        <div class="select">
          <select v-model="deploymentType">
            <option selected value="all">Deploy entire sfdx project</option>
            <option selected value="delta">Deploy delta (changed files)</option>
          </select>
        </div>
        <div class="icon is-small is-left">
          <i class="fas fa-code"></i>
        </div>
      </div>
    </div>

    

    <div class="field" v-if="showBranchesAndPaths">
      <label class="label">Target branches</label>
      <p class="explanation">
        You can configure a workflow to run only for events that target specific branches. 
        You can enter multiple branches separted by a comma
      </p>
      <div class="control has-icons-right">
        <input
          class="input"
          v-model="branches"
          type="text"
          @keyup="showMe"
          placeholder="Leave blank if this applies to any branch"
        />
      </div>
    </div>

    <div class="field" v-if="showBranchesAndPaths">
      <label class="label">Run when changes are made to these paths</label>
      <p class="explanation">
        When using the push and pull request events, you can configure a workflow to run based on what file paths are changed.
        By default, we are tracking changes inside the force-app/** directory
      </p>
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
      <label class="label">Specify Tests</label>
      <p class="explanation">
        You can run all tests or tests specified by the developer in the pull request body. The latter option <span style="font-weight:bold; color:red">requires</span> you to use
        <a href="https://github.com/pgonzaleznetwork/dreamforce22-org/blob/main/pull_request_template.md" target="_blank">this pull request 
        template</a> and for <a href="https://github.com/pgonzaleznetwork/dreamforce22-org/blob/main/parsePR.js" target="_blank">this file</a> to exist 
        in the root directory of your project. 
      </p>
      <div class="control has-icons-left">
        <div class="select">
          <select v-model="testsType">
            <option selected value="all">Run all tests</option>
            <option selected value="specified">Run tests specified in pull request</option>
          </select>
        </div>
        <div class="icon is-small is-left">
          <i class="fas fa-check"></i>
        </div>
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
            <input v-model="pmdBestPractices" type="checkbox" />
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
        <button class="button is-link" :disabled="!isFormValid" @click="submit" >
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

import jobSubmission from '@/functions/jobSubmission'

export default {

    setup(){
      let {submitJob,createPostRequest} = jobSubmission();
      return {submitJob,createPostRequest};
    },

    data() {
        return {
            cicdProvider: "Github Actions",
            jobType:'tests',
            trigger:'',
            deploymentType:'',
            runPMD:false,
            paths:'force-app/**',
            targetOrg:'',
            testsType:'',
            pmdDesign:false,
            pmdBestPractices:false,
            pmdPerformance:false,
            pmdCodeStyle:false,
            pmdSecurity:false,

        };
    },

    methods:{

        async submit(){

            let job = {
                cicdProvider : this.cicdProvider,
                jobType : this.jobType,
                trigger: this.trigger,
                deploymentType: this.deploymentType,
                runPMD: this.runPMD,
                paths: this.paths,
                targetOrg: this.targetOrg,
                testsType: this.testsType,
                pmdDesign:this.pmdDesign,
                pmdBestPractices:this.pmdBestPractices,
                pmdPerformance:this.pmdPerformance,
                pmdCodeStyle:this.pmdCodeStyle,
                pmdSecurity:this.pmdSecurity,
            }

            let response = await this.submitJob('api/yaml',this.createPostRequest(job));

            console.log(JSON.stringify(response));
        }

    },

    computed: {

        showBranchesAndPaths() {
            return ['pull_request','push'].includes(this.trigger);
        },

        isFormValid(){
            return (this.cicdProvider && this.jobType
                && this.trigger && this.targetOrg)
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

.explanation {
    margin-bottom: 12px;
}

.field{
    margin-bottom: 25px;
}

</style>>
