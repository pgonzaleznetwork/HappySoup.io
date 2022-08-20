

function event(eventName,branches,paths){
    return {
        eventName: {
          "types": [
            "opened",
            "synchronize"
          ],
          branches,
          paths,
        }
    }
}

function installSalesforceCLI(){
    return {
        "name": "Install Salesforce CLI",
        "run": "wget https://developer.salesforce.com/media/salesforce-cli/sfdx/channels/stable/sfdx-linux-x64.tar.xz\nmkdir ~/sfdx\ntar xJf sfdx-linux-x64.tar.xz -C ~/sfdx --strip-components 1\necho \"$HOME/sfdx/bin\" >> $GITHUB_PATH\n~/sfdx/bin/sfdx version\n"
    }
}

function installSfdxGitDelta(){
    return {
        "name": "Installing sfdx git delta",
        "run": "echo y | sfdx plugins:install sfdx-git-delta\nsfdx plugins \n"
      }
}

function installJava(){
    return {
        "name": "Installing java",
        "run": "sudo apt-get install openjdk-8-jdk"
      }
}

function installSfdxScanner(){
    return {
        "name": "Installing SFDX scanner",
        "run": "sfdx plugins:install @salesforce/sfdx-scanner"
      }
}

function populateSFDXSecretURL(secret){
    return {
        "name": "Populate auth file with SFDX_URL secret of target org",
        "shell": "bash",
        "run": "echo ${{ secrets."+secret+"}} > ./"+secret+".txt\n"
      }
}

function readTestsFromPR(){
    return {
        "name": "Read PR Body",
        "env": {
          "PR_BODY": "${{github.event.pull_request.body}}"
        },
        "run": `echo $PR_BODY > ./pr_body.txt\nnode ./parsePR.js   \nTESTS=$(cat testsToRun.txt)   \necho \"APEX_TESTS=$TESTS\" >> $GITHUB_ENV\n`
      }
}

function authenticateToOrg(secret){
    return {
        "name": `Authenticate to ${secret} Org`,
        "run": `sfdx auth:sfdxurl:store -f ./${secret}.txt -s -a secret`
      }
}

function deployRunAllTests(){
    return {
        "name": "Check-only deploy delta changes - run all tests",
        "if": "${{ env.APEX_TESTS == 'all' }}",
        "run": `sfdx force:source:deploy -p \"changed-sources/force-app\" --checkonly --testlevel RunLocalTests  --json\n`
      }
}

module.exports = {

    installJava,
    installSalesforceCLI,
    installSfdxGitDelta,
    installSfdxScanner,
    authenticateToOrg,
    deployRunAllTests,
    populateSFDXSecretURL,
    event,
    readTestsFromPR
}