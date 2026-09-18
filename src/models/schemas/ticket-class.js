import mongoose from 'mongoose';

const ticketClassSchema = new mongoose.Schema(
    {
        class: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        pricePerKm: {
            type: Number,
            required: true,
            min: 0
        },
        amenities: {
            type: [String],
            required: true
        },
        description: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const TicketClass = mongoose.model('TicketClass', ticketClassSchema);

export default TicketClass;
