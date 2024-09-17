import mongoose ,{Schema, Document} from 'mongoose';

export interface ITag{
    name:string;
}

export interface ITagModel extends ITag, Document{}

const TagSchema:Schema = new Schema({
    name:{type:String, required:true},
},{
    versionKey:false,
})

export default mongoose.model<ITagModel>("Tag", TagSchema);