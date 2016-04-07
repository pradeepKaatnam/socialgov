angular.module('starter.controllers')

.controller('RegionListCtrl', function($scope, $http, RegionService) {
  RegionService.all(function(data) {
    $scope.regionList=data;
  });
})


.controller('RegionDetailCtrl', function($scope, $stateParams, RegionService, AccountService, $state, $ionicPopover, SettingsService, PictureManagerService, $ionicLoading) {
  $ionicLoading.show({
    template: "<p class='item-icon-left'>Loading community...<ion-spinner/></p>"
  });  
  $scope.user=Parse.User.current();  
  $scope.appMessage=SettingsService.getAppMessage();  
  $scope.canLogout=AccountService.isLogoutAllowed($scope.user);
  $scope.isAdmin=AccountService.canUpdateRegion();

  var residency=$stateParams.regionUniqueName;
  if(residency==null || residency.trim().length==0 || residency=="native") {
    residency=$scope.user.get("residency");
  }

  $scope.posterImages=[];
  RegionService.getRegion(residency).then(function(data) {
    $scope.region=data;
    $scope.regionSettings=RegionService.getRegionSettings(residency);              
    $scope.canControlSettings=AccountService.isFunctionalAdmin($scope.regionSettings, "Settings");        
    $scope.updateCoverPhotoIfAvailable($scope.region);
    $scope.posterImages=$scope.region.get("posterImages");
    $ionicLoading.hide();
  }, function(error) {
    $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to retrieve region information.");
    console.log("Error retrieving region " + JSON.stringify(error));
    $ionicLoading.hide();
  });  

  $scope.updateCoverPhoto=function() {
    RegionService.gotoCoverPhoto();
  };

  $scope.updateCoverPhotoIfAvailable=function(region) {
    if(PictureManagerService.getState().imageUrl!=null) {
      RegionService.updateCoverPhoto(region, PictureManagerService.getState().imageUrl);
      PictureManagerService.reset();
    } 
  };

})

.controller('RegionServiceContactsCtrl', function($scope, $stateParams, RegionService, AccountService, $state, $ionicPopover, $cordovaDialogs, SettingsService, $ionicLoading, ServiceContactService) {  
  $scope.appMessage=SettingsService.getAppMessage();
  $ionicLoading.show({
    template: "<p class='item-icon-left'>Loading service contacts...<ion-spinner/></p>"
  });  
  // $scope.personalServiceContacts=null;
  ServiceContactService.getServiceContacts($stateParams.regionUniqueName).then(function(serviceContacts){
    console.log("Received : " + JSON.stringify(serviceContacts));
    if(serviceContacts!=null && serviceContacts.length>0) {
      $scope.personalServiceContacts=serviceContacts;
    } else {
      $scope.controllerMessage=SettingsService.getControllerInfoMessage("Service recommendations are not made by your neighbors.");
    }
    $ionicLoading.hide();    
  }, function(error){
    console.log("Error retrieving service contacts " + JSON.stringify(error));
    $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to get your community service recommendations.");
    $ionicLoading.hide();
  });

  $scope.gotoAddServiceContact=function() {
    $state.go("tab.add-service-contact",{regionUniqueName: $stateParams.regionUniqueName});
  };

})

.controller('RegionServiceContactDetailCtrl', function($scope, $stateParams, RegionService, AccountService, $state, $ionicPopover, $cordovaDialogs, SettingsService, $ionicLoading, ServiceContactService) {  
  $scope.appMessage=SettingsService.getAppMessage();
  $ionicLoading.show({
    template: "<p class='item-icon-left'>Loading service contact...<ion-spinner/></p>"
  });    
  ServiceContactService.getServiceContactByObjectId(AccountService.getUserResidency(), $stateParams.serviceContactId).then(function(contact){
    $scope.serviceContact=contact;
    $ionicLoading.hide();
  },function(error) {
    console.log("Error retrieving service contacts " + JSON.stringify(error));
    $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to retrieve service contact.");
    $ionicLoading.hide();
  });  

  $scope.gotoEditServiceContact=function() {
    $state.go("tab.edit-service-contact",{serviceContactId: $scope.serviceContact.id});
  };

  $scope.deleteServiceContact=function() {
    $cordovaDialogs.confirm('Do you want to delete this service contact?', 'Delete Contact', ['Delete','Ignore']).then(function(buttonIndex) { 
      if(buttonIndex==1) {
        $scope.serviceContact.save({status: "D", deleteBy: AccountService.getUser()}, {
          success: function(updatedServiceContact) {
            SettingsService.setAppSuccessMessage("Service contact has been deleted successfully.");
            ServiceContactService.refreshServiceContacts(AccountService.getUserResidency());
            $state.go("tab.service",{regionUniqueName: AccountService.getUserResidency()});
          },
          error: function(serviceContact, error) {
            console.log("Error removing service contact " + JSON.stringify(error));
            $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to delete service contact at this time.");
          }
        });    
      } else {
        console.log("Canceled deletion of service contact");
      }
    });
  };

})

.controller('RegionEditServiceContactsCtrl', function($scope, $stateParams, RegionService, AccountService,SettingsService, $state, $ionicPopover, $cordovaDialogs, ServiceContactService) {    
  console.log("Entered into RegionEditServiceContactsCtrl " + $stateParams.serviceContactId);

  $scope.inputServiceContact={};
  ServiceContactService.getServiceContactByObjectId(AccountService.getUserResidency(), $stateParams.serviceContactId).then(function(contact){
      $scope.serviceContact=contact;
      $scope.inputServiceContact.type=$scope.serviceContact.get("type");
      $scope.inputServiceContact.serviceName=$scope.serviceContact.get("serviceName");
      $scope.inputServiceContact.servicePhoneNumber=$scope.serviceContact.get("servicePhoneNumber");
      $scope.inputServiceContact.serviceAddressLine1=$scope.serviceContact.get("serviceAddressLine1");
      $scope.inputServiceContact.serviceAddressLine2=$scope.serviceContact.get("serviceAddressLine2");
      $scope.inputServiceContact.otherCategoryName=$scope.serviceContact.get("otherCategoryName");
    },function(error) {
      console.log("Error retrieving service contacts " + JSON.stringify(error));
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to retrieve service contact for edit.");
    });  

  $scope.submit=function(){
    if($scope.inputServiceContact.type=="Other" && ($scope.inputServiceContact.otherCategoryName==null || $scope.inputServiceContact.otherCategoryName.length<1)) {
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Please enter category name.");
      return;      
    } else {
      $scope.serviceContact.set("otherCategoryName", $scope.inputServiceContact.otherCategoryName);
    }

    if($scope.inputServiceContact.serviceName==null || $scope.inputServiceContact.serviceName.length==0) {
      console.log("Service name is not here");
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Please enter service provider name.");
      return;
    } else {
      $scope.inputServiceContact.serviceName=$scope.inputServiceContact.serviceName.capitalizeFirstLetter();
      $scope.serviceContact.set("serviceName", $scope.inputServiceContact.serviceName);
    }

    if($scope.inputServiceContact.servicePhoneNumber==null || $scope.inputServiceContact.servicePhoneNumber.length==0) {
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Please enter service provider phone number.");
      return;
    } else {
      $scope.serviceContact.set("servicePhoneNumber", $scope.inputServiceContact.servicePhoneNumber);
    }

    $scope.serviceContact.set("serviceAddressLine1", $scope.inputServiceContact.serviceAddressLine1);
    $scope.serviceContact.set("serviceAddressLine2", $scope.inputServiceContact.serviceAddressLine2);

    $scope.serviceContact.save().then(function(serviceContact) {
        SettingsService.setAppSuccessMessage("Service contact has been updated.");
        ServiceContactService.refreshServiceContacts(AccountService.getUserResidency());
        $state.go("tab.service-contact-detail",{serviceContactId: $scope.serviceContact.id});
      },function(serviceContact, error) {
        $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to add this service contact.");
        console.log("Error adding service contact " + JSON.stringify(error));
      });     
  };

  $scope.cancel=function(){
    $state.go("tab.service",{regionUniqueName: AccountService.getUserResidency()});
  };

})


