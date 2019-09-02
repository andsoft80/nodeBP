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
app.use(express.static('modules'));
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

formTypes = {
    list: 'list',
    element: 'element'
};
var objectSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    objectType: String,
    name: String,
    fields: [
        {fieldId: String,
            alias: String,
            type: String,
            edtType: String,
            helpText: String}],
    tableParts: [
        {
            tablePartId: String,
            helpText: String,
            fields: [
                {fieldId: String,
                    type: String,
                    edtType: String,
                    alias: String,
                    helpText: String}]

        }],
    forms: [
        {
            formId: String,
            formType: String, //list, element
            structure: Object
        }
    ],
    code: String
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
app.post('/metadata', function (req, res) {
    var objectData = req.body;
    if (!objectData._id) {
        objectData._id = new mongoose.Types.ObjectId();
    }
    console.log(JSON.stringify(objectData));
    docInvoice = new MetaData(objectData);
    docInvoice.save(function (err, doc) {
        if (err)
            throw res.send(JSON.stringify(err));
        res.send({"status": 200, "doc": doc});
    });


});
app.get('/metadata', function (req, res) {

    var query = MetaData.find({});
    query.exec(function (err, docs) {
        res.send(docs);
    });




});
app.get('/metadata/:id', function (req, res) {

    var query = MetaData.findById(req.params.id);
    query.exec(function (err, docs) {
        res.send(docs);
    });




});

app.put('/metadata', function (req, res) {


});
app.post('/build', function (req, res) {
    var rowsTest = [
        {
            id: "name",
            type: "input",
            label: "Name",
            icon: "dxi-magnify",
            placeholder: "John Doe"
        },
        {
            id: "email",
            type: "input",
            label: "Email",
            placeholder: "jd@mail.name"
        },
        {
            id: "password",
            type: "input",
            label: "Password",
            placeholder: "Enter password"
        },
        {
            type: "checkbox",
            label: "Save session",
            name: "agree",
            labelInline: true,
            id: "savesession",
            value: "checkboxvalue",
        }];
    var code = 'var layout = new dhx.Layout(null, { rows:[{id:"main"}]});';
    code += 'var form = new dhx.Form(null, {rows: ' + JSON.stringify(rowsTest) + '});';
    code += 'form.events.on("ButtonClick", function(id,e){\n\
  alert(id);\n\
});\n\
form.events.on("Change",function(id, new_value){\n\
 alert(new_value);\n\
});';
    
    code += 'layout.cell("main").attach(form);'
    code += 'export {layout as form};';

    fs.writeFileSync(__dirname + '/modules/users.js',code);
    
    var globalTxt = 'import * as Users from "./modules/users.js"';
    fs.writeFileSync(__dirname + '/public/global.js',globalTxt);

    res.send('Ok');

});


//End ObjectTree