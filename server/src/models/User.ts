import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUserPreferences {
  timezone: string;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  preferences: IUserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

const UserPreferencesSchema = new Schema<IUserPreferences>(
  {
    timezone: {
      type: String,
      required: true,
      default: "Asia/Kolkata",
    },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      default: "Demo User",
    },
    preferences: {
      type: UserPreferencesSchema,
      required: true,
      default: () => ({ timezone: "Asia/Kolkata" }),
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

export const User = mongoose.model<IUser>("User", UserSchema);