.controller('AddServiceContactsCtrl', function($scope, $stateParams, RegionService, AccountService,SettingsService, $state, $ionicPopover, $cordovaDialogs, $ionicLoading, ServiceContactService) {  
  $scope.serviceContact={
    status: "A", 
    type: "Plumber", 
    user: AccountService.getUser(),
    region: AccountService.getUserResidency(),
    serviceName: null,
    servicePhoneNumber: null,
    serviceAddressLine1: null,
    serviceAddressLine2: null,
    otherCategoryName: null
  };

  $scope.submit=function() {
    if($scope.serviceContact.type=="Other" && ($scope.serviceContact.otherCategoryName==null || $scope.serviceContact.otherCategoryName.length<1)) {
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Please enter category name.");
      return;      
    } 

    if($scope.serviceContact.serviceName==null || $scope.serviceContact.serviceName.length==0) {
      console.log("Service name is not here");
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Please enter service provider name.");
      return;
    } else {
      $scope.serviceContact.serviceName=$scope.serviceContact.serviceName.capitalizeFirstLetter();
    }

    if($scope.serviceContact.servicePhoneNumber==null || $scope.serviceContact.servicePhoneNumber.length==0) {
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Please enter service provider phone number.");
      return;
    }

    $ionicLoading.show({
      template: "<p class='item-icon-left'>Adding service contact...<ion-spinner/></p>"
    });  
    ServiceContactService.addServiceContact($scope.serviceContact).then(function(newServiceContact) {
      SettingsService.setAppSuccessMessage("Service contact has been added.")
      ServiceContactService.refreshServiceContacts(AccountService.getUserResidency());
      $ionicLoading.hide();
      $state.go("tab.service",{regionUniqueName: AccountService.getUser().get('residency')});      
    }, function(error) {
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to add this service contact.");
      console.log("Error adding service contact " + JSON.stringify(error));
      $ionicLoading.hide();
    });     
  };
  
  $scope.cancel=function(){
    $state.go("tab.service",{regionUniqueName: AccountService.getUserResidency()});
  };

})

.controller('RegionLegisDetailCtrl', function($scope, $stateParams, RegionService, AccountService, $state, $ionicPopover, $cordovaDialogs) {
  
  $scope.regions=RegionService.getRegionListFromCache();
  $scope.canUpdateRegion=AccountService.canUpdateRegion();
  
  $scope.deleteLegis=function(regionIndex, legisIndex){
    $cordovaDialogs.confirm('Do you want to delete this legislative contact?', 'Delete Contact', ['Delete','Cancel']).then(function(buttonIndex) { 
      if(buttonIndex==1) {
        $scope.legislatives=$scope.regions[regionIndex].get('legiRepList');
        $scope.legislatives.splice(legisIndex,1);
        for(var i=0; i <$scope.legislatives.length;i++){
          delete $scope.legislatives[i].$$hashKey;
        }

        $scope.regions[regionIndex].save(null, {
          success: function(region) {
            RegionService.updateRegion(region.get("uniqueName"), region);
            $scope.$apply(function(){
              console.log("delete is success");
            });
          },
          error: function(region, error) {
            console.log("Error in deleting the legislative " + error.message);
            $scope.deleteErrorMessage="Unable to process your delete request.";
          }
        });
      } else {
        console.log("Canceled removal of legislative delete");
      }
    });
  };

  $scope.editLegis=function(regionIndex, legislatureIndex) {
    $state.go("tab.editlegis",{regionUniqueName: $scope.regions[regionIndex].get('uniqueName'), legisIndex: legislatureIndex});    
  }

})

.controller('SelfLegisDetailCtrl', function($scope, $stateParams, RegionService, AccountService, $state, $ionicPopover, $cordovaDialogs, SettingsService) {
  $scope.canUpdateRegion=AccountService.canUpdateRegion();
  AccountService.getSelfLegisContacts($stateParams.regionUniqueName).then(function(legisList){
    $scope.legisList = legisList;
    if($scope.legisList==null || $scope.legisList.length==0) {
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Legislative board is not established in your community.");
      if($scope.canUpdateRegion==true) {
        $scope.ideaMessage=SettingsService.getControllerIdeaMessage("Looking to establish the board? Use controls above to manage titles and appoint residents on the board.");
      }      
    } else {
      RegionService.getRegion(AccountService.getUserResidency()).then(function(region) {
        var legiTitles=region.get('legiTitles');
        var sortedLegiList=[];
        for(var i=0;i<legiTitles.length;i++) {
          for(var j=0;j<$scope.legisList.length;j++) {
            if(legiTitles[i].title==$scope.legisList[j].get("title")) {
              sortedLegiList.push($scope.legisList[j]);
            }
          }
        }
        $scope.legisList=sortedLegiList;
      }, function(error) {
        $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to present your board in appropriate order.");
        LogService.log({type:"ERROR", message: "Unable to present your board in appropriate order " + JSON.stringify(error)}); 
      });    
    }
  },function(error){
    console.log("Unable to get legislative contacts " + JSON.stringify(error));
    $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to retrieve legislative contacts.");
  });

})

.controller('ManageLegislativeTitlesCtrl', function($scope, $interval, $stateParams, RegionService, AccountService, $state, $ionicPopover, $cordovaDialogs, SettingsService, $ionicListDelegate, $ionicLoading) {
  console.log("Controller ManageLegislativeTitlesCtrl");
  $scope.control={
    shuffleInitiated: false
  };

  RegionService.getRegion(AccountService.getUserResidency()).then(function(region) {
    $scope.region=region;
    if($scope.region.get('legiTitles')!=null) {
      $scope.legiTitleList=$scope.region.get('legiTitles');
    } else {
      $scope.legiTitleList=[];
    }    
  }, function(error) {
    $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to get legislative titles.");
    LogService.log({type:"ERROR", message: "Unable to get region to get legislative titles  " + JSON.stringify(error)}); 
  });    

  $scope.acceptNewTitle=function() {
    $cordovaDialogs.prompt('Enter new legislative title', 'Legislative Title', ['Submit','Cancel'])
    .then(function(result) {
      if(result.buttonIndex==1) {
        var input = result.input1;
        if(input!=null && input.trim().length>0) {
          var found=false;
          for(var i=0;i<$scope.legiTitleList.length;i++) {
            if($scope.legiTitleList[i].title==input) {
              found=true;
              break;
            }
          }
          if(found==false) {
            $scope.legiTitleList.push({title: input});
            $scope.saveLegiTitleUpdatesInRegion("Unable to save your legislative title order.");
          } else {
            $scope.controllerMessage=SettingsService.getControllerErrorMessage("Title already exists in the list");
          }
        }
      }
    });    
  };

  $scope.deleteTitle=function(index) {
    $scope.legiTitleList.splice(index, 1);
    $scope.saveLegiTitleUpdatesInRegion("Unable to delete title from the list.");    
    $ionicListDelegate.closeOptionButtons();
  };  

  $scope.shuffle=function(item, fromIndex, toIndex) {
    $scope.legiTitleList.splice(fromIndex, 1);
    $scope.legiTitleList.splice(toIndex, 0, item);
    $scope.saveLegiTitleUpdatesInRegion("Unable to order titles in the list.");    
  };

  $scope.saveLegiTitleUpdatesInRegion=function(errorMessage) {
    $ionicLoading.show({
      template: "<p class='item-icon-left'>Saving your action...<ion-spinner/></p>"
    });
    $scope.region.set("legiTitles",$scope.legiTitleList);
    $scope.region.save().then(function(region) {
      RegionService.updateRegion(region.get("uniqueName"), region);
      $ionicLoading.hide();
    }, function(error) {
      $scope.controllerMessage=SettingsService.getControllerErrorMessage(errorMessage);
      $interval(function(){
        $scope.controllerMessage=null;
      }, 5000, 1);      
      $ionicLoading.hide();
    });    
  }

})

