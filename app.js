var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var users = require('./routes/users');
var mongo = require('mongoskin');
var ObjectId = require('mongodb').ObjectID;
var db = mongo.db("mongodb://localhost:27017/ctradlex", {native_parser:true});

var app = express();
//prefetch the base dataset
//var criteria = "{children: {$exists:false}}";
//console.log("criteria: " + criteria);

//db.collection('ctradlex').find({children: {$exists:false}, parents: {$exists:true}}).toArray(function(err, updateRec){
//  console.log("treeview update: " + updateRec.length);
//});

function nodeByID(nodeSet, ID){
  console.log ("nodeSet length = " + nodeSet.length);
  for(i=0;i<nodeSet.length;i++){
    //console.log (nodeSet[i].radlexID);
    if (String(nodeSet[i].radlexID) == String(ID)){
      console.log("the node" + nodeSet[i].text);
      return nodeSet[i];
    }
  }
  return false;
}
//hello
function nodesBuilder(JSON){
  var newNode = {};
  var newNodes = [];
  if(JSON === undefined){return newNodes;}
  if(JSON.Name == "System"){
    console.log("found system: " + JSON.parents[0].Parents);
  }
  if(JSON.hasOwnProperty("parents") === true && JSON.parents[0].Parents == ":THING"){
    console.log(JSON.Name + " has " + JSON.children.length + " children");
    newNode = {
      "id" : JSON._id + "-0",
      "radlexID" : JSON._id,
      "radlexParent" : "",
      "parent" : "#", 
      "radlexChildren" : JSON.children,
      "text" : JSON.Name,
      "ctradlex" : JSON 
    };
    newNodes.push(newNode);
    return newNodes;

  }

  else if(JSON.hasOwnProperty("parents") === true){
    for(i=0;i<JSON.parents.length;i++){
      newNode = {
        "id" : JSON._id + "-" + JSON.parents[i],
        "radlexID" : JSON._id,
        "radlexParent" : JSON.parents[i],
        "radlexChildren" : JSON.children,
        "parent" : "", 
        "text" : JSON.Name,
        "ctradlex" : JSON 
      };
//  console.log("New Node =" + newNode.text);
newNodes.push(newNode);
//console.log("newnodes length: " + newNodes.length);
}
return newNodes;
}

else return newNodes;
}

function findAllKids (node, allNodeSet, parentLevel2, arrayToConcat){
lengthtofind = node.radlexChildren.length;
var kParent = parentLevel2;
for(k=0;k<lengthtofind;k++){
        console.log("child to find: " + node.radlexChildren[k]);
        var nodetopush = nodeByID(allNodeSet, node.radlexChildren[k]);
        console.log ("found child: " + nodetopush.text);
        nodetopush.parent = node.id;
        nodetopush.id = nodetopush.radlexID + "-" + node.radlexID;
        nodetopush.level = (kParent + 1);
        arrayToConcat.push(nodetopush);
        console.log("pushed level pushed: " + nodetopush.level);
      }
return arrayToConcat;
}

function addChildren(parentLevel, baseNodeCollection, finalNodeCollection){
  console.log("parent level = " + parentLevel);
  console.log("baseNodeCollection = " + baseNodeCollection.length);
  console.log("finalNodeCollection = " + finalNodeCollection.length);
  console.log("first level = " + finalNodeCollection[0].level);
//console.log("first parent = " + baseNodeCollection[0].radlexParent);
console.log("first radlexID = " + finalNodeCollection[0].radlexID);
var addedCount = 0;
var allLength = finalNodeCollection.length;
var arrayToConcat = [];
var currDiag = {};
var currParent = parentLevel;
console.log("all length = " + allLength);

for (alldiags=0;alldiags<allLength;alldiags++){
 currDiag = finalNodeCollection[alldiags];
  if (currDiag.level == currParent && currDiag.radlexChildren !== undefined){
    console.log("found final to work with: " + currDiag.text + "currDiag Level: " +currDiag.level + "parent level: " + currParent + "children: " + currDiag.radlexChildren);
    if(typeof(currDiag.radlexChildren.length) == 'undefined'){continue;}
    console.log("this is how many we have " + currDiag.radlexChildren.length);
    arrayToConcat = findAllKids(currDiag, baseNodeCollection, currParent, arrayToConcat);
  }      
    console.log("alldiags= " + alldiags);
}
console.log("number added = " + addedCount);

return {
  finalCollection:finalNodeCollection.concat(arrayToConcat),
  NumberAdded:arrayToConcat.length
};
}

function UpdateNodesByID (initSet, currNode){ 
  //need to figure out whether we need to duplicate the node again...
  for(i=0;i<initSet.length;i++){
    if(initSet[i].radlexID == currNode.radlexParent){

      //console.log("found in string: " + initSet[i].Name);
      return initSet[i];
    }
  }
}

