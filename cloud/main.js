
// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
});

Parse.Cloud.define("validateDigits", function(request, response) {
  
	Parse.Cloud.httpRequest({
	  url: request.params.digitsUrl,
	  headers: {
	    'Authorization': request.params.authToken
	  },
	  success: function(httpResponse) {
	  	response.success(httpResponse.data);	
	  },
	  error: function(httpResponse) {
	  	response.error('Request failed with response code : ' + httpResponse.status);	
	  }
	});

});

Parse.Cloud.define("getInstallationByUserId", function(request, response) {
  // Create a Pointer to this user based on their object id
  var user = new Parse.User();
  user.id = request.params.userObjectId;

  // Need the Master Key to update Installations
  Parse.Cloud.useMasterKey();
  
  // A user might have more than one Installation
  var query = new Parse.Query(Parse.Installation);
  query.equalTo("user", user); // Match Installations with a pointer to this User
  query.find({
    success: function(installations) {
    	response.success(installations);
    },
    error: function(error) {
      console.error(error);
      response.error("An error occurred while looking up this user's installations.")
    }
  });
});

Parse.Cloud.define("pushNotification", function(request, response) {
  
	var userQuery = new Parse.Query(Parse.User);
	userQuery.equalTo("notifySetting", true);
	// userQuery.equalTo("residency", request.params.residency);

	// Find devices associated with these users
	var pushQuery = new Parse.Query(Parse.Installation);
	pushQuery.matchesQuery('user', userQuery);
	pushQuery.equalTo("channels", request.params.residency);

	Parse.Push.send({
	  where: pushQuery,
	  data: {
	    alert: request.params.message 
	  }
	}, {
	  success: function() {
	  	console.log("Push is successful " + request.params.residency + " Message : " + request.params.message);
	    response.success("Push is successful");
	  },
	  error: function(error) {
	    console.log("Push is failed :  " + JSON.stringify(error));
	    response.error(error);
	  }
	});

});

Parse.Cloud.define("pushNotificationToUserList", function(request, response) {
  
  	console.log("pushNotificationToUserList : " + JSON.stringify(request.params.userList));

    var userQuery = new Parse.Query(Parse.User);
    userQuery.equalTo("notifySetting", true);
    userQuery.containedIn("objectId", request.params.userList);	

	// Find devices associated with these users
	var pushQuery = new Parse.Query(Parse.Installation);
	pushQuery.matchesQuery('user', userQuery);

	Parse.Push.send({
	  where: pushQuery,
	  data: {
	    alert: request.params.message 
	  }
	}, {
	  success: function() {
	  	console.log("Push is successful to user list " + request.params.userList + " Message : " + request.params.message);
	    response.success("Push is successful");
	  },
	  error: function(error) {
	    console.log("Push is failed :  " + JSON.stringify(error));
	    response.error(error);
	  }
	});

});


Parse.Cloud.define("modifyUser", function(request, response) {
  if (!request.user) {
    response.error("Must be signed in to call this Cloud Function.");
    return;
  } else {
  	// Perform any authroization whether this user is admin
  }

  Parse.Cloud.useMasterKey();

  var query = new Parse.Query(Parse.User);
  query.equalTo("objectId", request.params.targetUserId);
  // Get the first user which matches the above constraints.
  query.first({
    success: function(anotherUser) {
      anotherUser.set(request.params.userObjectKey, request.params.userObjectValue);
      // Save the user.
      anotherUser.save(null, {
        success: function(anotherUser) {
          response.success("Successfully updated user.");
        },
        error: function(anotherUser, error) {
          response.error("Could not save changes to user.");
        }
      });
    },
    error: function(error) {
      response.error("Could not find user.");
    }
  });
});