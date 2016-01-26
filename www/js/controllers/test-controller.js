angular.module('starter.controllers')

.controller('TestCtrl', function($scope, $ionicPopover, $ionicActionSheet, $timeout, NotificationService) {
  /////////////////// Test 1 : Working with select boxes
  $scope.colors = [
      {name:'black', shade:'dark'},
      {name:'white', shade:'light', notAnOption: true},
      {name:'red', shade:'dark'},
      {name:'blue', shade:'dark', notAnOption: true},
      {name:'yellow', shade:'light', notAnOption: false}
    ];
    // $scope.post={myColor:$scope.colors[2]};
    $scope.post={myColor:null};    
    // $scope.myColor = $scope.colors[2]; // red
    $scope.testColor=function() {
      alert(JSON.stringify($scope.post.myColor));
    };


  var template = '<ion-popover-view><ion-header-bar> <h1 class="title">My Popover Title</h1> </ion-header-bar> <ion-content> Hello! </ion-content></ion-popover-view>';

  $ionicPopover.fromTemplateUrl('templates/popover.html', {
    scope: $scope,
  }).then(function(popover) {
    $scope.popover = popover;
  });

  $scope.openPopover = function($event, option) {
    $scope.popover.show($event);
    $scope.optionId=option;
  };

  $scope.editThis=function() {
    $scope.popover.hide();
    alert("being edited " + $scope.optionId);
  }

  $scope.removeThis=function() {
    $scope.popover.hide();
    alert("being removed " + $scope.optionId);
  }

  $scope.openActionSheet=function(userType) {

var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: '<b>Share</b> This' },
       { text: 'Move' }
     ],
     destructiveText: 'Delete',
     titleText: 'Modify your album',
     cancelText: 'Cancel',
     cancel: function() {
          // add cancel code..
        },
     buttonClicked: function(index) {
       return true;
     }
   });

  $timeout(function() {
       hideSheet();
     }, 2000);


  }

  $scope.testActivityPushNotification=function() {
    var activityId="WT9t96kS4X";

    var users=["PM0VE24LmA", "Q797sqw1Md"];


    var userQuery = new Parse.Query(Parse.User);
    userQuery.equalTo("notifySetting", true);
    userQuery.containedIn("objectId", users);

    var Debate = Parse.Object.extend("Debate");
    var query = new Parse.Query(Debate);
    query.matchesQuery("user", userQuery);

    // var users=["PM0VE24LmA", "Q797sqw1Md"];
    // var userPointers=[];
    // for(var i=0;i<users.length;i++) {
    //   var userPointer={
    //     __type: "Pointer",
    //     className: "_User",
    //     objectId: users[i]
    //   };
    //   userPointers.push(userPointer);
    // }
    // query.containedIn('user', userPointers);

    query.find({
      success: function(results) {
        //alert("Response : " + JSON.stringify(results));
        alert("Response count : " + results.length);
      },
      error: function(error) {
        alert("Error : " + JSON.stringify(error));
      }
    })

    //var notifyUsers=["XdDgeUqpyY"]; 
    var notifyUsers=["PM0VE24LmA","Q797sqw1Md","RWOHlrbepU"];
    NotificationService.pushNotificationToUserList(notifyUsers, "Testing comment notifications");


  };
  ////////////////// Test 2 : Create object and retrieve

  // var Activity = Parse.Object.extend("Activity");
  // var activity=new Activity();
  // activity.id="dw7I1G2fuC";

  // var TestData = Parse.Object.extend("TestData");
  // var query = new Parse.Query(TestData);
  // query.equalTo("action", "support");
  // query.include("user");
  // query.descending("createdAt");
  // query.find({
  //   success: function(debates) {
  //     $scope.$apply(function(){
  //       if(debates!=null && debates.length>0) {
  //         console.log("Deabte notes : " + JSON.stringify(debates));
  //         $scope.debateList=debates;
  //       } else {
  //         console.log("No arguments found for activity ");
  //         $scope.debateList=[];
  //       }
  //     });
  //   },
  //   error: function(activity, error) {
  //     console.log("Error retrieving arguments of a debate " + error.message);
  //   }
  // });         

  // $scope.createEntry=function() {

  //   var Activity = Parse.Object.extend("Activity");
  //   var activityContent=new Activity();
  //   activityContent.id="dw7I1G2fuC";

  //  var testContent={action:"support", user: Parse.User.current(), activity:activityContent};

  //   var TestData = Parse.Object.extend("TestData");
  //   var testData = new TestData();
    
  //   testData.save(testContent, {
  //     success: function(content) {
  //       alert("Successfully created " + JSON.stringify(content));
  //     },
  //     error: function(content, error) {
  //       console.log("Error creating entry " + error.message);
  //     }
  //   });          

  // };

    $scope.getComplexChartData=function() {
    
    var data = [
{
    value : 3781464.00,
    color: "#D97041",
    title : "NMR Contract Salaries"
},
{
    value : 2880141.00,
    color: "#C7604C",
    title : "Hospital Staff Salaries"
},
{
    value : 732000.00,
    color: "#21323D",
    title : "Hospital maintenance"
},
{
    value : 462096.00,
    color: "#9D9B7F",
    title : "Power bill"
},
{
    value : 402008.00,
    color: "#7D4F6D",
    title : "Street lights"
},
{
    value : 329481.00,
    color: "#584A5E",
    title : "Misc"
}
];

var myoptions = { 
legend : true,
inGraphDataShow : true, 
inGraphDataAnglePosition : 2,
inGraphDataRadiusPosition: 2,
inGraphDataRotate : "inRadiusAxisRotateLabels",
inGraphDataAlign : "center",
inGraphDataVAlign : "middle",
inGraphDataFontColor : "white",
inGraphDataFontSize : 12,
inGraphDataTmpl: "<%=v6+'%'%>"
}  ;  


    var ctx = document.getElementById("expChart").getContext("2d");
    var myNewChart = new Chart(ctx).Pie(data, myoptions);
    // $scope.legend=myNewChart.generateLegend();
    // console.log($scope.legend);

  };

});