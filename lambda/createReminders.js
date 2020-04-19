const moment = require('moment-timezone');

module.exports = {
    createReminderData(timezone,actividad,locale) {
       // const timezone ='Europe/Madrid'; // so it works on the simulator, replace with your timezone and remove if testing on a real device
        moment.locale(locale);
        var fechaString = actividad["dia"] + "T" + actividad["hora"];
        const now = moment().tz(timezone);
        const fecha = moment(fechaString).tz('YYYY-MM-DDTHH:mm:00.000',timezone);
        //const fecha = now.add(1,"minutes");
        const scheduled = fecha;
        console.log('Reminder schedule: ' + scheduled.format('YYYY-MM-DDTHH:mm:00.000'));

        return {
            requestTime: now.format('YYYY-MM-DDTHH:mm:00.000'),
            trigger: {
                type: 'SCHEDULED_ABSOLUTE',
                scheduledTime: scheduled.format('YYYY-MM-DDTHH:mm:00.000'),
                timeZoneId: timezone,
            },
            alertInfo: {
              spokenInfo: {
                content: [{
                  locale: locale,
                  text: actividad["titulo"]//,
                //  idactividad: actividad["id"],
                //  completada: actividad["completada"],
                //  tiempoCompletar: actividad["tiempoCompletar"]
                }],
              },
            },
            pushNotification: {
              status: 'ENABLED',
            }
        }
    }
}
