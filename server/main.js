
Meteor.startup(function () {
  // startup code that creates a document in case there isn't one yet. 
  if (!Documents.findOne()){// no documents yet!
      Documents.insert({title:"my new document"});
  }
});


Meteor.publish("documents", function (){
  return Documents.find({
    $or : [
      {isPrivate : {$ne : true}},
      {owner : this.userId} 
    ]})
});

Meteor.publish("editingUsers", function (){
  return EditingUsers.find();
});
