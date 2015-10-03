angular.module('starter.services', [])


.factory('RegionService', ['CacheFactory', '$q', function(CacheFactory, $q) {
  var regionHeirarchy=null;
  var regionCache;
  if (!CacheFactory.get('regionCache')) {
    regionCache = CacheFactory('regionCache', {
      maxAge: 24 * 60 * 60 * 1000, // 1 Day
      deleteOnExpire: 'none'
    });
  }

  return {
    getRegion: function(regionUniqueName) {
      var deferred = $q.defer();
      var cachedObjectInfo=regionCache.info(regionUniqueName);
      if(cachedObjectInfo!=null && !cachedObjectInfo.isExpired) {
        // console.log("Found hit " + JSON.stringify(regionCache.info()) + " Item info : " + JSON.stringify(cachedObjectInfo));
        deferred.resolve(regionCache.get(regionUniqueName));  
      } else {
        console.log("No hit, attempting to retrieve from parse " + regionUniqueName + " Info : " + JSON.stringify(cachedObjectInfo));
        var Region = Parse.Object.extend("Region");
        var query = new Parse.Query(Region);
        query.equalTo("uniqueName", regionUniqueName);
        query.find({      
          success: function(regions) {
            regionCache.remove(regionUniqueName);
            regionCache.put(regionUniqueName, regions[0]);          
            deferred.resolve(regions[0]);
          }, 
          error: function(error) {
            if(cachedObjectInfo!=null && cachedObjectInfo.isExpired) {
              console.log("Unable to refresh region hence passing cached one " + regionUniqueName + " " + JSON.stringify(error));
              deferred.resolve(regionCache.get(regionUniqueName));  
            } else {
              deferred.reject(error)
            }
          }
        }); 
      }
      return deferred.promise;
    },
    getLiteRegionList: function(selectQuery, value) {
      var Region = Parse.Object.extend("Region");
      var query = new Parse.Query(Region);
      query.select("name", "uniqueName", "parentRegion")
      query.ascending("name");
      if(selectQuery=="parent") {
        query.equalTo("parentRegion", value);  
      } else if(selectQuery=="regionType") {
        query.containedIn("type", value);        
      } else {
        query.equalTo("uniqueName", value);        
      }
      return query.find();       
    },
    initializeRegionCache: function(region) {
      regionHeirarchy=[region.get("uniqueName")];
      for(var i=0;i<region.get("parentRegion").length;i++) {
        regionHeirarchy.push(region.get("parentRegion")[i]);
      }
      console.log("Final region list for cache : " + JSON.stringify(requiredRegionList));
      var Region = Parse.Object.extend("Region");
      var query = new Parse.Query(Region);
      query.containedIn("uniqueName", regionHeirarchy);  
      query.find({
        success: function(data) {
          for(var i=0;i<data.length;i++) {
            regionCache.put(data[i].get("uniqueName"), data[i]);
          }
        },
        error: function(error) {
          console.log("Error while initializing the regionCache " + JSON.stringify(error));
        }
      });
    },
    getAllowedRegions: function(residency) {
      var residencyRegion=regionCache.get(residency);
      if(residencyRegion==null) {
        return [{id:residency, label:residency[0].toUpperCase()+residency.substring(1)}];
      } else {
        var regionHeirarchyList=residencyRegion.get("parentRegion");
        var allowedRegionList=[{id: residencyRegion.get("uniqueName"), label: residencyRegion.get("name")}];
        for(var i=0;i<regionHeirarchyList.length;i++) {
          var region=regionCache.get(regionHeirarchyList[i]);
          if(region!=null) {
            allowedRegionList.push({id: region.get("uniqueName"), label:region.get("name")});
          }
        }
        return allowedRegionList;        
      }
    },
    getRegionHierarchy: function() {
      if(regionHeirarchy==null) {
        this.getRegion(Parse.User.current().get('residency')).then(function(data) {
          regionHeirarchy=[data.get("uniqueName")];
          var parentRegionArray=data.get("parentRegion");
          for(var i=0;i<parentRegionArray.length;i++) {
            regionHeirarchy.push(parentRegionArray[i]);
          }
        }, function(error) {
          console.log("Unable to form region hierarchy");
        });
        return [Parse.User.current().get("residency")];  
      } else {
        return regionHeirarchy;
      }
    }
  };
}])

.factory('ActivityService', ['$http', 'AccountService', function($http, AccountService) {
  return {
    getAllowedActivities: function(role) {
      var allowedActivities=[
        {id:"IDEA", label:"Development Idea"}
      ];
      if(role!=null && role!="CTZEN") {
        allowedActivities.push({id:"NOTF", label:"Notification"});
      }
      return allowedActivities;
    },
    getActivityInAList: function(activityId, activityList) {
      for(var i=0;i<activityList.length;i++) {
        if(activityId==activityList[i].id) {
          return activityList[i];
        }
      }
      return activityList[0];
    },
    getMockData: function() {

      var User = Parse.Object.extend("User");
      var user = new User();
      user.set("firstName", "Suresh");
      user.set("lastName", "Pragada");
      user.set("title", "Civil Society");

      var Activity = Parse.Object.extend("Activity");

      var activity1 = new Activity();
      activity1.set("user", user);
      activity1.set("notifyMessage", "MLC Balisali Indira garu will be facilitating the techers on occasion of Teachers Day. This even will happen in Lutheran high school play ground at 6 PM on Monday.");
      activity1.set("createdAt", new Date());
      activity1.set("activityType", "NOTF");

      var activity2 = new Activity();
      activity2.set("user", user);
      activity2.set("notifyMessage", "MLC Balisali Indira garu will be facilitating the techers on occasion of Teachers Day. This even will happen in Lutheran high school play ground at 6 PM on Monday.");
      activity2.set("createdAt", new Date());
      activity2.set("activityType", "PBLM");

      return [activity1, activity2];
    },
    getActionCode: function(action) {
      if("support"==action) {
        return "S";
      } else if ("oppose"==action) {
        return "O";
      } else {
        return "N";
      }
    },
    getAction: function(actionCode) {
      if("S"==actionCode) {
        return "support";
      } else if ("O"==actionCode) {
        return "oppose";
      } else {
        return "neutral";
      }
    }
  };
}])

