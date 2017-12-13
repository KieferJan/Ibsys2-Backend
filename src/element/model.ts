import * as mongoose from "mongoose";


const xmlElementSchema = new mongoose.Schema({

    //Schema hier


    versionKey: false});



let Element  = module.exports= mongoose.model("Element", xmlElementSchema);


export = Element;

