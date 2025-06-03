import mongoose, {Schema} from "mongoose";


const subscriptionSchema = new Schema({
    subscriber : {
        type: Schema.Types.ObjectId, // one who is subscribing. If you count the no. of documents for a certain user, you will get no. of channels you have subscribed.
        ref: 'User'
    },
    channel : {
        type: Schema.Types.ObjectId, // one whom 'subscriber' is subscribing. If you count the no. of documents for a certain channel, you will get no. of subscribers.
        ref: 'User'
    },
     
},{timestamps:true})

export const Subscription = mongoose.model('Subscription',subscriptionSchema)