.factory('AccountService', ['CacheFactory', 'RegionService', function(CacheFactory, RegionService) {
    var roles=[
      {id:"LEGI", label:"Legislative", titles:[
        {id:"Sarpanch", label:"Sarpanch"},
        {id:"Vice President", label:"Vice President"}
      ]}, 
      {id:"EXEC", label:"Executive Officer", titles:[
        {id:"Secretary", label:"Secretary"}
      ]},
      {id:"JNLST", label:"Journalist", titles:[]}, 
      {id:"SOACT", label:"Social Activist", titles:[]},
      {id:"CTZEN", label:"Citizen"},
      {id:"SUADM", label:"Administrator"} 
    ];      

  var userLastRefreshTimeStamp=new Date().getTime();

  return {
    getRolesAllowedToChange: function() {
      return [roles[0], roles[1], roles[2], roles[3]];      
    },    
    getRegionsAllowedToPost: function(role, residency) {
      if(role=="CTZEN") {
        return [RegionService.getAllowedRegions(residency)[0]];
      } else {
        return RegionService.getAllowedRegions(residency);
      }
    },
    getRoleNameFromRoleCode: function(roleCode) {
      for(var i=0;i<roles.length;i++) {
        if(roles[i].id==roleCode) {
          return roles[i].label;
        }
      }
      return "Citizen";
    },
    isSuperAdmin: function(roleCode){
      if(roleCode=="SUADM"){
        return true;
      }else{
        return false;
      }
    },
    isCitizen: function(roleCode){
      if(roleCode==null || roleCode=="CTZEN"){
        return true;
      }else{
        return false;
      }
    },
    canUpdateRegion: function(){
      var user=Parse.User.current();
      if(user.get("role")=="JNLST" || user.get("role")=="SUADM" || user.get("role")=="SOACT"){
        return true;
      }else{
        return false;
      }
    },
    refreshUser: function() {
      if(new Date().getTime()-userLastRefreshTimeStamp>(24* 60 * 60*1000)) {
        userLastRefreshTimeStamp=new Date().getTime();
        Parse.User.current().fetch();
      }
    }
  };
}])


.factory('LogService', ['$http', function($http) {
  return {
    log: function(logObject) {
      var AuditLog = Parse.Object.extend("AuditLog");
      var auditLog = new AuditLog();
      logObject.username=Parse.User.current().get("username");
      auditLog.save(logObject, {
        success: function(logObject) {
          console.log("Successfully sent audit log")
        },
        error: function(logObject, error) {
          console.log("Error in sending audit log " + JSON.stringify(error));
        }
      });
    }
  };
}])

.factory('NotificationService', ['$http', function($http) {
  var PARSE_APPLICATION_KEY="kkpgMBxA7F9PgV6tjISEOWFbXvAgha9pXp7FWvWW";
  var PARSE_REST_API_KEY="EAz3Z0La6QiOA5XLQdJX8SRvvmCVfHdzyzJBFx1t";
  return {
    getInstallationByInstallationId: function(installationId, successCallback, errorCallback) {
      var paramsRequest={"where":{"objectId":installationId}};
      var req = {
       method: 'GET',
       url: 'https://api.parse.com/1/installations',
       headers: {
        'X-Parse-Application-Id': PARSE_APPLICATION_KEY,'X-Parse-REST-API-Key': PARSE_REST_API_KEY
       },
       params: paramsRequest
      };
      $http(req).then(successCallback, errorCallback);
    },
    getInstallationByUserId: function(userObjectId, successCallback, errorCallback) {
      Parse.Cloud.run('getInstallationByUserId', {"userObjectId": userObjectId}, {
        success: successCallback, 
        error: errorCallback
      });
    },   
    pushNotification: function(residency, message, successCallback, errorCallback) {
      Parse.Cloud.run('pushNotification', {"residency": residency, "message":message}, {
        success: successCallback, 
        error: errorCallback
      });
    },         
    addAndroidInstallation: function(userObjectId, deviceToken, channelArray, successCallback, errorCallback) {
      var req = {
       method: 'POST',
       url: 'https://api.parse.com/1/installations',
       headers: {
        'X-Parse-Application-Id': PARSE_APPLICATION_KEY,'X-Parse-REST-API-Key': PARSE_REST_API_KEY
       },
       data: {
          "deviceType": "android",
          "pushType": "gcm",
          "deviceToken": deviceToken,
          "GCMSenderId": "927589908829",
          "channels": channelArray,
          "user": {
            "__type": "Pointer",
            "className": "_User",
            "objectId": userObjectId
          }
        }
      };
      $http(req).then(successCallback, errorCallback);
    }
  };
}])
;
