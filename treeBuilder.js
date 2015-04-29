var tidy = require('htmltidy').tidy;
//tidy('<table><tr><td>badly formatted html</tr>', function(err, html) { 
  //  console.log(html); 
//});

var mongo = require('mongoskin');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var db = mongo.db("mongodb://localhost:27017/ctradlex", {native_parser:true});
var DBCollection = "radlexTree";

rLimit = 1;

//getNewRecord("5519f66695f93bb3fa00a98f", function(){console.log("done");});
//console.log("initialized");

function initialize(){
	var db2 = MongoClient.connect('mongodb://localhost:27017/ctradlex', function(err, db3) {
		myColl = db3.collection('radlexTree');
		db.collection(DBCollection).drop(function(err, JSON){
			var IDtoFind = "5519f5ee95f93bb3fa001491";
			nodeTreeByID(IDtoFind);
	//dbGetChildren(rec[0]._id, "#", 0, 0);	
	//dbGetBaseNodes("", "#", 0);
	//ObjectId("5519f5ee95f93bb3fa001491")

});

	});
}
function getParentNodes(JSON, childNodeID, level){
	var newNodes = [];
	for(i=0;i<JSON.length;i++){
		var timeAdded = new Date().getTime();
		var timeString = timeAdded.toString();
		var newNodeID = JSON[i]._id + "-" + timeString;
		var children = false;
		if (JSON[i].parents === null) {
			console.log("This is null");
		}
		else{parents = JSON[i].parents;}
		if(JSON[i].Name === undefined || JSON[i].Name === null || JSON[i].Name == ":THING"){continue;}
		var newNode = {
			"id" : newNodeID,
			"radlexID" : JSON[i]._id,
			"parent" : parentNodeID, 
			"radlexChildren" : children,
			"text" : JSON[i].Name,
			"level" : level
		};
		newNodes.push(newNode);
	}
	return newNodes;
}

function getChildNodes(JSON, parentNodeID, level) {
	var newNodes = [];
	for(i=0;i<JSON.length;i++){
		var timeAdded = new Date().getTime();
		var timeString = timeAdded.toString();
		var newNodeID = JSON[i]._id + "-" + timeString;
		var children = false;
		if (JSON[i].children === null) {
			console.log("This is null");
		}
		else{children = JSON[i].children;}
		if(JSON[i].Name === undefined || JSON[i].Name === null){continue;}
		var newNode = {
			"id" : newNodeID,
			"radlexID" : JSON[i]._id,
			"parent" : parentNodeID, 
			"radlexChildren" : children,
			"text" : JSON[i].Name,
			"level" : level,
			"state" : {
				"opened" : true,
			}
		};
		newNodes.push(newNode);
	}
	return newNodes;
}

function nodeTreeByID(IDString){
	var nodeObj = ObjectId(IDString);
	var level = 0;
	var callback = function(err, JSON){
		var newNodes = getChildNodes(JSON, "#", 0);
		var callback2 = function(err, result){
			newNodes.forEach(function(node){
				dbGetChildren(node.radlexID, node.id, 0, (level+1));
			});
		};
		dbBulkInsert(newNodes,callback2);
	};


	
	db.collection('ctradlex').find({"_id": nodeObj}, {_id:true, Name:true, children:true}).toArray(callback);

}

function dbGetBaseNodes (parentRadlexID, parentNodeID, level){
	db.collection('ctradlex').find({"parents.Parents": ":THING"}, {_id:true, Name:true, children:true}).toArray(function (err, JSON) {  
		var newNodes = getChildNodes(JSON, parentNodeID, level);
		var callback = function(err, result){
			if (err) throw err;
			if (result){
				//console.log(newNodes.length + ' Added at level: ' + level);
				newNodes.forEach(function(node){
					dbGetChildren(node.radlexID, node.id, 0, (level+1));
				});
			}	
		};
		dbBulkInsert(newNodes, callback);	
	});
}

function dbBulkInsert(newNodes, callback){

	var bulk = myColl.initializeUnorderedBulkOp();
	for (nod=0;nod<newNodes.length;nod++){
		bulk.insert(newNodes[nod]);
	}
	bulk.execute(callback);


}


