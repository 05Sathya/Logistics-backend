import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    findOne(email: string): Promise<UserDocument | null>;
    create(user: Partial<User>): Promise<UserDocument>;
    findClients(): Promise<UserDocument[]>;
}
