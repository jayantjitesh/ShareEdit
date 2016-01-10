

Meteor.subscribe("documents");
Meteor.subscribe("editingUsers");


//Router code

Router.configure({
  layoutTemplate: 'ApplicationLayout'
});

Router.route('/', function () {
  console.log("you hit /");
  this.render("navbar", {to: "header"});
  this.render("docList", {to: "main"});
});

Router.route('/documents/:_id', function () {
  console.log("you hit /documents "+this.params._id);
  Session.set("docid", this.params._id);
  this.render("navbar", {to: "header"});
  this.render("docItem", {to: "main"});
});


//End of Router code

// find the first document in the Documents colleciton and send back its id
Template.editor.helpers({
  docid:function(){
    setUpCurrentSession();
    return Session.get("docid");
 
  }, 
  // template helper that configures the CodeMirror editor
  // you might also want to experiment with the ACE editor
  config:function(){
    return function(editor){

      editor.setOption("lineNumbers", true);
      editor.setOption("theme", "cobalt");
      editor.setOption("mode", "html");
      editor.on("change", function(cm_editor, info){
        //console.log(cm_editor.getValue());
        $("#viewer_iframe").contents().find("html").html(cm_editor.getValue());
        Meteor.call("addEditingUser", Session.get("docid"));
      });        
    }
  }, 
})

Template.editingUsers.helpers({
users:function(){
  var doc, currUsers, eusers;

  doc = Documents.findOne({_id : Session.get("docid")});
  if (!doc){ return; } // no documents return
  eusers=EditingUsers.findOne({docId:doc._id});
  if (!eusers){ return; } // no editing users return

  currUsers=new Array();
  var index=0;

  for(var user_id in eusers.users){
    currUsers[index] = fixObjectKeys(eusers.users[user_id]);
    index++;
  }

  return currUsers;

}
})  

Template.docMeta.helpers({
document:function(){
  return Documents.findOne({_id : Session.get("docid")});
},
canEdit:function(){
  var doc=Documents.findOne({_id : Session.get("docid")});

  if(doc && doc.owner == Meteor.userId()){
    return true;
  }
  else{
    return false;
  }
}
})


Template.editableText.helpers({
userCanEdit:function(doc,Collection){
  //User can edit if doc is owned by the user
  doc = Documents.findOne({_id : Session.get("docid"), owner : Meteor.userId()});
  if(doc){
    return true;
  } 
  else{
    return false;
  }
}
})


Template.navbar.helpers({
documents:function(){
  return Documents.find({});
}
})

Template.docList.helpers({
documents:function(){
  return Documents.find({});
}
})


////////////////
//// EVENTS
///////////////


Template.navbar.events({
"click .js-add-doc" : function(event){
  event.preventDefault();
  console.log("Add a new doc");

  if(!Meteor.user()){ //User is not logged in
    alert("You need to login first!!");
  }
  else{ // User is logged in
    Meteor.call("addDoc", function(err,res){
      if(!err){
        console.log("Events  Got the  id back : "+res);
        Session.set("docid",res);
      }
    });
  }
},

 "click .js-load-doc" : function(event){
    Session.set("docid",this._id);
 }
})



Template.docMeta.events({
"click .js-tog-private" : function(event){
 
  var doc={_id:Session.get("docid"), isPrivate:event.target.checked};
  console.log(doc);
  Meteor.call("updateDocPrivacy",doc);
}
})


/////// Helper functions /////


function setUpCurrentSession(){
  if(!Session.get("docid")){
      var doc = Documents.findOne();
      if (doc){
        Session.set("docid", doc._id);
      }
  }
 }


// this renames object keys by removing hyphens to make the compatible 
// with spacebars. 
function fixObjectKeys(obj){
  var newObj = {};
  for (key in obj){
    var key2 = key.replace("-", "");
    newObj[key2] = obj[key];
  }
  return newObj;
}