.controller('BoardAppointmentCtrl', function($scope, $interval, $stateParams, RegionService, AccountService, $state, $ionicPopover, $cordovaDialogs, SettingsService, $ionicListDelegate, $ionicLoading, $ionicHistory) {
  console.log("Controller BoardAppointmentCtrl");
  $scope.legiTitleSelectedIndex=0;  
  $scope.legiTitleList=[];
  $scope.residentSelectedIndex=0;  
  $scope.residentList=[];

  $scope.tipMessage=SettingsService.getControllerIdeaMessage("Cant find the title on your board? Title management is available in legislatives section.");

  RegionService.getRegion(AccountService.getUserResidency()).then(function(region) {
    var legiTitles=region.get('legiTitles');
    for(var i=0;i<legiTitles.length;i++) {
      $scope.legiTitleList.push({
        label: legiTitles[i].title,
        value: legiTitles[i].title
      });
    }
  }, function(error) {
    $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to get legislative titles.");
    LogService.log({type:"ERROR", message: "Unable to get region to get legislative titles  " + JSON.stringify(error)}); 
  });    

  var pageTransData=SettingsService.getPageTransitionData();
  if(pageTransData!=null) {
    $scope.residentList.push({
      label: pageTransData.get("firstName") + " " + pageTransData.get("lastName"),
      value: pageTransData.get("firstName") + " " + pageTransData.get("lastName"),
      opt: pageTransData.get("homeNo"),
      id: pageTransData.id
    });
  } else {
    AccountService.getResidentsInCommunity(AccountService.getUserResidency()).then(function(residents){
      for(var i=0;i<residents.length;i++) {
        $scope.residentList.push({
          label: residents[i].get("firstName") + " " + residents[i].get("lastName"),
          value: residents[i].get("firstName") + " " + residents[i].get("lastName"),
          opt: residents[i].get("homeNo"),
          id: residents[i].id
        });
      }
    },function(error){
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to get residents in your community.");
      LogService.log({type:"ERROR", message: "Unable to get residents in community " + JSON.stringify(error)}); 
    });
  }

  $scope.$on('choiceSelectionComplete', function(e,data) {  
    if(data.choiceName=="legiTitles") {
      $scope.legiTitleSelectedIndex=data.selected;  
    } else if(data.choiceName=="residents") {
      $scope.residentSelectedIndex=data.selected;  
    }
  });

  $scope.openChoiceModalOfLegiTitles=function() {
    $scope.$parent.openChoiceModal("legiTitles", $scope.legiTitleList);
  };  

  $scope.openChoiceModalOfResidents=function() {
    $scope.$parent.openChoiceModal("residents", $scope.residentList);
  };

  $scope.appoint=function() {
    $ionicLoading.show({
      template: "<p class='item-icon-left'>Appointing on the board...<ion-spinner/></p>"
    });
    AccountService.updateRoleAndTitle($scope.residentList[$scope.residentSelectedIndex].id, "LEGI", 
      $scope.legiTitleList[$scope.legiTitleSelectedIndex].value).then(function(status) {
      SettingsService.setAppSuccessMessage("Resident is appointed on board.");
      $ionicLoading.hide();
      $ionicHistory.goBack(-1);      
    }, function(error) {
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to complete this appointment.");
      $ionicLoading.hide();
    });    
  };

  $scope.cancel=function() {
    $ionicHistory.goBack(-1);
  };

})

.controller('RegionOfficeDetailCtrl', function($scope, $stateParams, RegionService, AccountService, SettingsService, $state, $ionicPopover, $cordovaDialogs) {
  
  $scope.appMessage=SettingsService.getAppMessage();
  $scope.regions=RegionService.getRegionListFromCache();
  $scope.canUpdateRegion=AccountService.canUpdateRegion();
  $scope.deleteOffice=function(regionIndex, officeIndex){
    var offices=$scope.regions[regionIndex].get("execOffAddrList");
    offices.splice(officeIndex,1);
    for(var i=0; i < offices.length;i++) { 
      delete offices[i].$$hashKey;
      if(offices[i].contacts!=null) {
        for(var j=0; j < offices[i].contacts.length; j++){
          delete offices[i].contacts[j].$$hashKey;
        }
      }
    }
    $scope.regions[regionIndex].save(null, {
      success: function(region) {
        RegionService.updateRegion(region.get("uniqueName"), region);        
        $scope.$apply(function(){ // To refresh the view with the delete
          $scope.controllerMessage=SettingsService.getControllerSuccessMessage("Office has been deleted.");
          console.log("delete is success");
        });
      },
      error: function(region, error) {
        console.log("Error in deleting the office " + error.message);
        $scope.controllerMessage="Unable to process your delete request.";
      }
    });

  };

  $scope.openOfficePopover=function($event, regionIndex, officeIndex) {
    console.log("On popover : " + regionIndex + " " + officeIndex);
    $scope.canDeleteOffice=$scope.regions[regionIndex].get("execOffAddrList")[officeIndex].type=="DEFAULT"?false:true;
    $scope.officeIndex=officeIndex;
    $scope.regionIndex=regionIndex;
    $scope.popover.show($event);
  };

  $ionicPopover.fromTemplateUrl('templates/region/popover-edit-remove.html', {
    scope: $scope,
  }).then(function(popover) {
    $scope.popover = popover;
  });

  $scope.editThis=function() {
    $scope.popover.hide();
    $state.go("tab.editoffices",{regionUniqueName: $scope.regions[$scope.regionIndex].get('uniqueName'), officeIndex: $scope.officeIndex});    
  };

  $scope.addContact=function(){
    $scope.popover.hide();
    $state.go("tab.addcontacttooffice",{regionUniqueName: $scope.regions[$scope.regionIndex].get('uniqueName'), officeIndex: $scope.officeIndex});    
  }

  $scope.removeThis=function() {
    $scope.popover.hide();
    $cordovaDialogs.confirm('Do you want to delete this office?', 'Delete Office', ['Delete','Cancel']).then(function(buttonIndex) { 
      if(buttonIndex==1) {
        $scope.deleteOffice($scope.regionIndex, $scope.officeIndex);    
      } else {
        console.log("Canceled removal of activity");
      }
    });
  };

  $scope.deleteContact=function(regionIndex,officeIndex,contactIndex){
    var offices=$scope.regions[regionIndex].get("execOffAddrList");
    var contacts=offices[officeIndex].contacts;
    contacts.splice(contactIndex,1);
    for(var i=0; i < offices.length;i++) { 
      delete offices[i].$$hashKey;
      if(offices[i].contacts!=null) {
        for(var j=0; j < offices[i].contacts.length; j++){
          delete offices[i].contacts[j].$$hashKey;
        }
      }
    }
    $scope.regions[regionIndex].save(null, {
      success: function(region) {
        RegionService.updateRegion(region.get("uniqueName"), region);        
        $scope.$apply(function(){ // To refresh the view with the delete
          $scope.controllerMessage=SettingsService.getControllerSuccessMessage("Contact has been deleted.");
          console.log("delete is success");
        });
      },
      error: function(region, error) {
        console.log("Error in deleting the office " + error.message);
        $scope.controllerMessage="Unable to process your delete request.";
      }
    });
    console.log(JSON.stringify(contacts));
  };
})

