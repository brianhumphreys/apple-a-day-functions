const functions = require('firebase-functions');

const app = require('express')();

const FBAuth = require('./util/fbAuth');

const { db } = require('./util/admin')

const { 
    getScream, 
    likeScream,
    unlikeScream,
    deleteScream,
    getAllScreams, 
    postOneScream, 
    commentOnScream,
    getScreamsFromUser
} = require('./handlers/screams');

const { 
    login, 
    signup, 
    uploadImage, 
    addUserDetails,
    getUserDetails,
    markNotificationRead,
    getAuthenticatedUser,
} = require('./handlers/users')


app.get('/screams', getAllScreams);
app.get('/scream/:screamId', getScream);
app.post('/scream', FBAuth, postOneScream);
app.delete('/scream/:screamId', FBAuth, deleteScream);
app.get('/scream/:screamId/like', FBAuth, likeScream);
app.get('/screams/profile', FBAuth, getScreamsFromUser);
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream);
app.post('/scream/:screamId/comment', FBAuth, commentOnScream);

app.post('/login', login);
app.post('/signup', signup);
app.get('/user/:handle', getUserDetails);
app.post('/user', FBAuth, addUserDetails);
app.post('/user/image', FBAuth, uploadImage);
app.get('/user', FBAuth, getAuthenticatedUser);
app.post('/notifications',FBAuth, markNotificationRead)


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.api = functions.https.onRequest(app);


exports.createNotificationOnLike = functions
.region('us-central1')
.firestore
.document('/likes/{id}')
.onCreate((snapshot) => {
    return db
    .doc(`/screams/${snapshot.data().screamId}`)
    .get()
    .then(doc => {
        if(
            doc.exists && 
            doc.data().userHandle !== snapshot.data().userHandle
        ) {
            return db.doc(`/notifications/${snapshot.id}`).set({
                createdAt: new Date().toISOString(),
                recipient: doc.data().userHandle,
                sender: snapshot.data().userHandle,
                type: 'like',
                read: false,
                screamId: doc.id
            });
        }
    })
    .catch(err => console.error(err))
})

exports.createNotificationOnComment = functions
  .region('us-central1')
  .firestore.document('comments/{id}')
  .onCreate((snapshot) => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists && 
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: 'comment',
            read: false,
            screamId: doc.id
          });
        }
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.deleteNotificationOnUnlike = functions
.region('us-central1')
.firestore
.document('likes/{id}')
.onDelete((snapshot) => {
    return db
    .doc(`/notifications/${snapshot.id}`)
    .delete()
    .catch(err => {
        console.error(err);
        return;
    })
})

exports.onUserImageChange = functions
.region('us-central1')
.firestore
.document('/users/{userId}')
.onUpdate((change) => {
    console.log(change.before.data());
    console.log(change.after.data());
    if(change.before.data().imageUrl !== change.after.data().imageUrl) {
        console.log('Image Changed');
        const batch = db.batch();
        return db.collection('screams').where('userHandle', '==', change.before.data().handle).get()
            .then((data) => {
                data.forEach(doc => {
                    const scream = db.doc(`/screams/${doc.id}`);
                    batch.update(scream, {imageUrl: change.after.data().imageUrl});
                })
                return batch.commit();
            })
    } else return true;
})

exports.onScreamDelete = functions
.region('us-central1')
.firestore.document('/screams/{screamId}')
.onDelete((snapshot, context) => {
    const screamId = context.params.screamId;
    console.log(screamId)
    const batch = db.batch();
    return db
        .collection('comments')
        .where('screamId', '==', screamId)
        .get()
        .then(data => {
            data.forEach(doc => {
                batch.delete(db.doc(`/comments/${doc.id}`));
            })
            return db
                .collection('likes')
                .where('screamId', '==', screamId)
                .get();
        })
        .then(data => {
            data.forEach(doc => {
                batch.delete(db.doc(`/likes/${doc.id}`));
            })
            return db
                .collection('notifications')
                .where('screamId', '==', screamId)
                .get();
        })
        .then(data => {
            data.forEach(doc => {
                batch.delete(db.doc(`/notifications/${doc.id}`));
            })
            return batch.commit();
        })
        .catch(err => console.error(err));
})