function newNode (JSON, level, parentID){
//check to make sure that the diagnosis has parents
if(JSON === undefined){
  //console.log("Error Here");
  return false;}
if (JSON.hasOwnProperty("children")){
  radLexCID = JSON.children;
}
else {
  //console.log ("NO CHILDREN FOUND");
  radLexCID = false;
}
var returnNode = {};
      returnNode = {
        "id" : JSON._id + "-" + parentID,
        "radlexID" : JSON._id,
        "radlexParents" : JSON.parents,
        "radlexChildren" : radLexCID,
        "parent" : parentID, 
        "text" : JSON.Name,
        //"ctradlex" : JSON, 
        "level" : level
      };
  return returnNode;
}

function recordByradlexID (recordSet, radlexID){
  for(findrec=0;findrec<recordSet.length;findrec++){
    //console.log (nodeSet[i].radlexID);
    if (String(recordSet[findrec]._id) == String(radlexID)){
      //console.log("found child" + recordSet[findrec].Name);
      return recordSet[findrec];
    }
  }
  //return false;
}

function dbGetChildren (childRadlexIDs){
  db.collection('ctradlex').find({
    "_id": {
      "$elemMatch": childRadlexIDs
    }
  }, {_id:true, Name:true, children:true}).toArray(function (err, updateRec) {  
  console.log("db update set: " + updateRec.length);
});

}

function getChildNodes (recordSet, parentNode) {
  var childNodes = [];
  var childRecord = {};
  var nodeChildren = parentNode.radlexChildren;
  var newChildLevel = parentNode.level + 1;
  //console.log(nodeChildren.length + " children to add for: " + parentNode.text);
  var startime = new Date().getTime();
  if (nodeChildren === undefined) {
    //console.log("Node: " + parentNode.text + " has no children");
    return childNodes;
  }
  var newSingleNode = {};
  //updateme
  for (child = 0; child < nodeChildren.length; child++){
    //find child in recordset
    //console.log("searching for child: " + nodeChildren[child] + "for parent node: " + parentNode.text);
    childRecord = recordByradlexID(recordSet, nodeChildren[child]);
    //create new node from child with parent ID at a level + 1 from teh parent
    newSingleNode = newNode(childRecord,(newChildLevel),parentNode.id);
    //console.log("Child Name: " + newSingleNode.text + " Child ID: " + newSingleNode.id + " Child Parent ID: " + newSingleNode.parent);
    if(newSingleNode ===false){
      //console.log("Node not added");
    }
      else {childNodes.push(newSingleNode);}
    //console.log("Added child: " + newSingleNode.text + " to Node: " + parentNode.text + "on parent ID: " + newSingleNode.parent + " at level: " + newSingleNode.level);
  }
//console.log("Added a total of: " + childNodes.length + "to Node: " + parentNode.text);
var endtime = new Date().getTime();
if ((endtime-startime) > 1000){
console.log("time to get " + nodeChildren.length + " children: " + (endtime-startime));
}
return childNodes;
}

function nodesAtLevel (nodeSet, nodeLevel){
var returnNodes = [];
//<nodeSet.length
var startTime = new Date().getTime();
for (nodelevel=0; nodelevel<nodeSet.length; nodelevel++){
  if(nodeSet[nodelevel].level == nodeLevel){
    returnNodes.push(nodeSet[nodelevel]);
  }
}
var finishtime = new Date().getTime();
console.log("Level " + nodeLevel + " Get Nodes Seconds: " + (finishtime - startTime));
return returnNodes;
}

function rootFinder(recordSet){
  var treeNodes = [];
  for(rootfinder = 0; rootfinder < recordSet.length; rootfinder++){
  testFinder = recordSet[rootfinder];
  //check if has parent of Thing
  if(testFinder.hasOwnProperty("parents") === true && testFinder.parents[0].Parents == ":THING"){
    //console.log(testFinder.Name + " has " + testFinder.children.length + " children");
    
    treeNodes.push(newNode(testFinder,0,"#"));
    console.log("Added base node: " + treeNodes[treeNodes.length - 1].text + " with ID: " + treeNodes[treeNodes.length - 1].id);
    }

}
return treeNodes;
}

function buildJSTree(recordSet){
var treeNodes = [];
var testFidner = {};
var nodesToAdd = [];
//find base nodes 
treeNodes = rootFinder(recordSet);
  // console.log("analyzing level " + nodeLev);
    var nodeLevels = [];
    var levelNodes = [];
    var itLev = 0;
    var nodesFound = 1;
    
    while(itLev < 5){
    //console.log("Analyzing level: " + itLev);
    nodesToAdd = [];  
    nodeLevels = nodesAtLevel(treeNodes, itLev);
    nodesFound = nodeLevels.length;
    console.log("Level " + itLev + ": " + nodesFound + " nodes to analyze");
    for(levRec=0;levRec<nodeLevels.length;levRec++){
      levelNodes = getChildNodes(recordSet, nodeLevels[levRec]);
      //console.log("Number nodes found: " + nodesFound);
      //console.log(nodesToAdd.length + " nodes added at level " + itLev);
      nodesToAdd = nodesToAdd.concat(levelNodes);
    }
  console.log("     " + nodesToAdd.length + " nodes added for level " + itLev);
  treeNodes = treeNodes.concat(nodesToAdd);
  itLev++;
}
  
    app.locals.treeView = treeNodes;
    console.log("Tree Nodes Added: " + treeNodes.length);

}


