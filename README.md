# Watson Conversation Service Chatbot Demo

This demo is based off of the [Watson Practitioner Assistant] (https://github.ibm.com/watson-practice/WEX-Practitioner-Assistant)

## Running locally ##


1.  Set up environment
    * Install Git Bash
    * Install Node.js
    * Navigate to the folder holding the `package.json` file
    * run `npm install`
    * run `npm install -g gulp`

2.  Create/modify the `.env.js` script under the top level directory (same level as `package.json`)

    Sample `.env.js` file
    ``` javascript
    // this is formatted to echo the structure of the Bluemix credentials
    module.exports = {
        VCAP_SERVICES: JSON.stringify({
            conversation: [{
                credentials: {
                    url: "https://gateway.watsonplatform.net/conversation/api",
                    password: "<password>",
                    username: "<username>"
                }
            }],
            discovery: [{
              credentials: {
                url: "https://gateway.watsonplatform.net/discovery/api",
                username: "<username>",
                password: "<password>"
              }
            }]
        }),
        // conversation creds
        workspace_id: "<wid>",
        conversation_version: "<yyyy-mm-dd>",
        // disco creds
        environment_id: "<eid>",
        collection_id: "<cid>",
        discovery_version: "<yyyy-mm-dd>"
    };
    ```

4.  Fill in the credentials for your Conversation Service and Discovery Service instances in `.env.js`

5.  Change the url to that of your hostname within ui/modules/dialog-constants.js

    Local:
    ``` javascript
    url: {
        getWCSResponse: 'http://localhost:3000/api/message'
    }
    ```

    Bluemix:
    ``` javascript
    url: {
        getWCSResponse: 'http://<hostname>.mybluemix.net/api/message'
    }
    ```

6.  run `gulp build && npm start`


## Deploying it on Bluemix##

1.  In the Bluemix console, create a new Node.js application

2.  Add a Conversation service instance to your new Node.js application through the Bluemix console by clicking on **ADD A SERVICE OR API**. Create and import a new workspace through the Conversation Service.

3.  If you have an already created Conversation service instance, you can bind that service through the Bluemix console by clicking on **BIND A Service OR API**

4.  Set user-defined environment variables on Bluemix console:

    ### Conversation Variables
    * WORKSPACE_ID - Your workspace id can be found by viewing the details of a workspace in your Conversation service dashboard
    * VERSION_DATE - Your version date is the last modified date in the details of your workspace
    ### Discovery Variables
    * discovery_username - Username of your Discovery Service
    * discovery_password - Password of your Discovery Service
    * discovery_version - Date your Discovery Service was created (if this is experimental, it was most likely 2016-11-07)
    * environment_id - Environment Id of your Discovery Service
    * collection_id - Collection Id of your Discovery Service
    * intent_confidence - Conversation Service Intent Confidence level between 0-1.0 to set before your input gets sent to Discovery Service


5.  On the command line, login to Bluemix

    ```
    $ bluemix api https://api.ng.bluemix.net
    $ bluemix login –u <username> -p <password>
    ```

6.  Modify the manifest.yml file. Please make sure that the app name and the host name is correct.

7.  Deploy it on the bluemix

    ```
    $ cf push <app-name>
    ```

8.  You could access your app via: `https://<app-name>.mybluemix.net`
