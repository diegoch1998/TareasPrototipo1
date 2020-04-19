// i18n dependency
const i18n = require('i18next');
const languageStrings = require('./localization');

module.exports = {
    // This request interceptor will log all incoming requests to this lambda
    LoggingRequestInterceptor: {
        process(handlerInput) {
            console.log(`Incoming request: ${JSON.stringify(handlerInput.requestEnvelope.request)}`);
        }
    },

    // This response interceptor will log all outgoing responses of this lambda
    LoggingResponseInterceptor: {
        process(handlerInput, response) {
            console.log(`Outgoing response: ${JSON.stringify(response)}`);
        }
    }
    
}