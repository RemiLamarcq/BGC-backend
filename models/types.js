const mongoose = require('mongoose');

const typeSchema = mongoose.Schema({
    type: String,
});

const Type = mongoose.model('types', typeSchema);

module.exports = Type;