.controller('AddContactToOfficeCtrl', function($scope, $stateParams, $state, RegionService, AccountService, SettingsService) {

  console.log("Entered int AddContactToOfficeCtrl");

  $scope.contact={name:"",title:"",phoneNum:"",email:""};
  var office=null,officeContacts=null;
  RegionService.getRegion($stateParams.regionUniqueName).then(function(data) {
    $scope.region=data;
    office=$scope.region.get('execOffAddrList')[$stateParams.officeIndex];
    officeContacts=office.contacts;
    if(officeContacts==undefined){
      officeContacts=[];
    }
  }, function(error) {
    $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to retrieve region information."); 
    console.log("Error retrieving region " + JSON.stringify(error));
  });  

  $scope.submit=function(){

    if($scope.contact.name==""){
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Please enter contact name.");
      return;
    }
    else if($scope.contact.title==""){
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Please enter contact title.");
      return; 
    }
    else if($scope.contact.phoneNum=="" || $scope.contact.phoneNum.length!=10){
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Please enter 10 digit phone number.");
      return; 
    }
    // else if($scope.contact.email!=null && $scope.contact.email.trim().length>0) {
    //   if($scope.contact.email.indexOf('@')==-1||$scope.contact.email.indexOf('.')==-1){
    //     $scope.controllerMessage=SettingsService.getControllerErrorMessage("Enter proper Email Id.");
    //     return; 
    //   }
    // }
    else {
      $scope.contact.name=$scope.contact.name.capitalizeFirstLetter();
      $scope.contact.title=$scope.contact.title.capitalizeFirstLetter();
      for(var i=0;i<$scope.region.get('execOffAddrList').length;i++){
        delete $scope.region.get('execOffAddrList')[i].$$hashKey;
        if($scope.region.get('execOffAddrList')[i].contacts!=undefined){
          for(var j=0;j<$scope.region.get('execOffAddrList')[i].contacts.length;j++){
            delete $scope.region.get('execOffAddrList')[i].contacts[j].$$hashKey;
          }
        }
      }
      delete office.$$hashKey;
      officeContacts.push($scope.contact);
      office["contacts"]=officeContacts;
      console.log(JSON.stringify($scope.region));
      $scope.region.save(null, {
          success: function(region) {
            RegionService.updateRegion(region.get("uniqueName"), region);
            SettingsService.setAppSuccessMessage("Contact has been added.");
            $state.go("tab.offices",{regionUniqueName: $stateParams.regionUniqueName});
          },
          error: function(region, error) {
            console.log("Error in saving the office details " + error.message);
            $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to add contact."); 
          }
      });
    }
  };
  $scope.cancel=function(){
    $state.go("tab.offices",{regionUniqueName: $stateParams.regionUniqueName});
  };
})


.controller('AddOfficeCtrl', function($scope, $stateParams, $state, RegionService, AccountService, SettingsService) {

  RegionService.getRegion($stateParams.regionUniqueName).then(function(data) {
    $scope.region=data;
    // execOffAddr=$scope.region.get("execOffAddrList");
  }, function(error) {
    $scope.controllerMessage=SettingsService.getControllerInfoMessage("Unable to retrieve region information."); 
    console.log("Error retrieving region " + JSON.stringify(error));
  });  

  // $scope.phoneNums={officeNum:"",execNum:""};
  // $scope.newExecAdminObj={title:"",name:"",phoneNumberList:[]};
  $scope.newOfficeObj={name:"", addressLine1:"", addressLine2:"", city:"", state:"", pincode:"",phoneNum:"",type:"CUSTOM"};
  $scope.submit=function(){
    if($scope.newOfficeObj.name==""){
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Please enter office name."); 
      return;
    }
    else if($scope.newOfficeObj.addressLine1==""){
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Please enter address line1."); 
      return;
    }
    else if($scope.newOfficeObj.city==""){
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Please enter city."); 
      return;
    }
    else if($scope.newOfficeObj.state==""){
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Please enter state."); 
      return;
    }
    else if($scope.newOfficeObj.pincode==""){
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Please enter pincode."); 
      return;
    }
    else if($scope.newOfficeObj.phoneNum=="" || $scope.newOfficeObj.phoneNum.length!=10){
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Phone number should be 10 characters."); 
      return; 
    }
    else{
        // if($scope.phoneNums.execNum!=""){
        //   var num=$scope.phoneNums.execNum.split(",");
        //   for(var i=0;i < num.length;i++)
        //     $scope.newExecAdminObj.phoneNumberList.push(num[i]);
        // }
        // console.log(JSON.stringify($scope.phoneNums));
        // if($scope.phoneNums.officeNum!=""){
        //   var num=$scope.phoneNums.officeNum.split(",");
        //   for(var i=0;i < num.length;i++)
        //     $scope.newOfficeObj.phoneNumberList.push(num[i]); 
        // }
        // $scope.newOfficeObj.execAdmin.push($scope.newExecAdminObj);
        // execOffAddr.push($scope.newOfficeObj);
        $scope.newOfficeObj.name=$scope.newOfficeObj.name.capitalizeFirstLetter();
        $scope.newOfficeObj.addressLine1=$scope.newOfficeObj.addressLine1.capitalizeFirstLetter();
        $scope.newOfficeObj.addressLine2=$scope.newOfficeObj.addressLine2.capitalizeFirstLetter();
        $scope.newOfficeObj.city=$scope.newOfficeObj.city.capitalizeFirstLetter();
        $scope.newOfficeObj.state=$scope.newOfficeObj.state.capitalizeFirstLetter();
        $scope.region.add("execOffAddrList",$scope.newOfficeObj);
        $scope.region.save(null, {
          success: function(region) {
            RegionService.updateRegion(region.get("uniqueName"), region);
            SettingsService.setAppSuccessMessage("New executive has been added.");
            $state.go("tab.offices",{regionUniqueName: $stateParams.regionUniqueName});
          },
          error: function(region, error) {
            console.log("Error in saving the office details " + error.message);
            $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to submit your add request."); 
          }
        });
    }
  };

  $scope.cancel=function(){
    $state.go("tab.offices",{regionUniqueName: $stateParams.regionUniqueName});
  };
})

.controller('EditOfficeDetailsCtrl', function($scope, $stateParams, RegionService, AccountService, SettingsService, $state) {

  // $scope.newExecObj={};
  // $scope.newOfficeObj={};
  RegionService.getRegion($stateParams.regionUniqueName).then(function(data) {
    $scope.region=data;
    $scope.newOfficeObj=$scope.region.get('execOffAddrList')[$stateParams.officeIndex];
  }, function(error) {
    $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to retrieve region information."); 
    console.log("Error retrieving region " + JSON.stringify(error));
  });

  $scope.submit=function(){
    // for(var i=0; i < $scope.newOfficeObj.execAdmin.length;i++){ 
    //   delete $scope.newOfficeObj.execAdmin[i].$$hashKey;
    // }
    var officesList=$scope.region.get('execOffAddrList');
    for(var i=0; i <officesList.length;i++){
      delete officesList[i].$$hashKey;
      if(officesList[i].contacts!=undefined){
        for(var j=0;j<officesList[i].contacts.length;j++) {
          delete officesList[i].contacts[j].$$hashKey;
        }
      }
    }

    // if(typeof($scope.newOfficeObj.phoneNumberList)=="string"){
    //   $scope.officeNum=$scope.newOfficeObj.phoneNumberList;
    //   $scope.newOfficeObj.phoneNumberList=[];
    //   var numbers=$scope.officeNum.split(",");
    //   for(var i=0; i < numbers.length;i++){
    //     $scope.newOfficeObj.phoneNumberList.push(numbers[i]);
    //   }
    // }
    // for(var i=0;i<$scope.newOfficeObj.execAdmin.length;i++){
    //     if(typeof($scope.newOfficeObj.execAdmin[i].phoneNumberList)=="string"){
    //       $scope.execNum=$scope.newOfficeObj.execAdmin[i].phoneNumberList;
    //       $scope.newOfficeObj.execAdmin[i].phoneNumberList=[];      
    //       var numbers=$scope.execNum.split(",");
    //       for(var j=0;j < numbers.length;j++){
    //         $scope.newOfficeObj.execAdmin[i].phoneNumberList.push(numbers[j]);
    //       }
    //     }
    // }
    $scope.region.save(null, {
        success: function(region) {
          console.log("edit is success " + JSON.stringify(region));          
          RegionService.updateRegion(region.get("uniqueName"), region);          
          SettingsService.setAppSuccessMessage("Office has been updated.");
          $state.go("tab.offices",{regionUniqueName: $stateParams.regionUniqueName});          
        }
    });
  };

  $scope.cancel=function(){
    $state.go("tab.offices",{regionUniqueName: $stateParams.regionUniqueName});
  };

})

