module.exports = yamlFile = {
    
    "name": "Validate PR on development branch",
    "on": null,
    "jobs": {
      "jobName": {
        "runs-on": "ubuntu-latest",
        "if": "${{ github.actor != 'dependabot[bot]' }}",
        "steps": [
          {
            "uses": "actions/setup-node@v2",
            "with": {
              "node-version": "14"
            }
          },
          {
            "name": "Checkout source code",
            "uses": "actions/checkout@v2",
            "with": {
              "fetch-depth": 0
            }
          }
        ]
      }
    }
  }