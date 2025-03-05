import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPrompt extends Document {
  assistantName: string;
  prompt: string;
  timestamp: Date;
  taskCompleted: boolean;
}

const promptSchema = new Schema<IPrompt>({
  assistantName: { type: String, required: true },
  prompt: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  taskCompleted: { type: Boolean, default: false },
});

// Prevent model overwrite error
const PromptModel = mongoose.models.Prompt as mongoose.Model<IPrompt> || mongoose.model<IPrompt>("Prompt", promptSchema);

export default PromptModel;