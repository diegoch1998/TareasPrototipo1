// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');
const interceptors = require('./interceptors');
const fs = require('fs');
const jsonactividades = require('./actividades.json');
const funciones = require('./createReminders');
const REMINDERS_PERMISSION = ['alexa::alerts:reminders:skill:readwrite'];

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        
        console.log('Launch request');
        const speakOutput = 'Bienvenido a tus actividades diarias';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CreateStaticRemindersIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CreateStaticRemindersIntent';
    },
    async handle(handlerInput){
        const {attributesManager, serviceClientFactory, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const {intent} = handlerInput.requestEnvelope.request;
        var speakOutput = 'Voy a crear los recordatorios para las siguientes actividades: ';
        console.log('Create reminders request');
      /*  let actividad1;
        fs.readFile('./actividades.json', (err, data) => {
            if (err) throw err;
            let actividades = JSON.parse(data);
            actividad1 = actividades[0];
        });
        */
        
        const deviceId = handlerInput.requestEnvelope.context.System.device.deviceId;
        let timezone;
        try {
            const upsServiceClient = serviceClientFactory.getUpsServiceClient();
            timezone = await upsServiceClient.getSystemTimeZone(deviceId);
        } catch (error) {
            return handlerInput.responseBuilder
                .speak("No hay timezone")
                .getResponse();
        }
        console.log('Got timezone: ' + timezone);
        
        console.log(JSON.stringify(jsonactividades));
        var actividades = jsonactividades["actividades"];
        var reminder;
        
        
        
        console.log(JSON.stringify(reminder));
        try {
                const {permissions} = requestEnvelope.context.System.user;
                if(!permissions)
                    throw { statusCode: 401, message: 'No permissions available' }; // there are zero permissions, no point in intializing the API
                console.log("ENTRA EN TRY CATCH");
                const reminderServiceClient = serviceClientFactory.getReminderManagementServiceClient();
                // reminders are retained for 3 days after they 'remind' the customer before being deleted
                const remindersList = await reminderServiceClient.getReminders();
                console.log('Current reminders: ');
                console.log(JSON.stringify(remindersList));
                // delete previous reminder if present
                const previousReminder = sessionAttributes['reminderId'];
                if(previousReminder){
                    await reminderServiceClient.deleteReminder(previousReminder);
                    delete sessionAttributes['reminderId'];
                    console.log('Deleted previous reminder with token: ' + previousReminder);
                }
                // create reminder structure
            
                for(var i=0; i < actividades.length; i++){
                    var act = actividades[i];
                    speakOutput += act['titulo'] + ", ";
                    reminder = funciones.createReminderData(timezone,act,requestEnvelope.request.locale); 
                    var reminderResponse = await reminderServiceClient.createReminder(reminder);
                    console.log("REMINDER RESPONSE HECHA");
                    // save reminder id in session attributes
                    sessionAttributes['reminderId'] = reminderResponse.alertToken;
                    act["idReminder"] = reminderResponse.alertToken;
                    console.log('Reminder created with token: ' + reminderResponse.alertToken);
                    
                    jsonactividades["actividades"][act["id"]]["idReminder"] = reminderResponse.alertToken;
                    jsonactividades["actividades"][act["id"]]["scheduled"] = "true";
                }
               // const  // the response will include an "alertToken" which you can use to refer to this reminder
                
         //       speechText = handlerInput.t('REMINDER_CREATED_MSG') + handlerInput.t('HELP_MSG');
                console.log("JSON DE ACTIVIDADES: " + JSON.stringify(jsonactividades));
            } catch (error) {
                console.log(JSON.stringify(error));
                switch (error.statusCode) {
                    case 401: // the user has to enable the permissions for reminders, let's attach a permissions card to the response
                        handlerInput.responseBuilder.withAskForPermissionsConsentCard(REMINDERS_PERMISSION);
                        speakOutput = "faltan permisos";
                        break;
                    case 403: // devices such as the simulator do not support reminder management
                        speakOutput = "dispositivo no soportado";
                        break;
                    default:
                        speakOutput = "Error al crear recordatorio";
                }
            }
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
          //  .reprompt(speakOutput)
            .getResponse();
        
    }
}

const DeleteAllRemindersIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DeleteAllRemindersIntent';
    },
    async handle(handlerInput) {
        const {attributesManager, serviceClientFactory, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const {intent} = handlerInput.requestEnvelope.request;
        
      
        var speakOutput = "Recordatorios borrados";
        // let's try to create a reminder via the Reminders API
        // don't forget to enable this permission in your skill configuratiuon (Build tab -> Permissions)
        // or you'll get a SessionEnndedRequest with an ERROR of type INVALID_RESPONSE
        try {
            const {permissions} = requestEnvelope.context.System.user;
            if(!permissions)
                throw { statusCode: 401, message: 'No permissions available' }; // there are zero permissions, no point in intializing the API
            const reminderServiceClient = serviceClientFactory.getReminderManagementServiceClient();
            // reminders are retained for 3 days after they 'remind' the customer before being deleted
            const remindersList = await reminderServiceClient.getReminders();
            console.log('Current reminders: ' + JSON.stringify(remindersList));
            console.log(JSON.stringify(remindersList));
            
            for (var i = 0; i < parseInt(remindersList["totalCount"]); i++){
                var reminderId = remindersList["alerts"][i]["alertToken"];
                console.log("Reminder a borrar: " + reminderId);
                if(remindersList["alerts"][i]["status"] !== 'COMPLETED')
                    await reminderServiceClient.deleteReminder(reminderId);
            }
        } catch (error) {
            console.log(JSON.stringify(error));
            switch (error.statusCode) {
                case 401: // the user has to enable the permissions for reminders, let's attach a permissions card to the response
                    handlerInput.responseBuilder.withAskForPermissionsConsentCard(REMINDERS_PERMISSION);
                    speakOutput = "faltan permisos";
                    break;
                case 403: // devices such as the simulator do not support reminder management
                    speakOutput = "dispositivo no soportado";
                    break;
                default:
                    speakOutput = "Error al borrar recordatorios";
            }
        }
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
          //  .reprompt(speakOutput)
            .getResponse();
    
    }
}

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};


const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelpIntentHandler,
        CreateStaticRemindersIntentHandler,
        DeleteAllRemindersIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addRequestInterceptors(
    //    interceptors.LocalisationRequestInterceptor,
        interceptors.LoggingRequestInterceptor)
    .addResponseInterceptors(
        interceptors.LoggingResponseInterceptor)
    .addErrorHandlers(
        ErrorHandler,
    )
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();
