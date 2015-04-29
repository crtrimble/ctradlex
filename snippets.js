	db.collection('ctradlex').findOne({'_id':itemID}, function (err, updateRec2) {
		console.log("find by ID Item ID = " + updateRec2._id);

	});

	
//mongo.helper.toObjectID("5377821219f21e974150bacf") used to convert string to objectID