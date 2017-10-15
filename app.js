var express    =  require('express');
var amqp       =  require('amqp');
var io         =  require('socket.io');
var app        =  express();
var path       =  require('path');
var bodyParser =  require('body-parser');
var data       =  require('./data/sample.json');
var port       =  3000;
var exchange, queue;

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

var bindingOptions  =  {'x-match': 'all', 'Type': 'Feedback', 'Company': '000'};
var exchangeOptions =  {autoDelete: false, type: 'headers', passive: false, durable: true, arguments: bindingOptions};

function setup() {
  exchange = connection.exchange('GLActualFeedbackExchange', exchangeOptions, function(exchange) {
    console.log('creating/opening queue');
    queue = connection.queue('GLActualFeedbackQueue', {autoDelete: false, durable: true, exclusive: false, arguments: bindingOptions}, function(queue) {
      queue.bind_headers(exchange, bindingOptions);
    });
  });
}

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
