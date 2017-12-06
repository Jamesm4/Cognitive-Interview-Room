// this is formatted to echo the structure of the Bluemix credentials
module.exports = {
    VCAP_SERVICES: JSON.stringify({
        conversation: [{
            credentials: {
                url: "https://gateway.watsonplatform.net/conversation/api",
                password: "<from the Credentials tab of the Service on Bluemix>",
                username: "<same as above>"
            }
        }],
        discovery: [{
          credentials: {
            url: "https://gateway.watsonplatform.net/discovery/api",
            username: "<from the Credentials tab of the Discovery on Bluemix>",
            password: "<same as above>"
          }
        }]
    }),
    // conversation creds
    workspace_id: "<from the back of the Conv tile, the Details view>",
    conversation_version: "2017-04-21",
    // disco creds
    environment_id: "<upfront on the Discovery tooling page>",
    collection_id: "<same as above>",
    discovery_version: "2017-04-27"
};