.controller('AddLegisCtrl', function($scope, $stateParams, $state, RegionService, AccountService) {
  $scope.legisErrorMessage=null;
  RegionService.getRegion($stateParams.regionUniqueName).then(function(data) {
    $scope.region=data;
  }, function(error) {
    $scope.legisErrorMessage="Unable to retrieve region information.";
    console.log("Error retrieving region " + JSON.stringify(error));
  });

  $scope.phoneNums={legisNums:""};
  $scope.newLegisObj={title:"", name:"", addressLine1:"", addressLine2:"", phoneNumberList:[]};
  $scope.submit=function(){
    if($scope.newLegisObj.title!="" && $scope.newLegisObj.name!=""){
        if($scope.phoneNums.legisNums!=""){
          var num=$scope.phoneNums.legisNums.split(",");
          for(var i=0;i < num.length;i++)
            $scope.newLegisObj.phoneNumberList.push(num[i]);
        }
        $scope.region.add("legiRepList",$scope.newLegisObj);        
        console.log("Legi representative list : " + JSON.stringify($scope.region.get("legiRepList")));
        for(var i=0; i <$scope.region.get('legiRepList').length;i++){
          delete $scope.region.get('legiRepList')[i].$$hashKey;
        }        
        $scope.region.save(null, {
          success: function(region) {
            RegionService.updateRegion(region.get("uniqueName"), region);
            $state.go("tab.legis",{regionUniqueName: AccountService.getUser().get('residency')});
          },
          error: function(region, error) {
            console.log("Error in saving the legislative details " + error.message);
            $scope.legisErrorMessage="Unable to add legislative contact.";
          }
        });
    }
    else {
      $scope.legisErrorMessage="Legislative name and title are mandatory";
    }
  };

  $scope.cancel=function(){
    $state.go("tab.legis",{regionUniqueName: AccountService.getUser().get('residency')});
  };
})

.controller('EditLegisDetailsCtrl', function($scope, $stateParams, RegionService, AccountService, $state) {

  var regionUniqueName=$stateParams.regionUniqueName;
  var legisIndex=$stateParams.legisIndex;

  RegionService.getRegion(regionUniqueName).then(function(data) {
    $scope.region=data;
    $scope.legisToBeEdited=$scope.region.get('legiRepList')[legisIndex];
  }, function(error) {
    $scope.legisErrorMessage="Unable to retrieve region information.";
    console.log("Error retrieving region " + JSON.stringify(error));
  });

  $scope.submit=function(){
    if(typeof($scope.legisToBeEdited.phoneNumberList)=="string"){
      $scope.legisNum=$scope.legisToBeEdited.phoneNumberList;
      $scope.legisToBeEdited.phoneNumberList=[];
      var numbers=$scope.legisNum.split(",");
      for(var i=0; i < numbers.length;i++){
        $scope.legisToBeEdited.phoneNumberList.push(numbers[i]);
      }
    }
    for(var i=0; i <$scope.region.get('legiRepList').length;i++){
      delete $scope.region.get('legiRepList')[i].$$hashKey;
    }

    console.log("Legi representative list : " + JSON.stringify($scope.region.get("legiRepList")));
    $scope.region.save(null, {
        success: function(region) {
          console.log("edit is success");
          RegionService.updateRegion(region.get("uniqueName"), region);
          $state.go("tab.legis",{regionUniqueName: AccountService.getUser().get('residency')});          
        },
        error: function(region, error) {
          console.log("Error in updating the legislative details " + error.message);
          $scope.legisErrorMessage="Unable to update legislative contact.";
        }
    });
  };

  $scope.cancel=function(){
    $state.go("tab.legis",{regionUniqueName: AccountService.getUser().get('residency')});
  };

})


.controller('RegionFinancialOverviewCtrl', function($scope, $stateParams, $state, AccountService, RegionService, RegionFinancialService, $ionicPopover, $cordovaDialogs) {
  RegionFinancialService.getRegionFinancials(RegionService.getRegionHierarchy()).then(function(financials) {
    if(financials.length==0) {
      $scope.finOverviewErrorMessage="Financial records not available in your region.";
    } else {
      // Divider here based on region
      $scope.financials=[];
      for(var i=0;i<financials.length;i++) {
        $scope.financials.push(financials[i].value);
      }
    }
  }, function(error) {
    console.log("Error retrieving region financials " + JSON.stringify(error));
    $scope.finOverviewErrorMessage="Unable to retrieve financial details.";
  });

  $scope.canUpdateRegion=AccountService.canUpdateRegion();  

  $scope.deleteFinancial=function(index){
    var financialRecord=$scope.financials[index];
    financialRecord.set("status","D");
    financialRecord.save();
    //TODO-delete this record from html view
  };

  $scope.openFinancialPopover=function($event, index, financialRecordId) {
    $scope.financialRecordId=financialRecordId;
    $scope.intendedRecord=index;
    console.log("object Id " + $scope.financialRecordId);
    $scope.popover.show($event);
  };

  $ionicPopover.fromTemplateUrl('templates/region/popover-edit-remove.html', {
    scope: $scope,
  }).then(function(popover) {
    $scope.popover = popover;
  });

  $scope.editThis=function() {
    $scope.popover.hide();
    $state.go("tab.editfinancial",{id: $scope.financialRecordId});    
  }

  $scope.removeThis=function() {
    $scope.popover.hide();
    $cordovaDialogs.confirm('Do you want to delete this financial detail?', 'Delete Contact', ['Delete','Cancel']).then(function(buttonIndex) { 
      if(buttonIndex==1) {
        $scope.deleteFinancial($scope.intendedRecord);
      } else {
        console.log("Canceled removal of financial delete");
      }
    });
  }

})

.controller('AddRegionFinancialOverviewCtrl', function($scope, $stateParams, AccountService, RegionService, $state) {
  
  $scope.addFinancialErrorMessage=null;         

  $scope.newFinancialObj = { year:"", revenue:"", expenses:"", regionUniqueName:$stateParams.regionUniqueName, regionExpenses:[], regionRevenue:[], status:"A" };
  $scope.regionExpRev={regExp:"", regRev:""};

  $scope.submit=function(){

    if($scope.newFinancialObj.year!="" && $scope.newFinancialObj.revenue!="" && $scope.newFinancialObj.expenses!=""){
      
      if($scope.regionExpRev.regExp!=""){
        var regExpLine = $scope.regionExpRev.regExp.split('\n');
        for(var i=0; i < regExpLine.length; i++){
          var regExpense = regExpLine[i].split(',');
          $scope.newFinancialObj.regionExpenses.push( {name:regExpense[0], amount:regExpense[1]} );
        }
      }

      if($scope.regionExpRev.regRev!=""){
        var regRevLine = $scope.regionExpRev.regRev.split('\n');
        for(var i=0; i < regRevLine.length; i++){
          var regRevenue = regRevLine[i].split(',');
          $scope.newFinancialObj.regionRevenue.push( {name:regRevenue[0], amount:regRevenue[1]} );
        }
      }

      var RegionFinancial = Parse.Object.extend("RegionFinancial");
      var regionFinancial = new RegionFinancial();
      regionFinancial.save($scope.newFinancialObj, {
        success: function(financials) {
          console.log(JSON.stringify(financials));
          $state.go("tab.finview",{regionUniqueName:$stateParams.regionUniqueName});          
        }
      });
    }
    else{
      $scope.addFinancialErrorMessage="Please provide year, revenue and expenses details.";
    }
  };

  $scope.cancel=function(){
    $state.go("tab.finview",{regionUniqueName:$stateParams.regionUniqueName});          
  };
})

