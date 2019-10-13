const { db } = require('../util/admin');

exports.getAllScreams = (req, res) => {
    db
        .collection('screams')
        .orderBy('createdAt', 'desc')
        .get()
        .then(data => {
            let screams = [];
            data.forEach(doc => {
                screams.push({
                    screamId: doc.id,
                    ...doc.data()
                });
            })
            return res.json(screams);
        })
        .catch(err => console.error(err))
}


exports.postOneScream = (req, res) => {

    if(req.body.body.trim() == '') {
        return res.status(400).json({ body: 'body must not be empty'});
    }
    const newScream = {
        body: req.body.body,
        userHandle: req.user.handle,
        imageUrl: req.user.imageUrl,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0
    }
    db
    .collection('screams')
    .add(newScream)
    .then(doc => { 
        const screamResponse = {
            screamId: doc.id,
            ...newScream
        }
        res.json(screamResponse);
    })
    .catch(error => {
        res.status(500).json({error: 'something went wrong'});
        console.log(err);
    });
}

exports.getScream = (req, res) => {
    let screamData = {};
    db  
    .doc(`/screams/${req.params.screamId}`)
    .get()
    .then(doc => {
        if(!doc.exists) {
            return res.status(400).json({error: 'Scream not found'});
        }
        screamData = doc.data();
        screamData.screamId = doc.id;
        return db
            .collection('comments')
            .orderBy('createdAt', 'desc')
            .where('screamId', '==', req.params.screamId)
            .get();
    })
    .then(data => {
        screamData.comments = [];
        data.forEach((doc) => {
            screamData.comments.push(doc.data());
        })
        return res.json(screamData);
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({error: err.code});
    })
}

exports.commentOnScream = (req, res) => {
    if(req.body.body.trim() === '') return res.status(400).json({ comment: 'Must not be empty'});

    console.log(req);

    const newComment = {
        body: req.body.body,
        createdAt: new Date().toISOString(),
        screamId: req.params.screamId,
        userHandle: req.user.handle,
        imageUrl: req.user.imageUrl
    };

    db
    .doc(`/screams/${req.params.screamId}`)
    .get()
    .then(doc => {
        if(!doc.exists){
            return res.status(404).json({error: 'Scream does not exist'})
        }
        console.log("wowowowow: ", doc.data())
        return doc.ref.update({ commentCount: doc.data().commentCount+1 });
    })
    .then(() => {
        return db.collection('comments').add(newComment);
    })
    .then(() => {
        res.json(newComment);
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({error:'Something went wrong'});
    })
}

exports.likeScream = (req, res) => {
    const likeDocument = db
        .collection('likes')
        .where('userHandle', '==', req.user.handle)
        .where('screamId', '==', req.params.screamId)
        .limit(1);

    const screamDocument = db.doc(`/screams/${req.params.screamId}`);

    let screamData;
    screamDocument
        .get()
        .then(doc => {
            if(doc.exists) {
                screamData = doc.data();
                screamData.screamId = doc.id;
                return likeDocument.get();
            } else {
                return res.status(404).json({ error: 'Screa not found'});
            }
        })
        .then(data => {
            if(data.empty) {
                db.collection('likes').add({
                    userHandle: req.user.handle,
                    screamId: req.params.screamId
                })
                .then(() => {
                    screamData.likeCount++;
                    return screamDocument.update(screamData);
                })
                .then(() => {
                    return res.json(screamData);
                })
            } else {
                return res.status(400).json({error: 'Scream already liked.'});
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({error:err.code});
        })
}

exports.unlikeScream = (req, res) => {
    const likeDocument = db
        .collection('likes')
        .where('userHandle', '==', req.user.handle)
        .where('screamId', '==', req.params.screamId)
        .limit(1);

    const screamDocument = db.doc(`/screams/${req.params.screamId}`);

    let screamData;
    screamDocument
        .get()
        .then(doc => {
            if(doc.exists) {
                screamData = doc.data();
                screamData.screamId = doc.id;
                return likeDocument.get();
            } else {
                return res.status(404).json({ error: 'Scream not found'});
            }
        })
        .then(data => {
            if(data.empty) {
                return res.status(400).json({error: 'Scream not liked.'});
                
            } else {
                return db.doc(`/likes/${data.docs[0].id}`).delete()
                    .then(() => {
                        screamData.likeCount--;
                        return screamDocument.update({likeCount: screamData.likeCount });
                    })
                    .then(() => {
                        res.json(screamData);
                    })
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({error:err.code});
        })
}

exports.getScreamsFromUser = (req, res) => {
    db.collection('screams')
        .where('userHandle', '==', req.user.handle)
        .orderBy('createdAt', 'desc')
        .get()
        .then(data => {
            let screams = [];
            data.forEach(doc => {
                screams.push({
                    screamId: doc.id,
                    ...doc.data()
                })
            })
            return res.json(screams);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: err.code });
        })
}

exports.deleteCommentsForScream = (req, res) => {
    
}

exports.deleteScream = (req, res) => {
    const document = db.doc(`screams/${req.params.screamId}`);
    document.get()
        .then((doc) => {
            if(!doc.exists) {
                return res.status(400).json({ error: 'Scream not found' });
            }
            if(doc.data().userHandle !== req.user.handle) {
                return res.status(403).json({error: 'Unauthorized'});
            } else {
                return document.delete();
            }
        })
        .then(() => {
            res.json({ message: 'Message deleted successfully.'});
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: err.code });
        })
}