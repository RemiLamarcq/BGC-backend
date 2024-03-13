const mongoose = require('mongoose');

const pwdRecoverySchema = mongoose.Schema({
    idUser: {type: mongoose.Schema.Types.ObjectId, ref: 'users'},
    checkCode: String,
    expirationDate: Date

});

const PwdRecovery = mongoose.model('pwdRecovery', pwdRecoverySchema);

module.exports = PwdRecovery;