

var userListData = [];
  
function currentID() {
  return $('#_id').text();
}



// DOM Ready =============================================================
$(document).ready(function() {

  initializeToggles();

  initializeDiagnosisTools();

  treeRefresh("root", function(msg){console.log("done loading root");});

  $.get('/getTypeAhead', function(data){
    initTypeAhead(data);
  });

  $(window).on("resize", function(){
    dynamicSize();
  });

  $('#progressbar').progressbar({
    //$('#progressbar').style("width:100%");


});

  $('#insertPara').click(function (e){
    $('#paraLink').val('');
    $('#paraLink').focus();
    $('#paraLink')[0].setSelectionRange(0, 0);
  });

  $('#insertImg').click( function(e) {
    $('#imgLink').val('');
    $('#imgLink').focus();
    $('#imgLink')[0].setSelectionRange(0, 0);
  }); 

  $('#imgLink').keypress(function (e) {
    var key = e.which;
      
    if(key == 13)  // the enter key code
      {   
        var txtToAdd = "<img src='" + $('#imgLink').val() + "' >";
        var cb = function(){$("#insertImg").trigger("click");};
        textToImgURL(txtToAdd, cb);
      }
  });

  $('#insertBreak').click(function(){
    var cb = function(){};
    textToImgURL("<br>\r", cb);  
  });

  $('#addTextToHTML').click(function(e) {
        var txtToAdd = "<br>" + $('#paraLink').val();
        var cb = function(){$("#insertPara").trigger("click");};
        textToImgURL(txtToAdd, cb);    
  });

  dynamicSize();


});

function autoTextExpand (){
   $('#treeViewDiv').mouseover(function(){
    console.log("mouse over");
    var leftDivPercent = $(this).width()/($(this).width() + $('#rightBar').width());
    console.log("Percentage: " + leftDivPercent);
    if (leftDivPercent <= 0.28){
      $(this).animate({
        width: "35%"
      },200);

      $('#rightBar').animate({
        width: "65%"
      },200);
 }
  });

  $('#treeViewDiv').mouseleave(function(){
    var leftDivPercent = $(this).width()/($(this).width() + $('#rightBar').width());
    console.log("Percentage: " + leftDivPercent);
    if (leftDivPercent >= 0.28){
      $(this).animate({
        width: "25%"
      },200);

      $('#rightBar').animate({
        width: "75%"
      },200);
 }
  });
}

function textToImgURL(inptText, callback){
  checkHTML();
    initialText = $("#Img_URL").contents().find('body').html();      
    $("#Img_URL").contents().find('body').html(initialText + " " + inptText);
    var allHTML = document.getElementById('Img_URL').contentWindow.document.documentElement.outerHTML;
    $("#edit_URL").val(allHTML);       
    callback();
  updateDB();
}

function initializeDiagnosisTools(){
  $('#Img_URL').on('drop', function(evt){
      evt.stopPropagation();
      evt.preventDefault();
      var droppedHTML = evt.dataTransfer.getData("text/html");
      console.log(droppedHTML);
  });

    $('#Img_URL').on('paste', function(evt){
      console.log("pasted");
  });

  $('#ImgUrlWrapper').flip({
    axis: 'y',
    trigger: 'manual'
  });
  
  $("#Pearls").blur(function(){
    updateDB();
    console.log("Updated DB on Pearls Edit");
    });

  $('.edit_area').editable(function(value, settings){
    $("#Name").text(value);
    updateDB();
    var nodeUpdate = $("#treeViewDiv").jstree(true).get_node(currentID());
    console.log("currentID = " + currentID());
    console.log("update value = " + value);
    $("#treeViewDiv").jstree('set_text', [nodeUpdate , value] );
    console.log("updated Name in DB");
    return(value);}, {
     type      : 'textarea',
     event     : "dblclick",
     cancel    : 'Cancel',
     submit    : 'OK',
     style     : 'form-control'
   });
  $('.edit_area').width(400);
}

