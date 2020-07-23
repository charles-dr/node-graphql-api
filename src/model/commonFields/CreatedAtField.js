
const createdAtField = {
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,    
    index: true,
  },
};

module.exports = createdAtField;
