const { Schema } = require('mongoose');

const latitudeLongitudeSchema = new Schema({
  latitude: Number,
  longitude: Number,
}, { _id: false });

module.exports = latitudeLongitudeSchema;