function initializeToggles(){
   
  var docInput = document.getElementById("imgSize");
  docInput.addEventListener("input", function() {
      console.log($(this).val());
        var adjustedSize = Math.round($(this).val()/100*750);
        if($(this).val() == "100"){
        var defaultCSS = "";
        $("#Img_URL").contents().find('head').html(defaultCSS); 
        } else {
          var newStyle = "<style> img {max-width: " + adjustedSize + "px; max-height: " + adjustedSize + "px;}</style>";
          $("#Img_URL").contents().find('head').html(newStyle);
        }
     }, false);

    $('.toggle').toggles();

    $("#Img_URL").load(function(){
      var event = new Event(
          'input',
          { bubbles: false, cancelable: false });
      document.getElementById("imgSize").dispatchEvent(event);
    });

    $('#editToggle').on('toggle', function (e, active) {
      if (active) {
        checkHTML();
        $('#ImgUrlWrapper').flip(true);
      } else {
        var myDoc = document.getElementById('Img_URL');
        myDoc.contentWindow.document.open('text/htmlreplace');
        myDoc.contentWindow.document.write($('#edit_URL').val());
        myDoc.contentWindow.document.close();
        $('#ImgUrlWrapper').flip(false);
        updateDB();
      }



    });
}

function checkHTML(){
  console.log("checking html");
  var htmlVal = $('#edit_URL').val();
  console.log("html val : " + htmlVal);
  if (htmlVal === undefined || htmlVal === null || htmlVal === "") {
    var html = "<html> \n" +
    "<head> \n" +
    "<style type='text/css'> \n" +
    "<!--" +
    "body { font-family: arial; font-size: 12pt } \n" +
    "p { font-family: arial; margin-right: 2; margin-top: 2; margin-left: 2; margin-bottom: 2 } \n" +
    "--> \n" +
    "</style> \n" +   
    "</head> \n" +
    "<body> \n" +
    "</body> \n" +
    "</html> \n";
    $('.Img_URL').val(html);
  }
}

function dynamicSize(){
  //calculate total height of main container, considering top navigation bar
  
  var pbBarHeight = $('#pbContainer').height();
  var navBarHeight = $(".navbar-fixed-top").height();
  var totalOverhead = pbBarHeight + navBarHeight;
  console.log("total overhead:" + totalOverhead);
  
  var mainDivHeights = $(window).height() - totalOverhead - 30;
  
  //offset top container
  $("#pbContainer").css({top: navBarHeight-10 + "px"});
  $(".mainWindow").css({top: totalOverhead-15 + "px"});
  $(".mainWindow").height(mainDivHeights);

  //manually set heights on the flip iframe because they don't respond to 100%
  $(".imgPane").height(mainDivHeights);

  //fill blank space on pearls box with what height is left over after parentitems
  var parentHeight = 0;
  $(".parentDiv").each(function(){
   parentHeight += $(this).height();
  });
  parentHeight = parentHeight + 130;
  $("#Pearls").height(mainDivHeights - parentHeight);
  $(".imgPane").width($("#ImgUrlWrapper").width());
}

function getTreeNode(radlexID, callback){
    console.log("initiating getTreeNode with radlexID: " + radlexID);
    var jsTree = $('#treeViewDiv').jstree(true);
    var nodeToSelect = jsTree.get_node(radlexID);
    if(!nodeToSelect){
      console.log("have to rebuild tree to get node");
      console.log("initiating treeRefresh with ID:" + radlexID);
      treeRefresh(radlexID, callback);
    }
    else {
      console.log("found node in tree, selecting node: " + nodeToSelect.text);
      jsTree.deselect_all(true);
      jsTree.select_node(nodeToSelect);
      var jNode = $('#'+nodeToSelect.id);
      jNode.get(0).scrollIntoView();
      callback();
    }
}

