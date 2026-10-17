import mongoose, { Schema, Document, Types } from "mongoose";
import {
  ActivityCategory,
  Lighting,
  PeoplePresent,
} from "../../../shared/schemas/moment.schema.js";

export interface IActivity {
  category: ActivityCategory;
  taskName: string;
}

export interface IEnvironment {
  location: string;
  noiseLevel: number;
  lighting: Lighting;
  peoplePresent: PeoplePresent;
}

export interface IExperience {
  focusScore: number;
  energyScore: number;
  moodScore: number;
  distractions: string[];
}

export interface IMoment extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  timestamp: Date;
  durationMinutes: number;
  activity: IActivity;
  environment: IEnvironment;
  experience: IExperience;
  reflection: string;
  resonanceScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    category: {
      type: String,
      required: true,
      enum: [
        "deep_work",
        "shallow_work",
        "creative",
        "learning",
        "rest",
        "communication",
      ],
    },
    taskName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
  },
  { _id: false }
);

const EnvironmentSchema = new Schema<IEnvironment>(
  {
    location: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    noiseLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    lighting: {
      type: String,
      required: true,
      enum: ["natural", "dim", "bright", "fluorescent"],
    },
    peoplePresent: {
      type: String,
      required: true,
      enum: ["alone", "parallel_work", "crowded", "meeting"],
    },
  },
  { _id: false }
);

const ExperienceSchema = new Schema<IExperience>(
  {
    focusScore: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    energyScore: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    moodScore: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    distractions: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const MomentSchema = new Schema<IMoment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 5,
      max: 720,
    },
    activity: {
      type: ActivitySchema,
      required: true,
    },
    environment: {
      type: EnvironmentSchema,
      required: true,
    },
    experience: {
      type: ExperienceSchema,
      required: true,
    },
    reflection: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    resonanceScore: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "moments",
  }
);

// -----------------------------------------------------------------------------
// Approved Indexes (README.md § 11) - EXACTLY 3, NO ADDITIONAL INDEXES
// -----------------------------------------------------------------------------

// 1. Primary User Timeline (ESR rule: Equality -> Sort -> Range)
MomentSchema.index(
  { userId: 1, timestamp: -1 },
  { name: "idx_user_timeline" }
);

// 2. Distraction Analytics (Multikey index for array unwinding)
MomentSchema.index(
  { userId: 1, "experience.distractions": 1 },
  { name: "idx_user_distractions_multikey" }
);

// 3. Environmental Spatial Correlation
MomentSchema.index(
  { userId: 1, "environment.location": 1, "environment.noiseLevel": 1 },
  { name: "idx_user_env_location_noise" }
);

export const Moment = mongoose.model<IMoment>("Moment", MomentSchema);
