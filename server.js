var express =  require('express');
var app     =  express();
var user    =  require('./routes/user');
var http    =  require('http');
var path    =  require('path');
var amqp    =  require('amqp');
var server  =  require('http').createServer(app);
var io      =  require('socket.io').listen(server);

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

//Server initialise
server.listen(app.get('port'));

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', function(req, res){
  res.render('index', {
    title: 'Publisher application powered by RabbitMQ, Node, Express, Jade'
  });
});

var conn = amqp.createConnection({ host: 'localhost' });
conn.on('ready', setup);

var exchange;
function setup() {
  exchange = conn.exchange('my_exchange1', {'type': 'fanout', durable: false}, exchangeSetup);
}

var queue;
var deadQueue;

function exchangeSetup() {
  queue =  conn.queue('my_queue1', {durable: false, exclusive: false},queueSetup);
  queue.on('queueBindOk', function() { onQueueReady(exchange); });
}

function queueSetup() {
  queue.bind(exchange.name, 'my_queue1');
}

function onQueueReady(exchange){
  console.log("queue binding done...");
}

app.post('/test', function(req, res){
  var myName = req.body.myName;
  console.log(exchange);
  console.log("publish done on RabbitMQ...", req.body.myName);
  res.redirect('/');
});
