import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  username: string;
  password: string;
  fullName: string;
  role: 'admin' | 'doctor' | 'staff' | 'lab_admin' | 'lab_adn';
  allowedCategories: Array<'cell' | 'thinprep' | 'hpv40' | 'hpv20' | 'soituoi' | 'giaiphaubenh' | 'adn'>;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'doctor', 'staff', 'lab_admin', 'lab_adn'],
      default: 'staff',
    },
    allowedCategories: {
      type: [String],
      enum: ['cell', 'thinprep', 'hpv40', 'hpv20', 'soituoi', 'giaiphaubenh', 'adn'],
      default: ['cell', 'thinprep', 'hpv40', 'hpv20', 'soituoi', 'giaiphaubenh', 'adn'],
    },
    title: {
      type: String,
      default: '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)',
    },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.User) {
  delete mongoose.models.User;
}

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