.controller('EditRegionFinancialOverviewCtrl', function($scope, $stateParams, AccountService, RegionService, $state) {
  
  $scope.financial={};
  var RegionFinancial = Parse.Object.extend("RegionFinancial");
  var query = new Parse.Query(RegionFinancial);
  query.equalTo("objectId", $stateParams.id);
  query.find({
    success: function(financials) {
      $scope.$apply(function(){
        if(financials!=null && financials.length>0) {
          $scope.parseFinancial=financials[0];
          $scope.financial.year=financials[0].get('year');  
          $scope.financial.revenue=financials[0].get('revenue');  
          $scope.financial.expenses=financials[0].get('expenses');
          var regionExpenses=financials[0].get('regionExpenses');
          // console.log(regionExpenses);
          if(regionExpenses!=null){
            var detailedExpenses="";
            for(var i=0; i < regionExpenses.length;i++)
                detailedExpenses += (regionExpenses[i].name+','+regionExpenses[i].amount)+'\n';
            $scope.financial.regionExpenses = detailedExpenses;
            // console.log(detailedExpenses);
          }
          var regionRevenue=financials[0].get('regionRevenue');  
          if(regionRevenue!=null){
            var detailedRevenue="";
            for(var i=0;i<regionRevenue.length;i++)
                detailedRevenue += (regionRevenue[i].name+','+regionRevenue[i].amount)+'\n';
            $scope.financial.regionRevenue = detailedRevenue;
            console.log($scope.detailedRevenue);
          }
          $scope.financial.regionUniqueName=financials[0].get('regionUniqueName');  

          console.log(JSON.stringify($scope.financial));
        } else {
          $scope.finOverviewErrorMessage="No financial records available for your region.";    
        }
      });
    },
    error: function(error) {
      console.log("Error retrieving region financials " + JSON.stringify(error));
      $scope.finOverviewErrorMessage="Unable to load financial overview at this time.";
    }
  });
  
  $scope.editFinancialErrorMessage=null;

  $scope.save=function(){
    $scope.parseFinancial.set("year",$scope.financial.year);
    $scope.parseFinancial.set("revenue",$scope.financial.revenue);
    $scope.parseFinancial.set("expenses",$scope.financial.expenses);
    console.log($scope.financial.regionExpenses);
    if($scope.financial.regionExpenses!=null){
        var regionExpenses=[];
        var regExpLines = $scope.financial.regionExpenses.split('\n');
        if(regExpLines[regExpLines.length-1]==""){
          regExpLines.pop();
        }
        console.log(regExpLines);
        for(var i=0; i < regExpLines.length; i++){
          var regExpense = regExpLines[i].split(',');
          regionExpenses.push( {name:regExpense[0], amount:regExpense[1]} );
        }
        $scope.parseFinancial.set("regionExpenses",regionExpenses);
      }

    if($scope.financial.regionRevenue!=null){
      var regionRevenue=[];
      var regRevLines = $scope.financial.regionRevenue.split('\n');
      if(regRevLines[regRevLines.length-1]==""){
        regRevLines.pop();
      }
      console.log(regRevLines);
      for(var i=0; i < regRevLines.length; i++){
        var regRevenue = regRevLines[i].split(',');
        regionRevenue.push( {name:regRevenue[0], amount:regRevenue[1]} );
       }
      $scope.parseFinancial.set("regionRevenue",regionRevenue);
    }
    $scope.parseFinancial.save(null, {
        success: function(financials) {
          console.log(JSON.stringify(financials));
          $state.go("tab.finview",{regionUniqueName:$scope.financial.regionUniqueName});          
        }
      });
  };

  $scope.cancel=function(){
    $state.go("tab.finview",{regionUniqueName:$scope.financial.regionUniqueName});          
  };
})

.controller('RegionFinancialDetailsCtrl', function($scope, $stateParams, RegionService, RegionFinancialService) {
  $scope.pageTitle=$stateParams.reqDetails=="revenue"?"Revenue":"Expenses";
  var financials=RegionFinancialService.getRegionFinancialDetails($stateParams.regionUniqueName, $stateParams.year);
  if(financials!=null) {
    if($stateParams.reqDetails=="revenue") {
      if(financials.get("regionRevenue")!=null && financials.get("regionRevenue").length>0) {
        $scope.finLineItems=financials.get("regionRevenue");  
      } else {
        $scope.finDetailsErrorMessage="Revenue records showing line items not available for "+ $stateParams.year + " finanical year.";      
      }          
    } else {
      if(financials.get("regionExpenses")!=null && financials.get("regionExpenses").length>0) {
        $scope.finLineItems=financials.get("regionExpenses");
      } else {
        $scope.finDetailsErrorMessage="Expense records showing line items not available for "+ $stateParams.year + " finanical year.";      
      }
    }
    renderChart($scope.finLineItems);        
  } else {
    console.log("Error retrieving region financial details.");
    $scope.finDetailsErrorMessage="Unable to load financial details at this time.";    
  }

  $scope.isCategory=function(finItem) {
    if(finItem.amount=='CATEGORY') {
      return "item-divider";
    } else {
      return;
    }
  };   

  function renderChart(lineItems) {
    if(lineItems!=null) {
      // Render the graph
      var ctx = document.getElementById("expChart").getContext("2d");
      var myNewChart = new Chart(ctx).Pie(getChartData($scope.finLineItems), {    
          inGraphDataShow : true, 
          legend: true,
          inGraphDataAnglePosition : 2,
          inGraphDataRadiusPosition: 2,
          inGraphDataRotate : "inRadiusAxisRotateLabels",
          inGraphDataAlign : "center",
          inGraphDataVAlign : "middle",
          inGraphDataFontColor : "white",
          inGraphDataFontSize : 12,
          inGraphDataTmpl: "<%=v6+'%'%>"
     });
    } else {
      $scope.chartErrorMessage="Chart data not available";
    }
  }; 

  function getChartData(lineItems) {
    var chartData=[
      {color:"#F7464A"}, {color:"#46BFBD"}, {color:"#FDB45C"},
      {color:"#949FB1"}, {color:"#4D5360"}, {color:"#4BC459"}
    ];
    // Filter category items and make a copy not to impact showing of original list
    var sortedLineItems=[];
    for(var i=0;i<lineItems.length;i++) {
      if(lineItems[i].amount!="CATEGORY") {
        sortedLineItems.push(lineItems[i]);
      }
    }
    // Sort the array
    sortedLineItems.sort(function(a, b) {
      return parseFloat(b.amount) - parseFloat(a.amount);
    });    
    // Populate chart data based on sorted array 
    for(var i=0;i<chartData.length;i++) {
      if(i<sortedLineItems.length && i<chartData.length-1) {
        chartData[i].value=sortedLineItems[i].amount;
        if(sortedLineItems[i].name.length>20) {
          chartData[i].title=sortedLineItems[i].name.slice(0,20)       
        } else {
          chartData[i].title=sortedLineItems[i].name;
        }        
      } else if(i<sortedLineItems.length && i==chartData.length-1){
        // Preopare misc item
        var miscAmount=0.00;
        for(var j=i;j<sortedLineItems.length;j++) {
          miscAmount=parseFloat(miscAmount)+parseFloat(sortedLineItems[j].amount);
        }
        chartData[i].value=miscAmount;
        chartData[i].title="Misc";        
      } 
    }
    var finalChartData=[];
    for(var i=0;i<chartData.length;i++) {
      if(chartData[i].value!=null) {
        finalChartData.push(chartData[i]);
      }
    }
    // console.log(JSON.stringify(finalChartData));
    return finalChartData;
  };

})

