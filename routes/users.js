var express = require('express');
var router = express.Router();

/*
 * GET userlist.
 */
router.get('/userlist', function(req, res) {
    var db = req.db;
    db.collection('userlist').find().toArray(function (err, items) {
        res.json(items);
    });
});


router.post('/getDB', function(required, result){
    var db = req.db;
    db.collection('ctradlex').find().toArray()(function (err, items) {
        result.json(items);
    });
});



/*
 * POST to adduser.
 */
router.post('/adduser', function(req, res) {
    var db = req.db;
    db.collection('userlist').insert(req.body, function(err, result){
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
});

router.post('/getCounts', function(req, res) {
    var connection = req.connection;
    connection.connect();

    connection.query('SELECT count(*) from protegetext', function(err, rows, fields) {
    if (!err)
    console.log('The solution is: ', rows);
    else
    console.log('Error while performing Query.');
});

connection.end();   

    db.collection('userlist').insert(req.body, function(err, result){
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
});

module.exports = router;