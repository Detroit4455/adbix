import { Schema, model, models } from 'mongoose';

export interface IImage {
  name: string;
  type: string;
  description?: string;
  fileName: string;
  s3Key: string;
  s3Url: string;
  size: number;
  width?: number;
  height?: number;
  mimeType: string;
  uploadedBy: string; // mobile number of the user who uploaded
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = new Schema<IImage>({
  name: {
    type: String,
    required: [true, 'Image name is required'],
    trim: true,
    maxlength: [255, 'Image name cannot exceed 255 characters']
  },
  type: {
    type: String,
    required: [true, 'Image type is required'],
    enum: ['photo', 'icon', 'banner', 'logo', 'background', 'product', 'other'],
    default: 'other'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true
  },
  s3Key: {
    type: String,
    required: [true, 'S3 key is required'],
    trim: true
  },
  s3Url: {
    type: String,
    required: [true, 'S3 URL is required'],
    trim: true
  },
  size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative']
  },
  width: {
    type: Number,
    min: [0, 'Width cannot be negative']
  },
  height: {
    type: Number,
    min: [0, 'Height cannot be negative']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^image\/(jpeg|jpg|png|gif|webp|svg\+xml)$/i.test(v);
      },
      message: 'Invalid image MIME type'
    }
  },
  uploadedBy: {
    type: String,
    required: [true, 'Uploader information is required'],
    validate: {
      validator: function(v: string) {
        return /^[0-9]{10}$/.test(v);
      },
      message: 'Invalid mobile number format'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for better query performance
imageSchema.index({ uploadedBy: 1, createdAt: -1 });
imageSchema.index({ type: 1 });
imageSchema.index({ name: 'text', description: 'text' });

// Virtual for formatted file size
imageSchema.virtual('formattedSize').get(function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Static method to get images by user
imageSchema.statics.getImagesByUser = function(mobileNumber: string, page = 1, limit = 20, search?: string, type?: string) {
  const query: any = { uploadedBy: mobileNumber };
  
  if (search) {
    query.$text = { $search: search };
  }
  
  if (type && type !== 'all') {
    query.type = type;
  }
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
};

// Static method to get image statistics
imageSchema.statics.getImageStats = function(mobileNumber: string) {
  return this.aggregate([
    { $match: { uploadedBy: mobileNumber } },
    {
      $group: {
        _id: null,
        totalImages: { $sum: 1 },
        totalSize: { $sum: '$size' },
        typeBreakdown: {
          $push: {
            type: '$type',
            size: '$size'
          }
        }
      }
    },
    {
      $addFields: {
        typeStats: {
          $reduce: {
            input: '$typeBreakdown',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $arrayToObject: [
                    [
                      {
                        k: '$$this.type',
                        v: {
                          $add: [
                            { $ifNull: [{ $getField: { input: '$$value', field: '$$this.type' } }, 0] },
                            1
                          ]
                        }
                      }
                    ]
                  ]
                }
              ]
            }
          }
        }
      }
    }
  ]);
};

export default models.Image || model<IImage>('Image', imageSchema); 