.controller('ChangeDemoDetailsCtrl', function($scope, $state, $stateParams, RegionService, SettingsService) {
  $scope.user=Parse.User.current();
  $scope.regionSettings=RegionService.getRegionSettings($scope.user.get("residency"));      
  $scope.newDemoObj={};
  RegionService.getRegion($scope.user.get("residency")).then(function(region) {
    $scope.region=region;
    $scope.newDemoObj=$scope.region.get('demography');
  }, function(error) {
    $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to get demography details");
    console.log("Unable to get demography details to edit");
  });    

  $scope.submit=function(){
    $scope.region.set("demography",$scope.newDemoObj);
    $scope.region.save().then(function(region) {
          RegionService.updateRegion(region.get("uniqueName"), region);
          SettingsService.setAppSuccessMessage("Demography details updated.");
      }, function(error) {
        console.log("Error saving demograph details");
        $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to save demography details");
      });
    $state.go("tab.demo",{regionUniqueName:$scope.region.get('uniqueName')});
  };

  $scope.cancel=function(){
    $state.go("tab.demo",{regionUniqueName:$scope.region.get('uniqueName')});
  };
})

.controller('NeighborDetailCtrl', function($scope, $state, $interval, $stateParams,$cordovaDialogs, AccountService, SettingsService, NotificationService, $ionicActionSheet, $timeout, $cordovaClipboard, $ionicHistory) {
  console.log("Neighbor details controller " + $stateParams.userId);
  $scope.operatingUser=AccountService.getUser();
  $scope.appMessage=SettingsService.getAppMessage();    
  $scope.user=null;
  AccountService.getUserById($stateParams.userId).then(function(neighbor) {
    // console.log("Got the neighbor " + JSON.stringify(neighbor));

    $scope.user=neighbor;        
    $scope.isNeighborAdmin=AccountService.canOtherUserUpdateRegion($scope.user);
    $scope.$apply();
  }, function(error) {
    console.log("Unable to retrieve neighbor : " + JSON.stringify(error));
    $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unbale to retrieve neighbor information.");
  });
  $scope.isAdmin=AccountService.canUpdateRegion();  

  $scope.getRoleNameFromRoleCode=function(role) {
    return AccountService.getRoleNameFromRoleCode(role);
  };

  $scope.removeOnBoard=function() {
    AccountService.updateRoleAndTitle($scope.user.id, "CTZEN", null);
    SettingsService.setAppSuccessMessage("Resident has been removed from board.");
    $ionicHistory.goBack(-1);
    // $state.go("tab.neighbors");    
  };

  $scope.appointOnBoard=function() {
    SettingsService.setPageTransitionData($scope.user);
    $state.go("tab.board-appointment");
  };

  $scope.copyInvitationMessage=function() {
    var invitationMessage="You have been invited to OurBlock. Use invitation code, " + $scope.user.id + " to login to the service. Download app at http://tinyurl.com/jb9tfnr";    
    $cordovaClipboard.copy(invitationMessage).then(function () {
      $scope.copyStatusMessage=SettingsService.getControllerInfoMessage("Invitation message has been copied to clipboard.");
      $interval(function(){
        $scope.copyStatusMessage=null;
      }, 5000, 1);
    }, function () {
      $scope.copyStatusMessage=SettingsService.getControllerErrorMessage("Unable to copy invitation message to clipboard.");
    });
  };

  $scope.sendInvitationCode=function() {
    console.log("Sent invitation code");
    RegionService.getRegion(AccountService.getUserResidency()).then(function(region){
      NotificationService.sendInvitationCode($scope.user.id, $scope.user.get("username"), region.get("name"));              
      $scope.controllerMessage=SettingsService.getControllerInfoMessage("Invitation code has been sent to neighbor.");      
    }, function(error){
      LogService.log({type:"ERROR", message: "Unable to get region to send SMS 2 " + JSON.stringify(error)}); 
      NotificationService.sendInvitationCode($scope.user.id, $scope.user.get("username"), "");              
      $scope.controllerMessage=SettingsService.getControllerInfoMessage("Invitation code has been sent to neighbor.");            
    });            
  };

  $scope.blockUser=function() {
    $cordovaDialogs.confirm('Do you want to block this user?', 'Block User', ['Block','Cancel'])
    .then(function(buttonIndex) {      
      if(buttonIndex==1) {
         AccountService.flagUserAbusive($stateParams.userId); 
         $state.go("tab.neighbors");
      } else {
        console.log("Canceled blocking of user");
      }
    });
  };

})

.controller('NeighborListCtrl', function($scope, $state, $stateParams, AccountService, SettingsService, $ionicLoading) {
  $ionicLoading.show({
    template: "<p class='item-icon-left'>Listing your neighbors...<ion-spinner/></p>"
  });        
  $scope.appMessage=SettingsService.getAppMessage();    
  AccountService.getResidentsInCommunity(Parse.User.current().get("residency")).then(function(neighborList) {
    $scope.neighborList=neighborList;
    // TODO :: Filter blocked users from the list
    if($scope.neighborList!=null && $scope.neighborList.length<2) {
      $scope.controllerMessage=SettingsService.getControllerIdeaMessage("Start building your community by inviting other residents.");
    }
    $ionicLoading.hide();
  }, function(error) {
    $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to get neighbors details.");
    $ionicLoading.hide();
  });

})

.controller('AdminNeighborUpdateCtrl', function($scope, $state, $stateParams, SettingsService, LogService, AccountService, $cordovaContacts, NotificationService, RegionService) {
  console.log("Admin Neighbor Account update controller");
  $scope.inputUser={};
  $scope.countryList=COUNTRY_LIST;
  $scope.inputUser.country=$scope.countryList[0];        
  AccountService.getUserById($stateParams.userId).then(function(neighbor) {
    $scope.user=neighbor;
    $scope.inputUser.firstName=$scope.user.get("firstName");
    $scope.inputUser.lastName=$scope.user.get("lastName");
    $scope.inputUser.homeNo=$scope.user.get("homeNo");
    $scope.inputUser.userId=$scope.user.id;
    $scope.inputUser.phoneNum=$scope.user.get("phoneNum");
    $scope.inputUser.homeOwner=$scope.user.get("homeOwner");
    $scope.inputUser.country=AccountService.getCountryFromCountryList($scope.user.get("countryCode"), $scope.countryList);
    $scope.$apply();
  }, function(error) {
    console.log("Unable to retrieve neighbor : " + JSON.stringify(error));
    $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unbale to retrieve neighbor information.");
  });  
  $scope.regionSettings=RegionService.getRegionSettings(AccountService.getUserResidency());  

  $scope.update=function() {
    console.log("Update request " + JSON.stringify($scope.inputUser));

    if($scope.inputUser.firstName==null || $scope.inputUser.firstName.trim().length<=0) {
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Please enter first name.");
      return;
    } 

    if($scope.inputUser.lastName==null || $scope.inputUser.lastName.trim().length<=0) {
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Please enter last name.");
      return;
    }     
    
    if ($scope.inputUser.phoneNum!=null) {
      var formattedPhone = $scope.inputUser.phoneNum.replace(/[^0-9]/g, '');  

      if(formattedPhone.length != 10) { 
         $scope.controllerMessage=SettingsService.getControllerErrorMessage("Please enter 10 digit phone number");
         return;
      } else {
        $scope.inputUser.phoneNum=formattedPhone;
      }
    } else {
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Please enter phone number");
      return;
    }

    if($scope.regionSettings.supportHomeNumber==true) {
      if($scope.inputUser.homeNo==null || $scope.inputUser.homeNo.length<=0) {
        $scope.controllerMessage=SettingsService.getControllerErrorMessage("Please enter home, unit or apt number.");
        return;
      } else {
        $scope.inputUser.homeNo=$scope.inputUser.homeNo.trim().toUpperCase().replace(/[^0-9A-Z]/g, '');
      }
    }    

    AccountService.updateNeighborAccount($scope.inputUser, $scope.user).then(function(newUser) {
      SettingsService.setAppSuccessMessage("Neighbor information update is successful.");
      $state.go("tab.neighbor-detail", {userId: $scope.user.id});
    }, function(error) {
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to update neighbor information.");  
    });
  };
})

