import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["info", "success", "warning", "error", "shortlist", "upload", "interview", "onboarding"], 
    default: "info" 
  },
  recipientRole: { type: String, required: true },
  recipientUserId: { type: String, default: null }, // e.g. candidate email
  readStatus: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Map _id to id in JSON response for frontend compatibility
NotificationSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    return ret;
  }
});

export const Notification = mongoose.model("Notification", NotificationSchema);