function refreshParentTree(childID, callback){
    var idToGet = childID;
    console.log("refreshing parent tree for child ID: " + idToGet);
    $('#parentTree').jstree({
      'core' : {
        'data' : function(node, cb){
        },
        "check_callback" : true
      }
    });
    console.log("created dummy tree");
    $('#parentTree').jstree(true).destroy();
    
    console.log("destroyed tree");
    $('#parentTree').jstree({
      'core' : {
        'data' : function(node, cb){
          var nodeURL = "/getParents/" + idToGet;
          $.getJSON(nodeURL, function(data){
            cb(data);      
          });
        },
        "check_callback" : true
      },
      "plugins" : [ "contextmenu", "wholerow", "dnd", "crrm" ],
      "themes" : {"variant" : "large"},

      "contextmenu":{         
        "items": function(node) {
          var tree = $("#treeViewDiv").jstree(true);
          var selectedNode = $("#treeViewDiv").jstree("get_selected");
          console.log(selectedNode.text);
          return {
            "Delete": {
              "separator_before": false,
              "separator_after": false,
              "label": "Remove Parent",
              "action": function (selectedNode) {
                var currentID = $('#_id').text();
                console.log("clicked delete button for :" + node.text);
                $.getJSON('/getById/' + currentID, function(data){
                  console.log(data.parents);
                  if (data.parents === undefined || data.parents === null || data.parents.length <= 1){
                    alert("cannot remove the only parent");
                  }
                  else {
                    var parentToDelete = {parentID:node.id};
                    var currentChild = $('#_id').text();
                    console.log ("initiating node delete");
                    $.ajax({
                      type: 'PUT',
                      data: parentToDelete,
                      url: '/removeParent/' + currentChild,
                      dataType: 'json'
                    }).done(function(response){
                      refreshDoc(currentChild);
                      treeRefresh(currentChild, callback); 
                    });                        
                  }
                });
              }
            }
          };          
        }
      }

    });

    $('#parentTree').bind("click.jstree", function (e) {
      console.log("click event");
      var originalID = $('#_id').text();
      var parentID = $('#parentTree').jstree(true).get_selected();
      console.log("child ID: " + originalID);
      console.log("parent ID: " + parentID);
      console.log("call getTreeNode");
      getTreeNode(parentID, function(msg){
        console.log("got parent node");
        getTreeNode(originalID, function(){
          console.log("done");
        });
      });

    });

    $('#parentTree').on("ready.jstree", function (e, data) {
            //onLoaded();
            console.log("parent tree is ready");
            dynamicSize();
          });
}

function refreshDoc(radlexID){
  if (radlexID === undefined) {radlexID = $('#_id').text();}
  console.log("initiating refresh doc for id: " + radlexID);
  $.getJSON('/getById/' + radlexID, function(jsonItem) {
   console.log("refreshing doc for: " + jsonItem.Name);
   $('#_id').text(jsonItem._id);
   $('#Name').text(jsonItem.Name);
   $('#Pearls').val(jsonItem.Pearls);
   $('#parents').text(jsonItem.parents);
   $('#edit_URL').val(jsonItem.Image_URL);
   var myDoc = document.getElementById('Img_URL');
   myDoc.contentWindow.document.open('text/htmlreplace');
   myDoc.contentWindow.document.write(jsonItem.Image_URL);
   myDoc.contentWindow.document.close();
   $('.typeahead').typeahead('val', '');
   console.log("radlexID = :" + radlexID);
   refreshParentTree(radlexID, function(){
    console.log("updated from refreshParent");
    
  });
 });

}
function openPathToRoot(pathToRoot, index, line, callback){   
  // Number from 0.0 to 1.0
  var nodePercent; 
  console.log("initiating open by to root");
  var treeObj = $('#treeViewDiv').jstree(true);
  nodeToOpen = treeObj.get_node(pathToRoot[index]);
  treeObj.open_node(nodeToOpen, function(){
    if (index == pathToRoot.length - 1){
      treeObj.deselect_all();
      treeObj.select_node(nodeToOpen, true);
      console.log("reached the last node to open in series");
      var jNode = $('#'+nodeToOpen.id);
      jNode.get(0).scrollIntoView();
      nodePercent = ((index + 1) / (pathToRoot.length));
      line.animate(nodePercent);
      console.log(String(callback));
      callback();

    }
    
    else {
      $('#'+nodeToOpen.id).get(0).scrollIntoView();
         nodePercent = ((index + 1) / (pathToRoot.length));
         line.animate(nodePercent);
         console.log(nodePercent + "%"); 
      openPathToRoot(pathToRoot, (index + 1), line, callback);
      
    }
  });
}

