// Description
// This code simulates a long running async operation. Twilio Studio initially places
// the customer into a music on hold conference during this operation, to avoid extended silence.
// Once the random timeout value simulating the long running async operation expires, the holding
// conference will be programatically ended. The Studio Connect Call To Widget, used to place the
// the user into the conference, will then continue on to the "Connected Call Ended" path. The
// following widget, getAsyncResultAfterCompletion HTTP Request Widget, will fetch the results 
// (static JSON in our test case) from the extended async operation for incorporation into the
// Studio Flow which till be recited by the WrapItUpReciteReturnedData Say/Play widget.

const express = require('express');
const twilio = require('twilio');
const env = require('dotenv').config();

// Load configuration information from system environment variables
const TWILIO_ACCOUNT_SID = env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = env.TWILIO_AUTH_TOKEN

// Create an authenticated client to access the Twilio REST API
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const app = express();

// Allow Express to parse JSON and x-www-form-urlencoded payloads
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Get Async Result (via Studio HTTP Request Widget) controller. This will be the logic Studio
// will point to, to gather the final results of the long running aysnc operation.
app.get('/studioGetAsyncData', function(req, res, next) {

    // Return an JSON response to this request, so Studio can parse it
    // https://www.twilio.com/docs/studio/widget-library/http-request
    res.set('Content-Type','application/json');
    res.send({ name: "Winston Klein" });

});

// Initiate Async Task (via Studio HTTP Request Widget) controller.
app.post('/studioInitiateAsync', async function(req, res, next) {

    // Conference friendlyName is set to the unique CallSid
    // Studio HTTP Request Widget will POST this value to Express {{trigger.call.CallSid}}
    // as an HTTP POST Parameter 
    let conferenceName = req.body.conferenceName || "";
    let randomTimeDelayMs = getRndInteger(5, 15);

    // Use the Conference Name to derive the unique Conference SID, needed to end the conference
    // https://www.twilio.com/docs/voice/api/conference-resource#update-a-conference-resource
    function getConferenceSid (conferenceName) {
        return client.conferences.list({ friendlyName: conferenceName, status: 'in-progress' })
    }
    
    async function endConference(conferenceName) {
        let conferenceSid = await getConferenceSid(conferenceName)
        return client.conferences(conferenceSid[0].sid)
        .update({status: 'completed'})
        .then(message => {
        console.log('Simulated Async Test Completed!');
        })
        .catch(err => {
        console.log(err);
        })}
    
    function getRndInteger(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min) * 1000
    }

    setTimeout(endConference, randomTimeDelayMs, conferenceName) 

    console.group()
    console.log(`The conference friendlyName: ${conferenceName}`)
    console.log(`Random Time Delay for async operation: ${randomTimeDelayMs}ms`)
    console.groupEnd()

    // Return an JSON response to this request
    res.set('Content-Type','application/json');
    res.send({result: "success", conferenceName });
    });

app.set('port', process.env.PORT || 3000)

const server = app.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + server.address().port)
})
