/* eslint-env node*/
/* eslint-disable no-console */
'use strict';

let path = require('path');
let express = require('express');
let app = express();
app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
});

app.set('port', 8080);
app.use(express.static(__dirname));

app.listen(app.get('port'), () => console.info('Server listening on port 8080...'));
