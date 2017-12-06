// this is formatted to echo the structure of the Bluemix credentials
module.exports = {
    VCAP_SERVICES: JSON.stringify({
        conversation: [{
            credentials: {
                url: "https://gateway.watsonplatform.net/conversation/api",
                username: "c105ac99-af5d-494a-b4bf-97e5c53aa1fa",
                password: "lvnwj51dqqjx"
            }
        }],
        tone_analyzer: [{
            credentials: {
                url: "https://gateway.watsonplatform.net/tone-analyzer/api",
                username: "3f147bcc-4713-4f89-be4f-f9a0e0ebf888",
                password: "zNjlU3tQXYkc"
            }
        }]
        /*
        discovery: [{
          credentials: {
            url: "https://gateway.watsonplatform.net/discovery/api",
            username: "<username>",
            password: "<password>"
          }
        }]
        */
    }),
    // conversation creds
    workspace_id: "ab974e7f-5604-4a69-8640-93112a95bb82",
    conversation_version: "2017-05-26",

    // tone_analyzer creds
    tone_analyzer_version: "2017-09-21"

    // disco creds
    // environment_id: "<eid>",
    // collection_id: "<cid>",
    // discovery_version: "<yyyy-mm-dd>"
};
