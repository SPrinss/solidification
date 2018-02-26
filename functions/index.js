// Copyright 2017 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.hourly_job =
  functions.pubsub.topic('hourly-tick').onPublish((event) => {

    const getHourlyConsolidationUsersPromise = admin.database().ref(`/hourly-consolidation-users/`).once('value');
    
  return Promise.all([getHourlyConsolidationUsersPromise]).then(results => {
    const usersSnapshot = results[0];
    const usersIdsObjects = usersSnapshot.val();
    const usersIdsArray = Object.keys(usersIdsObjects);

    usersIdsArray.forEach(function(userId) {
      let getDeviceTokensPromise = admin.database().ref(`/users/${userId}/token`).once('value');
      let getMemoriesObjectPromise = admin.database().ref(`/memories/${userId}`).once('value');
      return Promise.all([getDeviceTokensPromise, getMemoriesObjectPromise]).then(results => {
        let tokensSnapshot = results[0];
        let userMemories = results[1].val();
        let userMemoriesArray = Object.keys(userMemories);

        var randomIndex = Math.floor(Math.random() * (userMemoriesArray.length - 0 + 1)) + 0;
        var memoryId = userMemoriesArray[randomIndex];
        console.log('memoryId', memoryId, 'userMemoriesArray', userMemoriesArray)
        
        let getMemoryObjectPromise = admin.database().ref(`/memories/${userId}/${memoryId}`).once('value');

        return Promise.all([getMemoryObjectPromise]).then(results => {
          var memory = results[0].val();
          console.log('results', results[0])

          const payload = {
            notification: {
              title: 'Remind this!',
              body: `${memory}`,
              click_action: `https://solidification-c323c.firebaseapp.com/memory/${memoryId}`
            }
          };
          const tokens = Object.keys(tokensSnapshot.val());
          
          // Send notifications to all tokens.
          return admin.messaging().sendToDevice(tokens, payload).then(response => {
            // For each message check if there was an error.
            const tokensToRemove = [];
            response.results.forEach((result, index) => {
              const error = result.error;
              if (error) {
                console.error('Failure sending notification to', tokens[index], error);
                // Cleanup the tokens who are not registered anymore.
                if (error.code === 'messaging/invalid-registration-token' ||
                    error.code === 'messaging/registration-token-not-registered') {
                  tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
                }
              }
            });
            return Promise.all(tokensToRemove);          
          });
          return Promise.all();          
        });        
        return Promise.all();
      });
    });
  });
});


exports.daily_job =
functions.pubsub.topic('daily-tick').onPublish((event) => {

  const getHourlyConsolidationUsersPromise = admin.database().ref(`/daily-consolidation-users/`).once('value');
  
return Promise.all([getHourlyConsolidationUsersPromise]).then(results => {
  const usersSnapshot = results[0];
  const usersIdsObjects = usersSnapshot.val();
  const usersIdsArray = Object.keys(usersIdsObjects);

  usersIdsArray.forEach(function(userId) {
    let getDeviceTokensPromise = admin.database().ref(`/users/${userId}/token`).once('value');
    let getMemoriesObjectPromise = admin.database().ref(`/memories/${userId}`).once('value');
    return Promise.all([getDeviceTokensPromise, getMemoriesObjectPromise]).then(results => {
      let tokensSnapshot = results[0];
      let userMemories = results[1].val();
      let userMemoriesArray = Object.keys(userMemories);

      var randomIndex = Math.floor(Math.random() * (userMemoriesArray.length - 0 + 1)) + 0;
      var memoryId = userMemoriesArray[randomIndex];
      console.log('memoryId', memoryId, 'userMemoriesArray', userMemoriesArray)
      
      let getMemoryObjectPromise = admin.database().ref(`/memories/${userId}/${memoryId}`).once('value');

      return Promise.all([getMemoryObjectPromise]).then(results => {
        var memory = results[0].val();
        console.log('results', results[0])

        const payload = {
          notification: {
            title: 'Remind this!',
            body: `${memory}`,
            click_action: `https://solidification-c323c.firebaseapp.com/memory/${memoryId}`            
          }
        };
        const tokens = Object.keys(tokensSnapshot.val());
        
        // Send notifications to all tokens.
        return admin.messaging().sendToDevice(tokens, payload).then(response => {
          // For each message check if there was an error.
          const tokensToRemove = [];
          response.results.forEach((result, index) => {
            const error = result.error;
            if (error) {
              console.error('Failure sending notification to', tokens[index], error);
              // Cleanup the tokens who are not registered anymore.
              if (error.code === 'messaging/invalid-registration-token' ||
                  error.code === 'messaging/registration-token-not-registered') {
                tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
              }
            }
          });
          return Promise.all(tokensToRemove);          
        });
        return Promise.all();          
      });        
      return Promise.all();
    });
  });
});
});