function lazyNode (JSON) {
	var nodeChildren;
	var dataFunc3 = "dfs";
	var isRoot = false;

	if (JSON.children === undefined || JSON.children === null || JSON.children.length === 0) {nodeChildren = false;}
	else {nodeChildren=true;}

	if (JSON.parents == ":THING"){
		console.log("found root node");
		isRoot = true;}

	var treeJSON = {
		"id" : String(JSON._id),
		"children" : nodeChildren,
		"text" : JSON.Name,
		"isRoot" : isRoot,
        //"url" : "/treeNode/",
       /// "data" : dataFunc2
   };
   return treeJSON;
}

function lazyTree (callback) {
	db.collection('ctradlex').find({"parents": ":THING"}, {_id:true, Name:true, children:true}).toArray(function (err, JSON) {
		var NodeCollection = [];
		for(i=0;i<JSON.length;i++){
			NodeCollection.push(
				lazyNode(JSON[i])
				);
		}
		var dataJSON = function(node, cb){
			var Nodeurl = "/treeNode/" + node.radlexID;
			if(node.id === "#") {
				cb(NodeCollection);
			}
			else {$.getJSON(Nodeurl, cb(data));
			}
		};
		callback(NodeCollection);
	});

}

function nodeByID (nodeID, callback){
	var rootNodeID = ObjectId(nodeID);
	db.collection('ctradlex').find({"_id": rootNodeID}, {_id:true, Name:true, children:true, parents:true, Pearls:true, Image_URL:true}).toArray(function (err, JSON) {
		if (JSON.length === 0) {
			callback("root");
		}

		else {
			console.log('found node: ' + JSON[0].Name);
			callback(JSON[0]);
		}
		});
}

function pathToRootNested(nodeObject, callback){
	var newSearch = ObjectId(nodeObject.id);
	db.collection('ctradlex').find({'children': newSearch}, {_id:true, Name:true, parents:true}).toArray(function (err, JSON) {
		console.log('found first parent: ' + JSON[0].Name + ' total length of ' + JSON.length);
		var NodeCollection = [];
		for(i=0;i<1;i++){
			//for each parent ID, create a lazyTree JSON object
			console.log("creating node for: " + JSON[i].Name);
			var newNode = lazyNode(JSON[i]);
			newNode.children = [];
			newNode.children.push(nodeObject);
			console.log(newNode);
			if (newNode.isRoot) {callback(newNode);}
				else {pathToRoot(newNode, callback);}
			}
	});
}

function pathToRoot(nodeObject, nodeCollection, callback){
	var newSearch = ObjectId(nodeObject);
	db.collection('ctradlex').find({'children': newSearch}, {_id:true, Name:true, parents:true}).toArray(function (err, JSON) {
		console.log("found parent: " + JSON[0].Name);
		nodeCollection.push(String(JSON[0]._id));
		if (JSON[0].parents[0] == ":THING") {
			nodeCollection = nodeCollection.reverse();
			callback(nodeCollection);		
		}
		else{pathToRoot(String(JSON[0]._id), nodeCollection, callback);}
		});
}

function lazyNodeChild (parentID, callback) {
	var parObjId = ObjectId(parentID);
	db.collection('ctradlex').find({"parents": parObjId}, {_id:true, Name:true, children:true}).toArray(function (err, JSON) {
		var NodeCollection = [];
		for(i=0;i<JSON.length;i++){
			NodeCollection.push(
				lazyNode(JSON[i])
				);
		}
		callback(NodeCollection);
	});
}

function dbGetChildren (parentRadlexID, parentNodeID, level){
	db.collection('ctradlex').find({"parents": parentRadlexID}, {_id:true, Name:true, children:true}).toArray(function (err, JSON) {  
		//console.log("db update set: " + JSON.length);
		var newNodes = getChildNodes(JSON, parentNodeID, level);
		var callback = function(err, result){
			if (err) throw err;
			if (result){
				console.log(newNodes.length + ' Added at level: ' + level);
				var isEqual = level <= rLimit;
				newNodes.forEach(function(node){
				//console.log("is Equal? " + isEqual);
				if (node.radlexChildren !== undefined && isEqual) {dbGetChildren(node.radlexID, node.id, (level + 1));}
			});
			}
		};
		if(newNodes !== undefined && newNodes.length > 0){
			dbBulkInsert(newNodes, callback);
		}
	});

}

