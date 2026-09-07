import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose";

// ==========================================
// USER INTERFACE
// ==========================================

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// USER SCHEMA
// ==========================================

const UserSchema = new Schema<IUser>(
  {
    // ==========================================
    // USER NAME
    // ==========================================

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // ==========================================
    // EMAIL
    // ==========================================

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    // ==========================================
    // PASSWORD
    // ==========================================

    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// USER MODEL
// ==========================================

const User: Model<IUser> =
  mongoose.models.User ||
  mongoose.model<IUser>(
    "User",
    UserSchema
  );

export default User;