function treeRefresh(fromID, callback){
  console.log("initiating tree refresh");    
    // console.log("destroying tree");

    $('#treeViewDiv').jstree({
      'core' : {
        'data' : function(node, cb){
        },
        "check_callback" : true
      }
    });

    console.log("created dummy tree");

    $('#treeViewDiv').jstree(true).destroy();

      $('#treeViewDiv').jstree({
        'core' : {
          'data' : function(node, cb){
            var Nodeurl = "/treeNode/" + node.id;
            var treeViewURL = "/treeview";
            if(node.id === "#") {
              $.getJSON(treeViewURL, function(data){
                cb(data);      
              });
            }
            else {
              $.getJSON(Nodeurl, function(data){
                cb(data);
              });
            }
          //console.log("evaluating if statement");
        },
        "check_callback" : true,
        //"themes" : {"variant" : "large"},
        multiple : false
      },
      "plugins" : [ "contextmenu", "wholerow", "dnd", "crrm" ],
      "themes" : {"variant" : "large"},
      "crrm" : {
        input_width_limit : 200,
        move : {
          always_copy     : "multitree", // false, true or "multitree"
          open_onmove     : false,
          default_position: "last",
          check_move      : function (m) { 
            if(!m.np.hasClass("someClassInTarget")) return false;
            if(!m.o.hasClass("someClassInSource")) return false;
            return true;
          }
        }
      },

      "dnd" : {

        "drop_finish" : function(data) {
          alert(data.node.id);
        }
      },

      "contextmenu":{         
        "items": function(node) {
          var tree = $("#treeViewDiv").jstree(true);
          var selectedNode = $("#treeViewDiv").jstree("get_selected");
          console.log(selectedNode.text);
          return {
            "Create": {
              "separator_before": false,
              "separator_after": false,
              "label": "New",
              "action": function (selectedNode) { 
                console.log("clicked the menu for node: ");
                console.log(selectedNode.id);
                pNodeID = node.id;
                node = tree.create_node(node);
              }
            },
            "Delete": {
              "separator_before": false,
              "separator_after": false,
              "label": "Delete",
              "action": function (selectedNode) {
                console.log("clicked delete button for :" + node.text);
                $.getJSON('/getById/' + node.id, function(data){
                  if (data.children !== undefined && data.children !== null && data.children.length !== 0){
                    alert("please remove " + data.children.length + " chidlren before deleting");
                  }
                  else {
                    console.log ("initiating node delete");
                    $.ajax({
                      type: 'PUT',
                      data: {},
                      url: '/deleteId/' + node.id,
                      dataType: 'json'
                    }).done(function(response){
                      console.log("got response back " + response);
                      console.log(node.parent.text);
                      $("#treeViewDiv").jstree(true).refresh_node(node.parent);

                      getTreeNode(node.parent); 
                    });                        
                  }
                });
              }
            },

            "Rename": {
              "label": "Rename",
                  "action": function (data) {
                  var inst = $.jstree.reference(data.reference),
                      obj = inst.get_node(data.reference);
                  inst.edit(obj);
              }   
            }     
          };          
        }
      }
    });

          $('#treeViewDiv').on("changed.jstree", function (e, data) {
          });

          $('#treeViewDiv').on("rename_node.jstree", function (event, data) {
            $("#Name").text(data.text);
            updateDB();
          });

          $('#treeViewDiv').on("create_node.jstree", function (event, data) {
                // create a copy in memory - DO NOT MODIFY THE ORIGINAL
            var node = $.extend(true, {}, data.node);
            node.name = node.text;
            node.parentId = data.node.parent;

            $.getJSON('/getNewRecord/' + data.node.parent, function(newNodeID){
                  //console.log("got New Record with idfor parent: " + selectedNode.text);
                  console.log("new Node ID = :" + newNodeID);
                  data.instance.set_id(node, newNodeID);
                  refreshDoc(newNodeID);
                  data.instance.edit(newNodeID);

              });
        });

        $('#treeViewDiv').on("ready.jstree", function (e, data) {

          console.log("evaluating function for ID: " + fromID);
          if(fromID !== 'root') {
            var pathToRoot  = "/pathToRoot/" + fromID;
            $.getJSON(pathToRoot, function(data){
              console.log("gotPathToRoot");
              //console.log(data);
              //console.log(String(callback));
              $('#pbContainer').empty();
              var line = new ProgressBar.Line('#pbContainer', {
                color: '#428bca',
                strokeWidth: 0.5,

              });
              console.log("created line");
              openPathToRoot(data, 0, line, callback);
            });
          }
          else{
            callback("done loading tree");}
          });

        $('#treeViewDiv').on("hover_node.jstree", function (e, data) {

          });

        $('#treeViewDiv').on("dehover_node.jstree", function (e, data) {

          });


        $('#treeViewDiv').bind("click.jstree", function (e) {
          console.log("click event");
          var selectedNode = $('#treeViewDiv').jstree(true).get_selected();
          refreshDoc(selectedNode);


        });

        $("#treeViewDiv").bind('move_node.jstree', function(e, data) {
          var node_Moved = data.node.id;
          var node_OriginParent = data.old_parent;
          var node_TargetParent = data.parent;
          var nodeBody = {
            "node_Moved" : node_Moved,
            "node_OriginParent" : node_OriginParent,
            "node_TargetParent" : node_TargetParent
          };
          console.log("starting ajax request for dnd on node: " + node_Moved);

          $.ajax({
            type: 'PUT',
            data: nodeBody,
            url: '/moveNode/' + node_Moved,
            dataType: 'json'
          }).done(function(response){
            console.log("finished Db Updates");
            console.log("server response: " + response);
          }); 

        });
} 