function bulkUpdate(updateStrings, callback){
	console.log("performing bulk update");
	console.log(JSON.stringify(updateStrings));
	var db2 = MongoClient.connect('mongodb://localhost:27017/ctradlex', function(err, db3) {
		myColl = db3.collection('ctradlex');
		var bulk = myColl.initializeUnorderedBulkOp();
		console.log("initiating bulk update for: " + updateStrings.length);
		updateStrings.forEach(function(updateString, index){
			switch(updateString.commandType){
				case "insert": 
					bulk.insert(updateString.commandString);
					break;
				case "update": 
					console.log("find: " + updateString.findString + " change: " + updateString.commandString);
					bulk.find(updateString.findString).update(updateString.commandString);
					break;
				case "delete":
					bulk.find(updateString.findString).removeOne();
					break;
			}
		});
		bulk.execute(callback);
	});
}

function getNewRecord(parentId, callback){
var newID = new ObjectId();
		console.log("generating new ID: " + newID + " as child for parent ID: " + parentId);
		var newParentID = ObjectId(parentId);
		var newCallback = function(){
			callback(String(newID));
		};
		var updatStrings = [];
		var updateString1 = {
			'commandType' : "insert",
			'commandString': {
				"_id":newID, 
				"Name":"New Entry", 
				"parents":[newParentID]
			}
		};

		var updateString2 = {
			'commandType' : 'update',
			'findString'	: {
				"_id" :newParentID
			},
			'commandString': {
				$push: {
					"children":newID
				}
			}
		};
		console.log("completed updsted strings");
		console.log(updateString1);
		updateStrings = [updateString1, updateString2];
		bulkUpdate(updateStrings, newCallback);
}

function deleteId(idToDelete, callback){
	console.log ("preparing delete strings for id: " + idToDelete);
	var newcallback = function(){
		callback("done");
	};
	var objId = ObjectId(idToDelete);
	var updateStrings = [];
	var updateString1 = {
		'commandType' : 'update',
			'findString'	: {
				"children" : objId
			},
			'commandString': {
				$pull: {
					"children":objId
				}
			}
	};

	var updateString2 = {
		'commandType' : 'delete',
		'findString' : {
			"_id" : objId
		},
		'commandString': {}	
	};
	
	updateStrings = [updateString1, updateString2];
	console.log("delete strings:");
	console.log(updateStrings);
	bulkUpdate(updateStrings, newcallback);
}

function moveNode (node_Moved, node_OriginParent, node_TargetParent, callback) {
	node_Moved = ObjectId(node_Moved);
	node_OriginParent = ObjectId(node_OriginParent);
	node_TargetParent = ObjectId(node_TargetParent);

	var updateString1 = {
		'commandType' : 'update',
			'findString'	: {
				"_id" : node_Moved
			},
			'commandString': {
				$pull: {
					"parents":node_OriginParent
				}
			}
	};

		var updateString2 = {
		'commandType' : 'update',
			'findString'	: {
				"_id" : node_OriginParent
			},
			'commandString': {
				$pull: {
					"children":node_Moved
				}
			}
	};

		var updateString3 = {
		'commandType' : 'update',
			'findString'	: {
				"_id" : node_TargetParent
			},
			'commandString': {
				$push: {
					"children":node_Moved
				}
			}
	};

		var updateString4 = {
		'commandType' : 'update',
			'findString'	: {
				"_id" : node_Moved
			},
			'commandString': {
				$push: {
					"parents":node_TargetParent
				}
			}
	};
var updateStrings = [updateString1, updateString2, updateString3, updateString4];
var newCallback = function(){callback("success");};
console.log("generated update strings");
bulkUpdate(updateStrings, newCallback);

}

function getParents(idToGet, callback){
	console.log("Querying DB for: " + idToGet);
	var nodeIdToGet = ObjectId(idToGet);
	db.collection('ctradlex').find({"_id": nodeIdToGet}, {_id:true, Name:true, parents:true}).toArray(function (err, returnJSON) {
		var retJSON = returnJSON[0];
		console.log("parents: " + retJSON.parents);
		db.collection('ctradlex').find({"_id": { $in: retJSON.parents}}, {_id:true, Name:true}).toArray(function (err, parentJSON) {
			console.log(parentJSON);
			var parentNodes = [];
			parentJSON.forEach(function(data, index){
				var treeJSON = {
				"id" : String(data._id),
				"children" : false,
				"text" : data.Name,
				"isRoot" : true,
   				};
   				parentNodes.push(treeJSON);
			});
			console.log("parents found: " + parentNodes.length);
			callback(parentNodes);
		});	
	});
}