.controller('RegionSettingsCtrl', function($scope, $stateParams, RegionService, AccountService, $state, $ionicPopover, SettingsService) {
  $scope.user=Parse.User.current();  
  $scope.appMessage=SettingsService.getAppMessage();  
  $scope.isAdmin=AccountService.canUpdateRegion();
  $scope.settingsChanged=false;  

  var regionSettings=RegionService.getRegionSettings($stateParams.regionUniqueName);          
  console.log("Region settings : " + JSON.stringify(regionSettings));
  $scope.inputSettings={
    reserveVisibility: regionSettings.reserveVisibility=="OPEN"?true:false,
    activityModeration: regionSettings.activityModeration
  };

  $scope.whoControlFinancial=RegionService.getFunctionControllersFromRegionSettings(regionSettings, "Financial").convertToFlatString();  
  $scope.whoControlSettings=RegionService.getFunctionControllersFromRegionSettings(regionSettings, "Settings").convertToFlatString();  

  $scope.saveSettings=function() {
    RegionService.getRegion($scope.user.get("residency")).then(function(region) {
      var currentRegionSettings=region.get("settings");
      console.log("Current region settings : " + JSON.stringify(currentRegionSettings));

      currentRegionSettings.activityModeration=$scope.inputSettings.activityModeration;
      currentRegionSettings.reserveVisibility=$scope.inputSettings.reserveVisibility==true?"OPEN":"CLOSED";
      region.set("settings", currentRegionSettings);

      region.save().then(function(updatedRegion){
        console.log("Update region settings : " + JSON.stringify(updatedRegion.get("settings")));
        RegionService.updateRegion($scope.user.get("residency"), updatedRegion);
        SettingsService.setAppSuccessMessage("Settings have been saved.");
        $state.go("tab.region", {regionUniqueName: "native"});      
      }, function(error){
        $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to save settings.");
        console.log("Error updating region " + JSON.stringify(error));
      });
    }, function(error) {
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to find region to save settings.");
      console.log("Error retrieving region " + JSON.stringify(error));
    });    
  };

  $scope.notifySettingChanged=function() {
    $scope.settingsChanged=true;
  };

  $scope.updateCoverPhoto=function() {
    RegionService.gotoCoverPhoto();
  };

  $scope.updateFinancialManagers=function(functionName) {
    $state.go("tab.region-settings-function", {regionUniqueName: $stateParams.regionUniqueName, functionName: "Financial"});
  };

  $scope.updateSettingsManagers=function(functionName) {
    $state.go("tab.region-settings-function", {regionUniqueName: $stateParams.regionUniqueName, functionName: "Settings"});
  };

})

.controller('RegionSettingsFunctionCtrl', function($scope, $stateParams, RegionService, AccountService, $state, $ionicPopover, SettingsService) {
  $scope.settingsChanged=false;  
  $scope.functionName=$stateParams.functionName;
  var regionSettings=RegionService.getRegionSettings($stateParams.regionUniqueName);          
  // console.log("Region settings : " + JSON.stringify(regionSettings));
  var currentFunctionControls=RegionService.getFunctionControllersFromRegionSettings(regionSettings, $stateParams.functionName);
  
  RegionService.getRegion(AccountService.getUserResidency()).then(function(region) {
    var legiTitleList=region.get('legiTitles');
    $scope.roleList=[];  
    for(var i=0;i<legiTitleList.length;i++) {
      for(var j=0;j<currentFunctionControls.length;j++) {
        var roleAllowed=false;
        if(currentFunctionControls[j]==legiTitleList[i].title) {
          roleAllowed=true;
          break;
        }
      }
      $scope.roleList.push({
        name: legiTitleList[i].title,
        allowed: roleAllowed
      });              
    }
    console.log("Role list " + JSON.stringify($scope.roleList));
  }, function(error) {
    $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to get legislative titles.");
    LogService.log({type:"ERROR", message: "Unable to get legislative titles " + JSON.stringify(error)}); 
  });    

  $scope.saveSettings=function() {
    console.log("Selection of role list : " + JSON.stringify($scope.roleList));
    var whoIsControlling=[];
    for(var i=0;i<$scope.roleList.length;i++) {
      if($scope.roleList[i].allowed==true) {
        whoIsControlling.push($scope.roleList[i].name);
      }
    }

    console.log("Selected role list : " + JSON.stringify(whoIsControlling));

    if(whoIsControlling.length==0) {
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Select at least one role to control this functionality.");
      return;
    } else {
      RegionService.getRegion($stateParams.regionUniqueName).then(function(region) {
        var currentRegionSettings=region.get("settings");
        console.log("Current region settings : " + JSON.stringify(currentRegionSettings));
        if(currentRegionSettings.permissions!=null) {
          var updated=false;
          for(var i=0;i<currentRegionSettings.permissions.length;i++) {
            if(currentRegionSettings.permissions[i].functionName==$stateParams.functionName) {
              currentRegionSettings.permissions[i].allowedRoles=whoIsControlling;
              updated=true;
              break;
            } 
          }
          if(updated==false) {
            currentRegionSettings.permissions.push({
                functionName: $stateParams.functionName,
                allowedRoles: whoIsControlling
              });                       
          }
        } else {
          currentRegionSettings.permissions=[{
              functionName: $stateParams.functionName,
              allowedRoles: whoIsControlling
            }];           
        }
        region.set("settings", currentRegionSettings);

        region.save().then(function(updatedRegion){
          console.log("Update region settings : " + JSON.stringify(updatedRegion.get("settings")));
          RegionService.updateRegion($stateParams.regionUniqueName, updatedRegion);
          SettingsService.setAppSuccessMessage($stateParams.functionName + " controls have been changed.");
          $state.go("tab.region-settings", {regionUniqueName: $stateParams.regionUniqueName});      
        }, function(error){
          $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to save control settings.");
          console.log("Error updating region " + JSON.stringify(error));
        });
      }, function(error) {
        $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to find region to save settings.");
        console.log("Error retrieving region " + JSON.stringify(error));
      });    

    }
  };

  $scope.initiateSettingsChange=function() {
    $scope.settingsChanged=true;
  };

})

.controller('CommunityRulesCtrl', function($scope, $http, RegionService, SettingsService, AccountService) {
  console.log("Community rules controller");
  $scope.appMessage=SettingsService.getAppMessage();
  $scope.isAdmin=AccountService.canUpdateRegion();
  RegionService.getRegion(AccountService.getUserResidency()).then(function(region) {
    $scope.communityRules=region.get("communityRules");
    if($scope.communityRules==null || $scope.communityRules.length<=0) {
      $scope.controllerMessage=SettingsService.getControllerInfoMessage("Community rules and regulations have not been published for your community.");  
    }
  }, function(error) {
    $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to get community rules and regulations.");
  });  
})

.controller('UpdateCommunityRulesCtrl', function($scope, $state, $http, RegionService, SettingsService, $ionicHistory, AccountService) {
  console.log("Update community rules controller");
  $scope.input={ communityRules: "1. Do not play loud noises after 10 PM.\n\n2. Do not dry your clothes on the balcony."};
  RegionService.getRegion(AccountService.getUserResidency()).then(function(region) {
    if(region.get("communityRules")!=null && region.get("communityRules").length>0) {
      $scope.input.communityRules=region.get("communityRules");  
    }    
    $scope.region=region;
  }, function(error) {
    $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to get community rules and regulations.");
  });  

  $scope.updateCommunityRules=function() {
    if($scope.input.communityRules!=null && $scope.input.communityRules.length>0) {
      $scope.region.set("communityRules", $scope.input.communityRules);
      $scope.region.save().then(function(newRegion){
        RegionService.updateRegion(newRegion.get("uniqueName"), newRegion);
        SettingsService.setAppSuccessMessage("Community rules and regulations have been updated.");
        $state.go("tab.community-rules");
      }, function(error){
        $scope.controllerMessage=SettingsService.getControllerErrorMessage("Unable to update community rules and regulations.");
      });      
    } else {
      $scope.controllerMessage=SettingsService.getControllerErrorMessage("Please enter community rules and regulations.");
    }
  };

})


;
