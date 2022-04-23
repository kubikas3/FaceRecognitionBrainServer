import { MongoClient, ObjectId } from "mongodb";
export default class databaseMongoDBHandler {
    constructor() {
        this.mongo = null;   //connection  
        this.mongodb = null;     //database
        this.mongodbCollection = null;     //collection
        this.mongodbDetectionsCollection = null;     //collection

        this.connect();
    }

    async connect() {
        if (!process?.env?.mongoConnectionString) {
            throw new Error("mongoDB config invalid");
        } 

        this.mongo = new MongoClient(process.env.mongoConnectionString);

        try{           
            await this.mongo.connect((err) => {            
                if (err) {
                    process.exit(0);
                }                         
            });
           
            this.mongodb = this.mongo.db("smartbrain");
            this.mongodbCollection = this.mongodb.collection('users');
            this.mongodbDetectionsCollection = this.mongodb.collection('image_detections');
        }
        catch(err) {
            console.error("mongoDB connection error", err);
            await this.mongo.close();
            throw Error("Database error");         
        }
    }

    getAllUsers(id) {                               
        return new Promise((getUsersResolve) => {
            try {                
                const query = {};
                const selectFields = {
                    "_id": 1,
                    "name": 1,
                    "email": 1,
                    "country": 1,
                    "entries": 1,
                    "joined": 1
                };
                
                this.mongodbCollection.find(query).project(selectFields).toArray((err, result) => {
                    if (err) {
                        console.log(err);                        
                    }
                    
                    if (err || !result || result.length === 0) {
                        getUsersResolve([]);
                    } else {
                        const returnArr = result;
                        returnArr.map((elem) => {
                            elem.id = elem._id;
                            return elem;
                        });
                        getUsersResolve(returnArr);
                    }                    
                  });               
            } 
            catch(err) {
                console.error("dbError", err);
                getUsersResolve(null);
            }             
        });                    
    }

    getUserById(id) {                        
        return new Promise((getUserByIdResolve) => {
            try {               
                const query = {
                    "_id": ObjectId(id)
                };

                const selectFields = {
                    "_id": 1,
                    "name": 1,
                    "email": 1,
                    "country": 1,
                    "entries": 1,
                    "joined": 1
                };
                
                this.mongodbCollection.find(query).project(selectFields).toArray((err, result) => {
                    if (err) {
                        console.log(err);                        
                    }
                    
                    if (err || !result || result.length === 0) {
                        getUserByIdResolve([]);
                    } else {
                        const returnObj = result[0];
                        returnObj.id = result[0]._id;
                        getUserByIdResolve(returnObj);
                    }                    
                  });               
            } 
            catch(err) {
                console.error("dbError", err);
                getUserByIdResolve(null);
            }             
        });                
    }

    getUserLogin(email) {                        
        return new Promise((getUserLoginResolve) => {
            try {                
                const query = {
                    "email": email
                };

                const selectFields = {
                    "_id": 1,
                    "name": 1,
                    "email": 1,
                    "hash": 1,
                    "entries": 1,
                    "joined": 1
                };
                
                this.mongodbCollection.find(query).project(selectFields).toArray((err, result) => {
                    if (err) {
                        console.log(err);                       
                    }
                    
                    if (err || !result || result.length === 0) {
                        getUserLoginResolve([]);
                    } else {
                        const returnObj = result[0];
                        returnObj.id = result[0]._id;
                        getUserLoginResolve(returnObj);
                    }                    
                  });               
            } 
            catch(err) {
                console.error("dbError", err);
                getUserLoginResolve(null);
            }             
        });                
    }

    _getUserData(id) {                        
        return new Promise((getUserDataResolve) => {
            try {               
                const query = {
                    "_id": ObjectId(id)
                };

                const selectFields = {
                    "_id": 1,
                    "name": 1,
                    "email": 1,
                    "country": 1,
                    "entries": 1,
                    "joined": 1
                };
                
                this.mongodbCollection.find(query).project(selectFields).toArray((err, result) => {
                    if (err) {
                        console.log(err);                        
                    }
                    
                    if (err || !result || result.length === 0) {
                        getUserDataResolve([]);
                    } else {
                        const returnObj = result[0];
                        returnObj.id = result[0]._id;
                        getUserDataResolve(returnObj);
                    }                    
                  });               
            } 
            catch(err) {
                console.error("dbError", err);
                getUserDataResolve(null);
            }             
        });                
    }    