db.collection('ctradlex').find({}, {_id:true, Name:true, Pearls:true, Image_URL: true, parents:true, children:true}).toArray(function (err, updateRec) {  
  app.locals.baseSet = updateRec;
  db.collection('radlexTree').find({}).toArray(function(err, res){
    app.locals.treeView = res;
    console.log("updated treeView");
  });

  //buildJSTree(updateRec);
  var diagnoses = [];
  var endChildren = [];
  var treeNodes = [];
  console.log("starting tree builder");
  
  //for(j=0;j<updateRec.length;j++){
    //var newArray = nodesBuilder(app.locals.baseSet[j]);
    //console.log("New Array =" + newArray);
    //treeNodes = treeNodes.concat(newArray);
  //}
  //var baseNodes = [];
  //for(i=0;i<treeNodes.length;i++){
   // if(treeNodes[i].parent == '#'){
    //  treeNodes[i].level = 0;
     // baseNodes.push(treeNodes[i]);
      //console.log(treeNodes[i].text);
    //}



  //}
  //console.log("initial set= " + app.locals.baseSet.length + " Tree Set = " + treeNodes.length + " base nodes= " + baseNodes.length);
  
  //var treeView = [
  //{ "id" : "ajson1", "parent" : "#", "text" : "Simple root node" },
  //{ "id" : "ajson2", "parent" : "#", "text" : "Root node 2" },
  //{ "id" : "ajson3", "parent" : "ajson2", "text" : "Child 1" },
  //{ "id" : "ajson4", "parent" : "ajson2", "text" : "Child 2" },
  //];


  
  //baseNodes = addChildren(0, treeNodes, baseNodes).finalCollection;

//var NewSetToCheck = [];

  //for(newBaseNode=0;newBaseNode<baseNodes.length;newBaseNode++){
   // if (baseNodes[newBaseNode].level == 1){
    //  if (baseNodes[newBaseNode].radlexChildren !== undefined){
     //   console.log(baseNodes[newBaseNode].text + " has no children");
      //}
      //else {
      //NewSetToCheck.push(baseNodes[newBaseNode].level);
      //console.log("found new one: " + baseNodes[newBaseNode].text);
      //}
    //}
  //}
//console.log("New Collection Length: " + NewSetToCheck.length);
  //baseNodes = addChildren(1, treeNodes, baseNodes).finalCollection;
    //var numAdded = 1;
    //var numAdded = 1;
    //var rowToAdd = 0;
    //while(rowToAdd<3){
      //returnSet = addChildren(rowToAdd, treeNodes, baseNodes);
      //numAdded = treeView.NumberAdded;
      //console.log('number added = ' + numAdded);
      //baseNodes = returnSet.finalCollection;
      //console.log('basenodes length = ' + baseNodes.length);
      //rowToAdd = rowToAdd + 1;
    //}


  //console.log("jsNodes Length: " + jsNodes.length);
  //for(i=0;i<jsNodes.length;i++){
  //  if(jsNodes[i].hasOwnProperty("parents")){
  //    for(j=0;j<jsNodes[i].radLexVals.parents.length;j++){
  //      nodeByID(jsNodes, jsNodes[i].radLexVals.parents[j]).children.push(jsNodes[i]);
  //    }
  //  }
  //}

    //if ((updateRec[i].hasOwnProperty("children") === false) || (updateRec[i].hasOwnProperty("parents")===true)){
    //  endChildren.push(updateRec[i]);
    //}

  //for(k=0; k<jsNodes.length; k++){
   // if (jsNodes[k].hasOwnProperty("parents")) {console.log("found one: " + jsNodes[k].text);}
  //}




  app.locals.diagnoses = diagnoses;
 // db.collection('ctradlex').find({children: {$exists:false}, parents: {$exists:true}}).toArray(function(err, updateRec){
 //   console.log("treeview update: " + updateRec.length);
 //   console.log(updateRec[0]._id);
 //   console.log("total diagnoses = " + updateRec[234]);
    //console.log(nodeByID(app.locals.baseSet, updateRec[0].parents[0]));
 // });

 // console.log("length of children nodes: " + endChildren.length);
 // console.log("Done initializing"); 

});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Make our db accessible to our router
app.use(function(req,res,next){
  req.db = db;
  next();
});

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
//  res.status(err.status || 500);
//  res.render('error', {
//    message: err.message,
//    error: {}
//  });
});


module.exports = app;
