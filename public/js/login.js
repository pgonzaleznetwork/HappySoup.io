
const Form = {

    data() {

      return {
        error:'',
        clientId:'',
        domain:'',
        envSelected:'test',
        privacyAccepted:false
      }
    },

    computed: {
        showDomain() {
           return this.envSelected == 'domain';
        },

        showError(){
            return !!this.error;
        }  
    },

    methods:{

        processUrlParams(){

            let params = new URLSearchParams(location.search);

            if(params.has('logout')){           
                this.error = 'Your Salesforce session has expired. Please log in again.';
            }

            if(params.has('oauthfailed')){
                this.error = 'We were unable to log into your salesforce org. Try clearing the cache and cookies, using another browser or another org.';
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
                window.location = '/dependencies?session-active=true';
            }
        },

        async getClientId(){
            let res = await fetch('/api/oauthinfo/clientid');
            this.clientId = await res.json();
        },

        getLastDomain(){

            let lastDomain = localStorage.getItem('lastDomain');

            if(lastDomain){
                this.domain = lastDomain;
                this.envSelected = 'domain';
            }
        },

        validateDomain(){

            if(!this.domain){
                alert('Please enter your domain URL');
                return;
            }
            if(this.domain.indexOf('my.salesforce.com') === -1){
                alert(`${this.domain} is not a valid salesforce domain`);
                return;
            }
            if(this.domain.indexOf('https://') != 0){
                alert(`Please use https://`);
                return;
            }
            
            this.domain = this.domain.trim();
            let lastCharacter = this.domain.substr(this.domain.length-1);
            
            //remove last slash
            if(lastCharacter === '/'){
                this.domain = this.domain.substr(0,this.domain.length-1);
            }

            return this.domain;
        },

        handleLogin(){

            if(!this.privacyAccepted){
                window.alert('You must agree to our Privacy Policy before using Happy Soup. Remember you can always deploy it to your own FREE Heroku account!');
                return;
            }

            let baseURL;

            if(this.envSelected == 'domain'){
                let validDomain = this.validateDomain();
                if(!validDomain) return;
                baseURL = validDomain;
                localStorage.setItem('lastDomain',baseURL);
            }

            else{
                baseURL = `https://${this.envSelected}.salesforce.com`;
            }
        
            let authEndPoint = `${baseURL}/services/oauth2/authorize`;
    
            let redirectURI = encodeURIComponent(`${window.location.origin}/oauth2/callback`);
    
            let state = JSON.stringify({
                'baseURL':baseURL,
                'redirectURI':redirectURI
            });
            
            let responseType = "code";
            
            let requestURL = `${authEndPoint}?client_id=${this.clientId}&response_type=${responseType}&redirect_uri=${redirectURI}&state=${state}`;
            window.location = requestURL;
            
        }
    },

    mounted(){
        this.processUrlParams();
        this.getClientId();
        this.getLastDomain();
    }
  }
  
Vue.createApp(Form).mount('#vue-form')

