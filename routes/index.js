var express = require('express');
var treeBuilder = require('../treeBuilder.js');
var router = express.Router();

/* GET home page. */


router.get('/mysql', function(req, res, next) {
  res.render('mysql', { title: 'MYSQL_Test' });
});



  router.get('/', function (req, res) {
      res.render('ctradlex', {title: "radlex"
      });
  });

router.get('/diagnoses', function(req, res, next) {
	res.send(req.app.locals.diagnoses);
});

router.get('/treeView', function(req, res, next) {
	//res.send(req.app.locals.treeView);
  var callback = function(data){
    res.json(data);
  };
  treeBuilder.getLazyTree(callback);
});


router.get('/pathToRoot/:ID', function(req,res,next){
//res.send(req.params.ID);
var testID = req.params.ID;
//console.log(testID);
var callback = function(data){
  res.json(data);
};
//console.log(testID);
treeBuilder.pathToRoot(testID, callback);
});


//supply treeview with on-demand data for lazy loading
router.get('/treeNode/:ID', function(req, res, next){
var testID = req.params.ID;
var callback = function(data){
	res.json(data);
};
treeBuilder.lazyNodeChild(testID, callback);
});

//fetch redlexJSON by ID
router.get('/getById/:id', function(req, res, next){
  var idToGet = req.params.id;
  var callback = function(data){
    res.json(data);
  };
  treeBuilder.getById(idToGet, callback);
});

router.put('/deleteId/:id', function(req, res, next){
  var idToDelete = req.params.id;
  console.log("routing delte request for id: " + idToDelete);
  var callback = function(data){
    res.json(data);
  };
  treeBuilder.deleteId(idToDelete, callback);
});

router.put('/removeParent/:id', function(req, res, next){
  var baseNodeParentRemove = req.params.id;
  var parentNodetoRemove = req.body.parentID;
  var callback = function(data){
    res.json(data);
  };
  treeBuilder.removeParent(baseNodeParentRemove, parentNodetoRemove, callback);
});

router.put('/addParent/:id', function(req, res, next){
  console.log("routing addParent Request");
  console.log(req.body);
  var childID = req.params.id;
  var parentID = req.body.parentID;
  console.log("routing add parent for ID: " + childID);
  console.log("Parent to Add: " + parentID);
  var callback = function(data){
    res.json(data);
    };
  treeBuilder.addParent(childID, parentID, callback);
});

router.get('/getParents/:id', function(req, res, next){
  var idToGet = req.params.id;
  console.log("routing getParents Reqeust for ID: " + idToGet);
  var callback = function(data){
    res.json(data);
  };
  treeBuilder.getParents(idToGet, callback);
});

router.put('/moveNode/:id', function(req, res, next){
  var idToMove = req.params.id;
  var node_Moved =  req.body.node_Moved;
  var node_OriginParent = req.body.node_OriginParent;
  var node_TargetParent = req.body.node_TargetParent;
  console.log("routing request move node on id: " + node_Moved);
  var callback = function(data){
    res.json(data);
  };
  treeBuilder.moveNode(node_Moved, node_OriginParent, node_TargetParent, callback);
});

//get Name & ID's of all diagnoses for the search box
router.get('/getTypeAhead', function(req, res, next){
  var callback = function(data){
    res.json(data);
  };
  treeBuilder.getTypeAhead(callback);
});

router.get('/getNewRecord/:parentID', function(req,res,next) {
  var parentToAdd = req.params.parentID;
  console.log("routing get new record request for parent id: " + parentToAdd);
  var callback = function(newRecord){res.json(newRecord);};
  treeBuilder.getNewRecord(parentToAdd, callback);
});

//get record by Name
router.get('/getByName/:Name', function(req, res, next) {
	var db = req.db;
	var srch = req.params.Name;
	//console.log(srch);
  	
	
	db.collection('ctradlex').find({Name : srch}, {
  		_id:true, 
  		Name:true, 
  		Pearls:true, 
  		Image_URL: true, 
  		parents:true, 
  		children:true}).toArray(function (err, updateRec) {  
      		db.collection('ctradlex').find(
      			{_id : {$in: updateRec[0].parents}},
      			{_id:true, Name:true})
      		.toArray(function(err, updater){
      			var newParents = [];
      			console.log(updater[0]);
      			for(i=0;i<updater.length;i++){
      				newParents.push(updater[i]);
      			}
      			updateRec[0].parents = newParents;
      			console.log(updateRec[0]);
      			res.json(updateRec);	
      		});
      });
});




//ObjectId("4ecc05e55dd98a436ddcc47c")

//update the current record
router.put('/postDBUpdates/:id', function(request, res) {
  console.log("got request");
  var radlexID = request.params.id;
  var updateQuery = request.body;

  var callback = function(data){
  res.send(data);
  };

  treeBuilder.postDBUpdate(radlexID, updateQuery, callback);

  });

module.exports = router;
