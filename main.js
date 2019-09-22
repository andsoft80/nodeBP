var express = require('express');
var fs = require('fs');
var mongoose = require('mongoose');
var mysql = require('mysql');
var mySqlServerHost = 'localhost';

mongoose.connect('mongodb://localhost/bp', {useNewUrlParser: true}, function (err) {

    if (err)
        throw err;

    console.log('Successfully connected');

});

var app = express();
app.use(express.static('public'));
app.use(express.static('modules'));
//app.use(express.bodyParser());
var bodyParser = require('body-parser')
app.use(bodyParser.json())      // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({extended: false})); // to support URL-encoded bodies
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
    fields: {
        type: mongoose.Schema.Types.Mixed,
        default: []
    }
//            [
//        {fieldId: String,
//            alias: String,
//            type: String,
//            edtType: Object,
//            helpText: String}]
    ,
    tableParts: {
        type: mongoose.Schema.Types.Mixed,
        default: []
    }
//            [
//        {
//            tablePartId: String,
//            helpText: String,
//            fields: [
//                {fieldId: String,
//                    type: String,
//                    edtType: Object,
//                    alias: String,
//                    helpText: String}]
//
//        }]
    ,
    listForm: {
        type: mongoose.Schema.Types.Mixed,
        default: []
    },
    elementForm: {
        type: mongoose.Schema.Types.Mixed,
        default: []
    }
//            [
//        {
//            formId: String,
//            formType: String, //list, element
//            structure: Object
//        }
//    ]

    ,
    code: String,
    changed: {type: Boolean, default: true}
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
    var objectData = (req.body);
    console.log(JSON.stringify(req.body));
    //var fieldsStr = JSON.stringify(req.body.fields);
    var fieldsStr = (req.body.fields);
    MetaData.updateOne({_id: req.body._id}, objectData, function (err, result) {
        if (err)
            throw res.send(JSON.stringify(err));

        console.log(JSON.stringify(result));
        res.send({"status": 200, "result": result});
    });


});

function buildObject(id) {
//-->db///////////////////////
    var con = mysql.createConnection({
        host: mySqlServerHost,
        user: 'root',
        password: 'root',
        database: 'bp'


    });
    con.connect(function (err) {
        if (err)
            throw err;

        console.log('Connected to MySQL...');
    });
    if (con) {

        var query = MetaData.findById(id);
        query.exec(function (err, doc) {
            if (doc) {
                if (doc.fields.length > 0) {
                    //console.log(doc.fields.length);
                    var sqlStr = "show tables like " + "'" + doc.name + "'";
                    con.query(sqlStr, function (err, result) {
                        if (err)
                            throw err;
                        if (result.length > 0) {//table exist
                            var sql = "SHOW COLUMNS FROM " + doc.name;
                            con.query(sql, function (err, result) {
                                if (err)
                                    throw err;

                                //console.log(JSON.stringify(result));
                                var fieldsDB = [];
                                for (var i = 0; i < result.length; i++) {
                                    var fieldDB = {};
                                    fieldDB.fieldId = result[i].Field;
                                    fieldDB.delete = true;
                                    fieldDB.changeType = true;
                                    //fieldDB.Null = result[i].Null;
                                    if (result[i].Type.indexOf('bigint') > -1) {
                                        fieldDB.type = "Integer";
                                    }
                                    if (result[i].Type.indexOf('varchar(255)') > -1) {
                                        fieldDB.type = "String";
                                    }
                                    if (result[i].Type.indexOf('decimal') > -1) {
                                        fieldDB.type = "Numeric";
                                    }
                                    if (result[i].Type.indexOf('date') > -1) {
                                        fieldDB.type = "Date";
                                    }
                                    if (result[i].Type.indexOf('text') > -1) {
                                        fieldDB.type = "Text";
                                    }
                                    fieldsDB.push(fieldDB);

                                }
                                var fdbl = fieldsDB.length;
                                for (var i = 0; i < doc.fields.length; i++) {
                                    var push = true;
                                    for (var j = 0; j < fdbl; j++) {
                                        if (doc.fields[i].fieldId === fieldsDB[j].fieldId) {
                                            push = false;
                                            fieldsDB[j].delete = false;
                                            if (fieldsDB[j].type === doc.fields[i].type || ((fieldsDB[j].type==='String')&&(doc.fields[i].type==='Extend'))) {
                                                fieldsDB[j].changeType = false;
                                            }

                                        }
                                    }
                                    if (push) {
                                        fieldsDB.push(doc.fields[i]);
                                    }
                                }
                                //console.log(JSON.stringify(fieldsDB));
                                
                                
                            });

                        } else {//table not exist
                            //var sql = "CREATE TABLE customers (name VARCHAR(255), address VARCHAR(255))";
                            var sql = "CREATE TABLE " + doc.name + " (";
                            for (var i = 0; i < doc.fields.length; i++) {
                                var field = doc.fields[i];
                                if (field.type === 'String') {
                                    sql = sql + field.fieldId + " varchar(255),"
                                }
                                if (field.type === 'Integer') {
                                    sql = sql + field.fieldId + " bigint,"
                                }
                                if (field.type === 'Numeric') {
                                    sql = sql + field.fieldId + " decimal(20.6),"
                                }
                                if (field.type === 'Date') {
                                    sql = sql + field.fieldId + " datetime,"
                                }

                                if (field.type === 'Text') {
                                    sql = sql + field.fieldId + " text,"
                                }
                                if (field.type === 'Extend') {
                                    sql = sql + field.fieldId + " varchar(255),"
                                }
                            }
                            sql = sql.substring(0, sql.length - 1);
                            sql = sql + ")";
                            con.query(sql, function (err, result) {
                                if (err)
                                    throw err;
                            });
                        }

                    });
                }
            } else {
                return 500;
            }
        });
        return 200;
    } else {
        console.log('Connection to MySQL failed!!!');
        return 500;
    }




    con.end();
//<--db/////////////////////////

}
app.post('/build', function (req, res) {
    var result = {};
    var objectData = (req.body);
    if (req.body.id) {
        if (buildObject(objectData.id) === 200) {
            res.send({"status": 200});
        } else {
            res.send({"status": 500});
        }
        ;
    } else {

    }


});


//End ObjectTree