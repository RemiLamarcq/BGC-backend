var express = require('express');
const mongoose = require('mongoose');
var router = express.Router();
const User = require('../models/users');
const PwdRecovery = require('../models/pwdRecovery');
const uid2 = require('uid2');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt')




router.get('/sendEmail/:email', async (req, res) => {
    try {
        const userEmail = req.params.email;

        // Récupérer l'utilisateur correspondant à l'email
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ result: false, message: 'E-mail non reconnu' });
        }

        // Récupération de l'idUser depuis le mail 
        const idUser = user._id;

        // Génération du code de vérification
        const checkCode = uid2(4);

        // Construction du document à sauvegarder dans la collection PwdRecovery
        const newPwdRecovery = new PwdRecovery({
            idUser: idUser,
            checkCode: checkCode
        });

        // Sauvegarde du document dans la collection PwdRecovery
        await newPwdRecovery.save();

        // Configuration du service d'e-mails
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'boardgamecompanionpwd@gmail.com', // Adresse e-mail Gmail à partir de laquelle vous souhaitez envoyer l'e-mail
                pass: 'frpd xsxe mxcj ltmj', // Mot de passe de votre adresse e-mail Gmail
            },
        });

        // Contenu de l'e-mail
        const mailOptions = {
            from: 'boardgamecompanionpwd@gmail.com', // Adresse e-mail de l'expéditeur
            to: userEmail, // Adresse e-mail du destinataire (utilisateur)
            subject: 'Code de vérification pour réinitialiser votre mot de passe', // Objet de l'e-mail
            text: `Votre code de vérification est : ${checkCode}.`, // Corps de l'e-mail
        };

        // Envoi de l'e-mail
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Erreur lors de l\'envoi de l\'e-mail :', error);
                res.status(500).json({ result: false, error: 'Erreur lors de l\'envoi de l\'e-mail' });
            } else {
                console.log('E-mail envoyé avec succès :', info.response);
                res.json({ result: true, message: 'E-mail envoyé avec succès' });
            }
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ result: false, error: 'Internal Server Error' });
    }
});

router.get('/verifyCode/:token', async (req, res) => {
    try {
        // Rechercher l'utilisateur par son token 
        const user = await User.findOne({ token: req.params.token });
        
        if (!user) {
            return res.status(404).json({ result: false, message: 'Utilisateur non trouvé' });
        }

        const idUser = user._id;
        const checkCode = req.body.checkCode;
        const newPassword = bcrypt.hashSync(req.body.password, 10);

        // Vérification si dans la collection pwdRecovery le code correspond au user 
        const pwdRecoveryEntry = await PwdRecovery.findOne({ idUser: idUser, checkCode: checkCode });
        
        if (pwdRecoveryEntry) {
            // Mettre à jour le mot de passe de l'utilisateur
            user.password = newPassword;
            await user.save();

            // Supprimer l'entrée de récupération de mot de passe de la base de données
            await PwdRecovery.deleteOne({ idUser: user._id });
            res.json({ result: true, message: 'Mot de passe modifié avec succès' });
        } else {
            res.json({ result: false, message: 'Le code est invalide' });
        }
    } catch (error) {
        console.error('Erreur :', error.message);
        res.status(500).json({ result: false, error: 'Erreur interne du serveur' });
    }
});
     
        
    


module.exports = router;