    _getLatestImageDetection = (timestamp) => {
        return new Promise((getLatestImageDetectionResolve) => {
            try {                
                const query = {};
             
                if (timestamp) {
                    query.date = {"$gt": new Date(Number(timestamp))};
                }                

                const selectFields = {
                    "_id": 1,
                    "image_url": 1,
                    "user_id": 1,
                    "date": 1,
                    "detect_data": 1,
                    "detect_type": 1,
                    "detections": 1
                };
                
                this.mongodbDetectionsCollection.find(query)
                                                .project(selectFields)
                                                .sort({date: -1})
                                                .limit(1)
                                                .toArray((err, result) => {
                    if (err) {
                        console.log(err);                       
                    }
                    
                    if (err || !result || result.length === 0) {
                        getLatestImageDetectionResolve(null);
                    } else {                                            
                        getLatestImageDetectionResolve(result[0]);
                    }                    
                  });               
            } 
            catch(err) {
                console.error("dbError", err);
                getUserLoginResolve(null);
            }             
        });
    }

    async getLatestImage(timestamp) {          
        
        let latestImage = null;
        
        try {                        
            const latestImageData = await this._getLatestImageDetection(timestamp);        
            
            if (!latestImageData || !latestImageData.user_id) {
                throw "Not found";
            }

            const latestImageUserData = await this._getUserData(latestImageData.user_id); 

            latestImage = latestImageData;
            latestImage["user"] = latestImageUserData;
        } 
        catch(err) {            
            latestImage = null;
        }

        return new Promise((getImageResolve) => {
            getImageResolve(latestImage);         
        });               
    }    

    increaseUserEntries(id, imageURL, detectData) {                       
        return new Promise((updateEntriesResolve) => {
            try {           
                
                const updateConditions = {
                    "_id": ObjectId(id)
                };

                const updateObject = {
                    "$inc": {"entries": 1}                         
                };
                                
                //update the count for the user
                this.mongodbCollection.findOneAndUpdate(updateConditions, updateObject, { returnDocument: "after" }, (err, result) => {
                    if (err) {
                        console.log(err);
                        updateEntriesResolve(null);
                        return;
                    }

                    //upsert into detections collection        
                    const updatedEntries = result.value.entries;

                    const upsertDetectionConditionObject = {
                        "user_id": id,
                        "image_url": imageURL
                    };

                    const upsertDetectionUpdateObject = {
                        "$set": {
                            "date": new Date(),
                            "detect_type": "face",
                            "detect_data": detectData                          
                        },
                        "$inc": {detections: 1}
                    };
                              
                    this.mongodbDetectionsCollection.update(upsertDetectionConditionObject, upsertDetectionUpdateObject, {"upsert": true}, (err, result) => {
                        if (err) {
                            console.log(err);
                            updateEntriesResolve(null);
                            return;
                        }                      

                        updateEntriesResolve(updatedEntries);
                    });                                                          
                });                       
            } 
            catch(err) {
                console.error("dbError", err);
                updateEntriesResolve(null);
            }             
        }); 
    }

    insertUser(email, name, hashed_password, country) {       
        return new Promise((insertUserResolve) => {
            try {                
                const insertObject = {
                    "email": email,
                    "name": name,
                    "hash": hashed_password,
                    "country": country,
                    "entries": 0,                    
                    "joined": new Date()              
                };
                                
                this.mongodbCollection.insertOne(insertObject, (err, result) => {
                    if (err) {
                        console.log(err);
                        insertUserResolve(null);
                        return;
                    }
                    
                    const returnResult = {...insertObject};
                    delete returnResult["hash"];
                    returnResult["_id"] = result.insertedId;
                    returnResult["id"] = result.insertedId;
                    insertUserResolve(returnResult);
                });                       
            } 
            catch(err) {
                console.error("dbError", err);
                insertUserResolve(null);
            }             
        }); 
    }
}