function removeParent (baseNodeParentRemove, parentNodetoRemove, callback) {
	console.log ("preparing delete strings for id: " + baseNodeParentRemove);
	var newcallback = function(){
		callback("done");
	};
	var childObject = ObjectId(baseNodeParentRemove);
	var parentObject = ObjectId(parentNodetoRemove);
	var updateStrings = [];
	var updateString1 = {
		'commandType' : 'update',
			'findString'	: {
				"_id" : parentObject
			},
			'commandString': {
				$pull: {
					"children":childObject
				}
			}
	};

	var updateString2 = {
		'commandType' : 'update',
		'findString' : {
			"_id" : childObject
		},
		'commandString': {
			$pull: {
				"parents":parentObject
			}

		}	
	};
	
	updateStrings = [updateString1, updateString2];
	console.log("remove parent association strings:");
	console.log(updateStrings);
	bulkUpdate(updateStrings, newcallback);
}

function addParent (childID, parentID, callback){
	console.log ("preparing add strings for id: " + childID);
	var newcallback = function(){
		callback("done");
	};
	var ObjchildID = ObjectId(childID);
	var ObjparentID = ObjectId(parentID);

	var updateStrings = [];
	var updateString1 = {
		'commandType' : 'update',
			'findString'	: {
				"_id" : ObjchildID
			},
			'commandString': {
				$push: {
					"parents":ObjparentID
				}
			}
	};

	var updateString2 = {
		'commandType' : 'update',
		'findString' : {
			"_id" : ObjparentID
		},
		'commandString': {
			$push: {
				"children":ObjchildID
			}

		}	
	};
	
	updateStrings = [updateString1, updateString2];
	console.log("add parent association strings:");
	console.log(updateStrings);
	bulkUpdate(updateStrings, newcallback);	
}

function postDBUpdate (radlexID, updateJSON, callback){
	console.log ("preparing post dbupdates for id: " + radlexID);
	var newcallback = function(){
		callback("done");
	};
	var ObjectRadlexID = ObjectId(radlexID);

	var updateStrings = [];
	var updateString1 = {
		'commandType' : 'update',
			'findString'	: {
				"_id" : ObjectRadlexID
			},
			'commandString': {
				$set: updateJSON
			}
	};

	
	updateStrings = [updateString1];
	console.log("add dbupdate strings");
	console.log(updateStrings);
	bulkUpdate(updateStrings, newcallback);	
}

module.exports = {
	lazyNodeChild: function (parentRadlexID, callback){
		if (parentRadlexID === undefined || parentRadlexID===null){lazyTree(callback);}
			else {lazyNodeChild(parentRadlexID, callback);}
	},
	
	getLazyTree: function(callback){lazyTree(callback);
	},
	
	pathToRoot: function(parentRadlexID, callback){
		console.log('ID to search: ' + parentRadlexID);
		var nodeCollection = [];
	    nodeCollection.push(parentRadlexID);
		pathToRoot(parentRadlexID, nodeCollection, callback);
	},
	
	getById: function (radlexId, callback){
		nodeByID(radlexId, callback);
	},
	
	getTypeAhead: function (callback){
		db.collection('ctradlex').find({}, {_id:true, Name:true}).toArray(function (err, JSON) {
		console.log("here is the typeAhead");
		console.log(JSON[233]);
		callback(JSON);
		});
	},
	
	postDBUpdate: function(radlexId, updateQuery, callback){
		console.log("routing postDBUpdate");
		postDBUpdate (radlexId, updateQuery, callback);
	},

	getNewRecord: function(parentId, callback){
		getNewRecord(parentId, callback);	
	},

	deleteId: function(idToDelete, callback){
		deleteId(idToDelete, callback);
	},

	moveNode: function(node_Moved, node_OriginParent, node_TargetParent, callback){
		moveNode(node_Moved, node_OriginParent, node_TargetParent, callback);
	},

	getParents: function (idToGet, callback){
		getParents(idToGet, callback);
	},

	removeParent: function (baseNodeParentRemove, parentNodetoRemove, callback) {
		removeParent(baseNodeParentRemove, parentNodetoRemove, callback);
	},

	addParent: function (childID, parentID, callback) {
		console.log("received addParent request");
		addParent(childID, parentID, callback);
	}
};


