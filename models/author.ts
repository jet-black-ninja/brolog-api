import mongoose, {Schema, Document} from 'mongoose';

export interface IAuthor{
    username:string;
    password:string;
}

export interface IAuthorModel extends IAuthor, Document{};

const AuthorSchema = new Schema<IAuthorModel>({
    username: {type: String, required: true,unique: true},
    password: {type: String, required: true},
},{
    versionKey:false
});
export default mongoose.model<IAuthorModel>('Author',  AuthorSchema);