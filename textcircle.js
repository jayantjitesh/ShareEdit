this.Documents = new Mongo.Collection("documents");
EditingUsers = new Mongo.Collection("editingUsers");


if (Meteor.isClient) {

  Meteor.subscribe("documents");
  Meteor.subscribe("editingUsers");

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
          Meteor.call("addEditingUser");
        });        
      }
    }, 
  })

Template.editingUsers.helpers({
  users:function(){
    var doc, currUsers, eusers;

    doc = Documents.findOne();
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

} //End of isClient block

if (Meteor.isServer) {
  Meteor.startup(function () {
    // startup code that creates a document in case there isn't one yet. 
    if (!Documents.findOne()){// no documents yet!
        Documents.insert({title:"my new document"});
    }
  });


  Meteor.publish("documents", function (){
    return Documents.find({
      $or : [
        {isPrivate : false},
        {owner : this.userId} 
      ]})
  });

  Meteor.publish("editingUsers", function (){
    return EditingUsers.find();
  });
}

Meteor.methods({
  addEditingUser:function(){
    var doc, user, euser;

    doc = Documents.findOne();

    if (!doc){ return; } // no documents return
    if (!this.userId){ return; } // no user logged in return

    user=Meteor.user().profile;

    euser=EditingUsers.findOne({docId:doc._id});

    if(!euser){
      euser = {
          docId:doc._id,
          users:{},
      };
    }

    euser.lastEdit = new Date();
    euser.users[this.userId] = user;

    EditingUsers.upsert({_id:euser._id},euser);
  },


  addDoc:function(){
    var doc;

    if (!this.userId){ return; } // no user logged in return
    else{
      doc={owner : this.userId, createdOn : new Date(), title : "my new document"};
    }

    var id=Documents.insert(doc);
    console.log("addDoc method: got the id : "+id);
    return id;
  },

  updateDocPrivacy:function(doc){
    
    if (!doc){ return; } // not valid doc
    else{
     var realDoc= Documents.findOne({_id:doc._id, owner:this.userId});
     if(realDoc){
        realDoc.isPrivate=doc.isPrivate;
        Documents.update({_id:doc._id},realDoc);
     }
    }
  }


});


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
