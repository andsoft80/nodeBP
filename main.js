var express = require('express');
var fs = require('fs');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/bp', {useNewUrlParser: true}, function (err) {

    if (err)
        throw err;

    console.log('Successfully connected');

});

var app = express();
app.use(express.static('public'));
//app.use(express.bodyParser());
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded({extended: false})); // to support URL-encoded bodies
app.listen(3000, function () {
    console.log('Start : localhost: ' + 3000);
});
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/conf.html');

});

//
//var userSchema = mongoose.Schema({
//    _id: mongoose.Schema.Types.ObjectId,
//    firstName: String,
//    lastName: String
//});
//
//var User = mongoose.model('User', userSchema);
//var ands = new User ({
//    
//    _id: new mongoose.Types.ObjectId(),
//    firstName : 'Andrey',
//    lastName : 'Saulin'
//});
//ands.save();

//ObjectTree
objectTypes = {
    doc: 'doc',
    dir: 'dir',
    trx: 'trx',
    enum: 'enum',
    setting: 'setting',
    report: 'report'
};
var objectSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    objectType: String,
    name: String,
    fields: [
        {fieldId: String,
            type: String,
            helpText: String}],
    tableParts: [
        {
            tablePartId: String,
            helpText: String,
            fields: [
                {fieldId: String,
                    type: String,
                    helpText: String}]

        }],
    forms:[
        {
            formId: String,
            structure: Object
        }
    ]
});

var MetaData = mongoose.model('MetaData', objectSchema);
//docInvoice = new MetaData({
//    _id: new mongoose.Types.ObjectId(),
//    objectType: objectTypes.doc,
//    name: 'Расходная накладная',
//    forms:[
//        {
//            formId: 'list',
//            structure: {
//                input:'mama'
//            }
//        }
//    ]
//    
//});
//docInvoice.save();


//End ObjectTree