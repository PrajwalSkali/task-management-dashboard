import mongoose, { Schema, Model } from "mongoose";

export interface ISettings {
  theme: "Light" | "Dark" | "System";
  showCompleted: boolean;
  defaultPriority: "Low" | "Medium" | "High";
}

const SettingsSchema = new Schema<ISettings>(
  {
    theme: {
      type: String,
      enum: ["Light", "Dark", "System"],
      default: "Light",
    },

    showCompleted: {
      type: Boolean,
      default: true,
    },

    defaultPriority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
  },
  {
    timestamps: true,
  }
);

const Settings: Model<ISettings> =
  mongoose.models.Settings ||
  mongoose.model<ISettings>("Settings", SettingsSchema);

export default Settings;