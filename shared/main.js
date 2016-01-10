Meteor.methods({
  addEditingUser:function(docid){
    var doc, user, euser;

    doc = Documents.findOne({_id:docid});

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
