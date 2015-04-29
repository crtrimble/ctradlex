
var mongo = require('mongoskin');
var db = mongo.db("mongodb://localhost:27017/ctradlex", {native_parser:true});

var mysql      = require('mysql');
var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : 'elbolson',
	database : 'ctradlex'
});

connection.connect();

var srch2 = "0-1 mSv exam dose";
myfunc();

function myfunc () {
	console.log("starting");
	connection.query('SELECT ID, Image_URL FROM ctradlex.ctradlex WHERE Image_URL IS NOT NULL;', function(err, rows, fields) {
		if (!err){
			console.log('passing to Mongo');
			updateMongo(rows, 0);
		}
			else
				console.log('Error while performing Query.');
		});

	connection.end();

	
	}

function updateMongo(rows, iterator){
var theID = rows[iterator].ID;
var theVal = rows[iterator].Image_URL;
var uString = "Updated ";
uString += iterator;
uString += '/';
uString += rows.length;
uString += " (";
uString += Math.round(iterator/rows.length *10000)/100;
uString += "%) ";
uString += theID;
db.collection('ctradlex').update({ID_Old:theID}, {$set:{Image_URL:theVal}}, function(err,result){
//console.log(result);
console.log(uString);
var newIt = iterator + 1;
if (newIt < rows.length) {updateMongo(rows, newIt);}
});
}
