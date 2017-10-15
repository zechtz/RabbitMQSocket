var express    =  require('express');
var amqp       =  require('amqp');
var io         =  require('socket.io');
var app        =  express();
var path       =  require('path');
var bodyParser =  require('body-parser');
var port       =  3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(__dirname));

/**
 * create connection with RabbitMQ using the
 * amqp library
 *
 */
var connection = amqp.createConnection();
connection.on('ready', setup);


/**
 * define an exchange
 */

var bindingOptions =  { 'x-match' : 'all', 'Type'    : 'Feedback', 'Company' : '000' };
var exchange;
var queue;
function setup() {
  exchange = connection.exchange('GLActualFeedbackExchange', {autoDelete: false, type: 'headers', passive: false, durable: true, arguments: bindingOptions}, function(exchange) {
    console.log('creating/opening queue');
    queue = connection.queue('GLActualFeedbackQueue', {autoDelete: false, durable: true, exclusive: false, arguments: bindingOptions}, function(queue) {
      queue.bind_headers(exchange, bindingOptions);
    });
  });
}

/**
 *
 * define the queue
 *
 */

var queue;
var deadQueue;

function exchangeSetup() {
  queue =  connection.queue('GLActualFeedbackQueue', {autoDelete: false, durable: true, exclusive: false, options: bindingOptions}, queueSetup);
  queue.on('queueBindOk', function() {
    onQueueReady(exchange);
  });
  console.log('Exchange ' + exchange.name + ' is open');
}

/**
 * bind que to exchange and subscribe
 */
function queueSetup() {
  queue.subscribe(function(message) {
    console.log("message from queue is", message);
    emitEvent(message.data);
  });
  queue.bind(exchange.name, '', {arguments: bindingOptions});
}

function onQueueReady(exchange) {
  console.log('queue binding done...');
}

var data = [
  {
    "id": 1138,
    "Company": "2005",
    "BookID": "MAINP",
    "JournalCode": "DJ",
    "CurrencyCode": "TZS",
    "TrxCtrlNum": "Actualctr1138",
    "ApplyDate": "2017-06-30T00:00:00",
    "Description": "Description1138",
    "DebitAcc": null,
    "PositiveAmount": null,
    "DrUID": null,
    "CreditAcc": null,
    "CrUID": null,
    "NegativeAmount": null,
    "LogMessage": "{\"message\": \"Journal line transaction successfully generated in Epicor\",\"LineUID\": \"1138\",\"GLAccount\": \"074-2005-0000-000-00000000-0000-00000000-0-000-99999995\",\"Amount\": \"6000000\"}",
    "StatusCode": 1
  },
  {
    "id": 1138,
    "Company": "2005",
    "BookID": "MAINP",
    "JournalCode": "DJ",
    "CurrencyCode": "TZS",
    "TrxCtrlNum": "Actualctr1138",
    "ApplyDate": "2017-06-30T00:00:00",
    "Description": "Description1138",
    "DebitAcc": null,
    "PositiveAmount": null,
    "DrUID": null,
    "CreditAcc": null,
    "CrUID": null,
    "NegativeAmount": null,
    "LogMessage": "{\"message\": \"Journal line transaction successfully generated in Epicor\",\"LineUID\": \"1138\",\"GLAccount\": \"074-2005-512A-201-00000000-0000-C3801S04-1-10A-13300012\",\"Amount\": \"6000000\"}",
    "StatusCode": 1
  }
];

/**
 *
 * declare the route
 */
app.get('/push', function(req, res) {

  var opts = {
    headers: bindingOptions
  };

  data.forEach(function(entry) {
    exchange.publish('', entry, opts, function() {
    });
    console.log("publish on RabbitMQ done..", entry);
  });
  res.redirect('/');
});

/**
 *
 * start listening on the specified port
 *
 */
var server = app.listen(port, function() {
  console.log('listening on port', port);
});

/**
 *
 * set up socketIO to listen on the port as well
 *
 */
io = io.listen(server);

/**
 * emit events through socketIO
 */
function emitEvent(data){
  io.sockets.on('connection', function (socket) {
    console.log('socket connected', socket.id);
    console.log("emitting event now from server using socketIO..", data);
    io.sockets.emit('event1', data);
  });
}
