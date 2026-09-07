import mongoose, { Schema, Model } from "mongoose";

export interface ICategory {
  name: string;
  userId: string;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    userId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Each user can have a category name only once
CategorySchema.index(
  { userId: 1, name: 1 },
  { unique: true }
);

const Category: Model<ICategory> =
  mongoose.models.Category ||
  mongoose.model<ICategory>(
    "Category",
    CategorySchema
  );

export default Category;