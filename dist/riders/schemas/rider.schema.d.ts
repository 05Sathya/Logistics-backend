import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
export type RiderDocument = Rider & Document;
export declare class Rider {
    user: User;
    status: string;
    activeOrders: number;
    totalDelivered: number;
    totalFailed: number;
    avgDeliveryTime: number;
}
export declare const RiderSchema: import("mongoose").Schema<Rider, import("mongoose").Model<Rider, any, any, any, any, any, Rider>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Rider, Document<unknown, {}, Rider, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Rider & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    user?: import("mongoose").SchemaDefinitionProperty<User, Rider, Document<unknown, {}, Rider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Rider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, Rider, Document<unknown, {}, Rider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Rider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    activeOrders?: import("mongoose").SchemaDefinitionProperty<number, Rider, Document<unknown, {}, Rider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Rider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    totalDelivered?: import("mongoose").SchemaDefinitionProperty<number, Rider, Document<unknown, {}, Rider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Rider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    totalFailed?: import("mongoose").SchemaDefinitionProperty<number, Rider, Document<unknown, {}, Rider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Rider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    avgDeliveryTime?: import("mongoose").SchemaDefinitionProperty<number, Rider, Document<unknown, {}, Rider, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Rider & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Rider>;