function updateDB(){
  var srchQuery = {
    'Name' : String($('#Name').text()),
    'Pearls' : String($('#Pearls').val()),
    "Image_URL" : $('#edit_URL').val()
    //"Image-URL" : document.getElementById('Img_URL').contentWindow.document.body.innerHTML 
  };

  $.ajax({
    type: 'PUT',
    data: srchQuery,
    url: '/postDBUpdates/' + String($('#_id').text()),
    dataType: 'json'
  }).done(function(response){
    console.log("got response back" + response);
  }); 
}

function initTypeAhead(srchTerms){
  var newSearch = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace('Name'),
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: srchTerms,
    limit: 20
  });


  newSearch.initialize();


  $('#basics .typeahead')
  .on('typeahead:cursorchanged', function(obj, sugg, dataset){

  })
  .on('typeahead:selected', function(obj, sugg, dataset){
    refreshDoc(sugg._id);
    getTreeNode(sugg._id, function(msg){console.log("typeahead done");}); 
  })
  .typeahead({
    hint: true,
    highlight: true,
    minLength: 5
  },
  {
    name: 'newSearch',
    displayKey: 'Name',
    source: newSearch.ttAdapter()
  });

  $('#addParent .typeahead')
  .on('typeahead:cursorchanged', function(obj, sugg, dataset){

  })
  .on('typeahead:selected', function(obj, sugg, dataset){
    var currChildID = $('#_id').text();
    var newParentID = sugg._id;
    console.log("parent ID:" + sugg._id);
    var parentJSON = {parentID:newParentID};
    console.log(currChildID);
    var alreadyPresent;
    $.getJSON('/getParents/' + currChildID, function(data){
      for (i=0;i<data.length;i++) {
        if(data[i].id == newParentID) {
          alreadyPresent = true;
          alert("parent already exists");
          break;
        }
      }
      if (!alreadyPresent){
        console.log("calling addParent request");
        $.ajax({
          type: 'PUT',
          data: parentJSON,
          url: '/addParent/' + currChildID,
          dataType: 'json'
        }).done(function(response){
          refreshDoc(currChildID);
          treeRefresh(currChildID, function(){console.log('successfully added parent to child');}); 

        });    
      }
    });

      //if (data.parents === undefined || data.parents === null || data.parents.length <= 1){
        //alert("cannot remove the only parent");
      //}
      //else {
        //var parentToDelete = {parentID:node.id};
        //var currentChild = $('#_id').text();
        //console.log ("initiating node delete");
          //$.ajax({
            //type: 'PUT',
            //data: parentToDelete,
            //url: '/removeParent/' + currentChild,
            //dataType: 'json'
            //}).done(function(response){
              //treeRefresh(currentChild, callback); 
        //});                        
      //}
        })
    .typeahead({
      hint: true,
      highlight: true,
      minLength: 5
    },
    {
      name: 'newSearch',
      displayKey: 'Name',
      source: newSearch.ttAdapter()
    });
}


