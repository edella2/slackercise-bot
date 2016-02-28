/**
 * A Bot for Slack!
 */


/**
 * Define a function for initiating a conversation on installation
 * With custom integrations, we don't have a way to find out who installed us, so we can't message them :(
 */

function onInstallation(bot, installer) {
    if (installer) {
        bot.startPrivateConversation({user: installer}, function (err, convo) {
            if (err) {
                console.log(err);
            } else {
                convo.say('I am a bot that has just joined your team');
                convo.say('You must now /invite me to a channel so that I can be of use!');
            }
        });
    }
}


/**
 * Configure the persistence options
 */

var config = {};
if (process.env.MONGOLAB_URI) {
    var BotkitStorage = require('botkit-storage-mongo');
    config = {
        storage: BotkitStorage({mongoUri: process.env.MONGOLAB_URI}),
    };
} else {
    config = {
        json_file_store: ((process.env.TOKEN)?'./db_slack_bot_ci/':'./db_slack_bot_a/'), //use a different name if an app or CI
    };
}

/**
 * Are being run as an app or a custom integration? The initialization will differ, depending
 */

if (process.env.TOKEN || process.env.SLACK_TOKEN) {
    //Treat this as a custom integration
    var customIntegration = require('./lib/custom_integrations');
    var token = (process.env.TOKEN) ? process.env.TOKEN : process.env.SLACK_TOKEN;
    var controller = customIntegration.configure(token, config, onInstallation);
} else if (process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.PORT) {
    //Treat this as an app
    var app = require('./lib/apps');
    var controller = app.configure(process.env.PORT, process.env.CLIENT_ID, process.env.CLIENT_SECRET, config, onInstallation);
} else {
    console.log('Error: If this is a custom integration, please specify TOKEN in the environment. If this is an app, please specify CLIENTID, CLIENTSECRET, and PORT in the environment');
    process.exit(1);
}


/**
 * A demonstration for how to handle websocket events. In this case, just log when we have and have not
 * been disconnected from the websocket. In the future, it would be super awesome to be able to specify
 * a reconnect policy, and do reconnections automatically. In the meantime, we aren't going to attempt reconnects,
 * WHICH IS A B0RKED WAY TO HANDLE BEING DISCONNECTED. So we need to fix this.
 *
 * TODO: fixed b0rked reconnect behavior
 */
// Handle events related to the websocket connection to Slack
controller.on('rtm_open', function (bot) {
    console.log('** The RTM api just connected!');
});

controller.on('rtm_close', function (bot) {
    console.log('** The RTM api just closed');
    // you may want to attempt to re-open
});


/**
 * Core bot logic goes here!
 */
// BEGIN EDITING HERE!

// setInterval(function(){ bot.say(
//       {
//         text: 'checkout http://slackercise.herokuapp.com',
//         channel: '#slacker-cise'
//       }
//     ); }, 3000);

var WORK_OUTS = [
    {text: "Get on the floor and do 20 crunches!\n http://giphy.com/gifs/parks-and-recreation-andy-dwyer-tom-haverford-cCCFzyobPIklG", gif: "http://giphy.com/gifs/parks-and-recreation-andy-dwyer-tom-haverford-cCCFzyobPIklG"},
    {text: "What time is it? Time to do 20 push-ups!\n http://giphy.com/gifs/transparent-gif-QcaWr0rSFenLy", gif: "http://giphy.com/gifs/transparent-gif-QcaWr0rSFenLy"},
    {text: "You've earned some time away from your desk. Go for a 5-10 minute walk.\n http://giphy.com/gifs/cat-funny-WqmYGa2LjQlTG", gif: "http://giphy.com/gifs/cat-funny-WqmYGa2LjQlTG"},
    {text: "Feeling crazy? How about doing 20 jumping jacks? \n http://giphy.com/gifs/transparent-gif-QcaWr0rSFenLy", gif: "http://giphy.com/gifs/transparent-gif-QcaWr0rSFenLy"},
    {text: "You'redoing Great! Now, let's do 20 chair dips \n http://cdn.makeagif.com/media/8-04-2015/hLCIsW.gif", gif: "http://giphy.com/gifs/transparent-gif-QcaWr0rSFenLy"}
]

controller.on('channel_joined', function (bot, message) {
    bot.reply(message, "I'm here!")

    bot.say({text: "What upppp", channel: "C0NNW7KLL"})
});


controller.hears(
    ['hello', 'hi', 'greetings'],
    ['direct_message','mention', 'direct_mention'],
    function (bot, message) {
    bot.reply(message, 'Hello!');
    bot.say(
    {
        text: "Hello humans! I am your friendly neighborhood Slackercise, here to help you get fit in the comfort of your own office.",
        channel: message.channel
    })
    bot.say(
    {
        text: "Each day, I will post 5 exercises to this channel. When you see an exercise, do it and then throw a :+1: my way.",
        channel: message.channel
    })

});



controller.hears(
    ["addme", ":thumbsup"],
    ["direct_message", 'mention', "direct_mention"],
    function(bot, message) {
        bot.say({text: "What upppp", channel: message.channel})
        var request = require('request');
        request("https://slack.com/api/users.info?token=" + bot.config.token + "&user=" + message.user, function(error, response, body) {
            var data = JSON.parse(body).user
            // console.log(data)
            var user_data =
            { user: {
              team_id: data["team_id"],
              name: data["name"],
              real_name: data["real_name"],
              first_name: data["profile"]["first_name"],
              last_name: data["profile"]["last_name"],
              image: data["profile"]["image_192"],
              email: data["profile"]["email"]
            } };
            request.post("http://localhost:3000/users").form(user_data)
        });
    });

controller.hears(
    ["start"],
    ["direct_message", 'mention', "direct_mention"],
    function(bot, message) {
        bot.say({text: "What upppp", channel: message.channel})
        setInterval(function(){ bot.say(
              {
                text: WORK_OUTS[Math.floor(Math.random()*WORK_OUTS.length)].text,
                channel: message.channel,
              }
            ); }, 15000);
        });






/**
 * AN example of what could be:
 * Any un-handled direct mention gets a reaction and a pat response!
 */
//controller.on('direct_message,mention,direct_mention', function (bot, message) {
//    bot.api.reactions.add({
//        timestamp: message.ts,
//        channel: message.channel,
//        name: 'robot_face',
//    }, function (err) {
//        if (err) {
//            console.log(err)
//        }
//        bot.reply(message, 'I heard you loud and clear boss.');
//    });
//});
