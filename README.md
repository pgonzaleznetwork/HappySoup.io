# HappySoup.io

 <img src="./github-images/cover.jpg">

## 100% free and open-source impact and dependency analysis for Salesforce

<div style="margin-bottom:10px">
  <a href="#one-click-deployment-to-your-own-heroku-account">
    <img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy">
  </a>
</div>
<p>HappySoup.io helps you keep your salesforce org clean and healthy by helping you see metadata dependencies in ways that have never been possible before (at least not for free!).</p>
<p>If you want to support HappySoup.io by helping us cover the Heroku costs, you can make a donation using the link below</p>

<a href="https://www.paypal.com/donate?business=XEWHTYGFC5QEE&item_name=Support+HappySoup.io&currency_code=EUR">
    <img src="./github-images/btn_donate_SM.gif">
</a>

## :thumbsup: Features

* Impact Analysis (aka "Where is this used") for custom fields, email templates, apex classes, custom labels and many more.
* The first and **only** app that creates [Deployment Boundaries](https://www.salesforceben.com/introduction-to-deployment-boundaries/)
* Easily export the dependencies to Excel, CSV files or package.xml
* [Bypass all the limitations of the MetadataComponentDependency API](#how-we-enhanced-the-metadatacomponentdependency-api)
* Intuitive UI, easy-to-follow tree structure
* Log in from anywhere, no installation is required
* Available as a web app, local app or Docker app - forget about all security concerns!

[Watch full demo](https://www.youtube.com/watch?v=2asljhebqlY&t=6s)

## Contents

* [What is a Happy Soup?](#what-is-a-happy-soup)
* [Who is this for](#who-is-this-for)
* [How we enhanced the MetadataComponentDependency API](#how-we-enhanced-the-metadatacomponentdependency-api)
* [Security](#no_entry_sign-security)
* [One-click deployment to your own Heroku account](#one-click-deployment-to-your-own-heroku-account)
* [Docker deployment](#docker-deployment)
* [Build your own apps using the core npm library](#build-your-own-apps-using-the-core-npm-library)
* [Privacy Policy](#privacy-policy)

## What is a Happy Soup?

> *As a long-time customer, you’ve built apps and customizations on the platform for several releases. The more you customize and build on the platform, the more complexity you create in your org. Your single Salesforce org has become a huge container for all the metadata you’re managing and interacting with. We refer to this horn of plenty as your “happy soup.”* **[Trailhead](https://trailhead.salesforce.com/content/learn/modules/unlocked-packages-for-customers/break-up-your-metadata)**

## Who is this for

### Developers & Architects

* Discover [Deployment Boundaries](https://www.salesforceben.com/introduction-to-deployment-boundaries/) that can be the baseline for a scratch org or unlocked packages
* Quickly get a package.xml of your deployment boundary
* Get immediate insights with built-in charts
* Drill down to the last dependent metadata in an easy-to-follow tree structure

### Administrators

* Find all the metadata used in page layout (fields, buttons, inline pages, etc) and export it to excel to review opportunities for optimization
* Don't break your org! Know the impact of making changes to a field, validation rule, etc

## How we enhanced the MetadataComponentDependency API

Salesforce Happy Soup is built on top of the `MetadataComponentDependency` tooling API. While this API is great, it has huge limitations that make it hard to work with (**spoiler: we bypass all these!**)

* Custom field names are returned without the object name and the `__c` suffix. For example `Opportunity.Revenue__c` becomes `Revenue`. This makes it very hard to know which fields are being referenced. The only way around this is to manually and painfully retrieve additional information through the Tooling and Metadata API.
* Validation rules names are also returned without the object prefix, so `Account.ValidationRule` becomes `ValidationRule`. If you want to export this via package.xml, again you'd have to use other APIs to retrieve this information.
* Objects referenced via a lookup field are not returned. For example, if you have a custom field `Account.RelatedToAnotherObject__c` pointing to `RelatedToAnotherObject__c`, that object is not brought back as a dependency, which is wrong because you can't deploy that custom field to an org where that object doesn't exist.
* Global Value Sets are not returned when picklist fields depend on them.
* Lookup filters are returned with cryptic names depending on whether they belong to a custom object or a standard one.
* The app will tell you if a field is used in an apex class in either read or write mode. For example, if a field is used in an assignment expression, then you know the class is assigning values to that field. The app will show you this with a visual indicator; something that the raw API cannot do.

As said above, Salesforce Happy Soup has **fixed all** these issues so that you can focus on learning about your dependencies rather than fighting the API! :facepunch:

[Back to top](#happysoupio)

## :no_entry_sign: Security

We understand security is very important in the Salesforce ecosystem. Read our [Privacy Policy](#privacy-policy) to understand what data is collected and how it is used. This section only addresses technical security

### How is your token stored

Your access token will be temporarily stored in a Redis database which is provisioned by Heroku. The token is then retrieved by the server every time you use the app, as long as you have a valid server-side session with the app and the required cookies.

Access to the database is restricted and the credentials are not stored anywhere in the source code; it is managed via environment variables.

This mechanism is the same way Workbench, OrgDoctor, MavensMate and other open source projects work.

### Server-side security

Every time a request is made to the app, the request goes through the following layers of security:

* Every HTTP request is encrypted with SSL certificates managed by Heroku.
* We use CORS to validate HTTP requests made from a web browser.
* Once CORS is validated, we check that the request contains a cookie, which is encrypted. The cookie is then used to retrieve a server-side session. If the session does not exist or has expired, the user is sent back to the login page.
* Once the server-side session is verified, we check that the user has a valid session with their Salesforce org. If the user doesn't have a valid session with Salesforce, we send the user back to the login page.

[Back to top](#happysoupio)

## One-click Deployment to your own Heroku Account

You can use the following button to quickly install/deploy the application to your own Heroku Account

<a href="https://heroku.com/deploy?template=https://github.com/pgonzaleznetwork/sfdc-happy-soup/tree/master">
  <img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy">
</a>

This is by far the easiest way to use the app on your servers so that you don't have to worry about security.

When you click the button and log in to your Heroku account, you'll see a page similar to the following:

**NOTE** When you see this page, you can add **dummy** values on the empty Config Vars. We'll come back and edit them with the real values at a later step.

<p align="center">
  <img src="./github-images/herokudeployment.png">
</p>

Once you've added dummy values, just click the **Deploy App** button. Once the app is deployed, you'll be able to launch it and at a minimum, see the login page. Congratulations!!

Now, the steps to get the app fully working are as follows:

### 1. Create a Connected App in any org

For the app to be able to use OAuth tokens, it needs to be connected to a Connected App. The original app uses a Connected App that lives in one of our organizations; for your app, you can then use a Connected App in **any org** as well - it doesn't matter what org it is, but we recommend using a dev or production org because sandboxes are eventually refreshed.

The OAuth configuration for the Connected App needs to look like this:

<p align="center">
  <img src="./github-images/oauthconfig.png">
</p>

**It is very important that you change the Callback URL to point to your Heroku app domain name, which is the name that you chose when deploying the app**

For example, if your app name is `mycompany-happysoup.herokuapp.com` then the Callback URL must be `mycompany-happysoup.herokuapp.com/oauth2/callback`. You must also add the following URL so that you can run the app locally using the `heroku local` command

`http://localhost:3000/oauth2/callback`

Note that if you changed the default `PORT` environment variable in the deployment page, you need to update the localhost port in the callback URL as well.

Once you have created the Connected App, get the Client Secret and Client Id; we'll need them in the next step.

**Important**: Make sure you uncheck "Require Proof Key for Code Exchange (PKCE) Extension for Supported Authorization Flows" setting on the Connected App. 

### 2. Editing the Config Vars

Finally, we come back to the Config Vars.

You can edit the Config Vars at at `https://dashboard.heroku.com/apps/YOUR-APP-NAME > Settings > Reveal Config Vars`

<p align="center">
  <img src="./github-images/configvars.png">
</p>

All the other variables should be configured already, including `REDIS_URL` which is automatically added by Heroku since Redis is required to deploy the app.

These are the Config Vars that you **MUST** add for the app to work:

**OAUTH_CLIENT_ID**: This is the Client Id that you just got from your connected app.

**OAUTH_CLIENT_SECRET**: This is the Client Secret that you just got from your connected app.

**SESSION_SECRET**: Just put any random string, like `349605ygtdhht%&^&^` (NOT this one though!)

**CORS_DOMAINS**: This must be the full URL of your Heroku app. For example, my version of the app lives at `https://sfdc-happy-soup.herokuapp.com`

You **must** specify the full URL of your Heroku app, which is the `App Name` that you provided at the very beginning. So your full URL will be `https://THE-NAME-YOU-CHOSE.herokuapp.com`

That's it! Now you can use the app on your servers.

## Docker Deployment

If you want to use the app locally on your computer, you can easily create the app using Docker. Just follow the tutorial and you'll be up and running in minutes!

[Tutorial: Installing HappySoup.io with Docker](https://www.youtube.com/watch?v=WQhz91JSl3o)

These steps describe the process in the video above, using example text (**in bold**) which should be updated to match your environment:

### Prerequisites Not Covered here

1. Install Docker and docker-compose
1. Clone the git repository
1. Admin access granted to a Salesforce organization

### Create a Salesforce Connected App

1. Setup > Apps > Connected Apps > New (alternate path: Setup > Apps > App Manager > New Connected App)
1. Connected App Name: **Salesforce Happy Soup**
1. API Name: **Salesforce_Happy_Soup**
1. Contact Email: **first.last@example.com**
1. Enable Oath Settings: (checked)
1. Callback URL: `http://localhost:3000/oauth2/callback`
1. Selected OAuth Scopes: `Access the identity URL service (id, profile, email, address, phone); Manage user data via APIs (api); Full access (full); Perform requests at any time (refresh_token, offline_access)`
1. Save

### Connect Happy Soup to Salesforce

1. Open the `docker-compose.yml` file in the git repository.
1. Update `OAUTH_CLIENT_ID` & `OAUTH_CLIENT_SECRET` with the values from the new Connected App.  Note that each is defined twice and both should be updated.
1. Start the Docker containers: `docker-compose up`
1. In a web browser, open `http://localhost:3000`
1. Login Type: `My Domain` or `Production`
1. If using `My Domain` enter in your Salesforce organization URL.
1. I agree to the Happy Soup Privacy Policy: (checked)
1. `Log in with Salesforce`
1. Allow Access?  `Allow`

[Back to top](#happysoupio)

## Build your own apps using the core npm library

Salesforce Happy Soup is built on top of the [sfdc-soup](https://github.com/pgonzaleznetwork/sfdc-soup/tree/master) NodeJs library, which is an API that returns an entire salesforce dependency tree in different formats, including JSON, excel and others.

Head over that its repository to learn how you can create your apps.

[Back to top](#happysoupio)

## Privacy Policy


It's important that you understand what information Happy Soup collects, uses and how you can control it.

Remember that you can always [deploy the app to your own Heroku account](#one-click-deployment-to-your-own-heroku-account) or use it [locally](#docker-deployment), in which case you don't need to worry about security.


Our full Privacy Policy can be found [here](https://pgonzaleznetwork.github.io/privacy.html). The sections below contain the specifics about how your Salesforce data is used and what your options are to stop access to your data.

## Information Collected

### Your Personal Information

Your Salesforce `username`, `email` and `display name` will be captured when you log in to Happy Soup.

This information is used to display your username details on the header of the Happy Soup app so that you can easily know which org you are logged into.

Your Salesforce Org Id and User Id (not the username/email) are also used as a key to submit asynchronous jobs to Happy Soup's app server. This allows us to group all your requests in a single area of the database.

### Your Salesforce Org's Metadata

To be able to analyze your dependencies, we need to query your org's metadata. Some metadata is queried only to get its name, while other metadata is queried to inspect its contents and find dependencies (i.e apex classes)

The specific objects that are queried are as follows

* `MetadataComponentDependency`
* `CustomField`
* `CustomObject`
* `ApexClass`
* `EmailTemplate`
* `Layout`
* `ValidationRule`
* `CustomLabel`
* `WebLink`
* `LightningComponentBundle`
* `AuraComponentBundle`

Other objects may be added as we further enhance our dependency analysis capabilities.

All this metadata, along with the results of a dependency query that you execute via the UI, will be cached in a secure server-side session that is isolated to your session with Happy Soup.

This metadata is cached to enable subsequent requests to be performed faster.

The session data and its cache is deleted when any of the below options occurs first:

* 8 hours have passed since you logged into Happy Soup. This is because the access token provided by Salesforce will also live for 8 hours. This means that you can use Happy Soup for a maximum of 8 hours using the same org, without having to log in again. After 8 hours, the session is completely deleted.
* When you log out manually. When a logout action is performed, the session is completely deleted.
* The app tries to issue a request to Salesforce but the access token has been revoked. When this occurs, the session is completely deleted.

### Cookies

We use cookies and local storage for the following information:

* Your session id cookie
* The Salesforce domain you used. This will help you quickly log in the next time you use the app.

### Third-Party Apps/Providers

Happy Soup uses the following software:

* Heroku Redis: Used to store your session and to process all the jobs that are submitted to the app.
* Logentries: Logging and monitoring software. Logs are stored for 7 days and some logs may include the names of your metadata. For example, when submitting a job to see the usage of a custom field, the custom field name is appended to the URL. This URL will be in the logs for a maximum of 7 days.

## Your Rights

### Right to be forgotten

If you want Happy Soup to immediately delete all the data we have collected from your org, you can use the Logout button on the main page.

When this button is clicked, the server session is completely deleted and cannot be recovered.

If you no longer have access to the browser or device from which you initiated a session with Happy Soup but still want to prevent Happy Soup from accessing your org's metadata, you can go to your `Salesforce org > Setup > Connected Apps Oauth Usage > `Find the token for Salesforce Happy Soup and revoke it.

Happy Soup will no longer be able to use the access token and you'll be logged out the moment you try to use the app again.

### Right to Access Data

If at any time you want to get the data that we have from your org, you can contact us at pgonzaleznetwork@gmail.com. Note that because all the data we collect from you is deleted in 8 hours, we can only provide you with your data if it's still in our database.

### Right of Restriction of Processing

If at any time you want Happy Soup to stop processing your data and you are unable to log out (because you no longer have access to the original device you logged in with), you can email us at pgonzaleznetwork@gmail.com and we will delete all your information.

[Back to top](#happysoupio)
