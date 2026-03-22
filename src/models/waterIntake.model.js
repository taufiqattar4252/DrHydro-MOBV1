import mongoose from "mongoose";

const waterIntakeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    amount: {
        type: Number, // in mL
        required: true,
        min: 1
    },
    drinkType: {
        type: String,
        enum: [
            "Water", "Green Tea", "Coffee", "Juice", "Milk", 
            "Smoothie", "Coconut", "Sparkling", "Lemonade", 
            "Sports", "Herbal Tea", "Custom"
        ],
        default: "Water"
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const WaterIntake = mongoose.model("waterIntakes", waterIntakeSchema);

export default WaterIntake;
