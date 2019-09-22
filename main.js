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
function dbTypeToUserType(dbType) {
    var s = "";
    if (dbType.indexOf('bigint') > -1) {
        return "Integer";
    }
    if (dbType.indexOf('varchar(255)') > -1) {
        return "String";
    }
    if (dbType.indexOf('decimal') > -1) {
        return "Numeric";
    }
    if (dbType.indexOf('date') > -1) {
        return  "Date";
    }
    if (dbType.indexOf('text') > -1) {
        return "Text";
    }

    return s;
}

function userTypeToDbType(usrType) {
    var s = "";
    if (usrType.indexOf('Integer') > -1) {
        return "bigint";
    }
    if (usrType.indexOf('String') > -1 || usrType.indexOf('Extend')> -1) {
        return "varchar(255)";
    }
    if (usrType.indexOf('Numeric') > -1) {
        return "decimal";
    }
    if (usrType.indexOf('Date') > -1) {
        return  "date";
    }
    if (usrType.indexOf('Text') > -1) {
        return "text";
    }

    return s;
}

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
                                    fieldDB.type = dbTypeToUserType(result[i].Type)
                                    fieldsDB.push(fieldDB);

                                }
                                var fdbl = fieldsDB.length;
                                for (var i = 0; i < doc.fields.length; i++) {
                                    var push = true;
                                    for (var j = 0; j < fdbl; j++) {
                                        if (doc.fields[i].fieldId === fieldsDB[j].fieldId) {
                                            push = false;
                                            fieldsDB[j].delete = false;
                                            if (fieldsDB[j].type === doc.fields[i].type || ((fieldsDB[j].type === 'String') && (doc.fields[i].type === 'Extend'))) {
                                                fieldsDB[j].changeType = false;
                                            }
                                            else{
                                                fieldsDB[j].type = doc.fields[i].type;
                                            }
                                            

                                        }
                                    }
                                    if (push) {
                                        fieldsDB.push(doc.fields[i]);
                                    }
                                }
                                console.log(JSON.stringify(fieldsDB));
                                for (var i = 0; i < fieldsDB.length; i++) {
                                    var field = fieldsDB[i];
                                    if(field.delete){
                                        var sql = "ALTER TABLE "+doc.name+" DROP COLUMN " + field.fieldId;
                                        con.query(sql, function (err, result) {
                                            if (err)
                                                throw err;
                                        });
                                        continue;
                                    }
                                    if(field.changeType){
                                        var sql = "ALTER TABLE "+doc.name+" MODIFY COLUMN " + field.fieldId+" "+userTypeToDbType(field.type);
                                        con.query(sql, function (err, result) {
                                            if (err)
                                                throw err;
                                        });
                                    }  
                                    if(field.changeType===undefined){
                                        var sql = "ALTER TABLE "+doc.name+" ADD " + field.fieldId+" "+userTypeToDbType(field.type);
                                        console.log(sql);
                                        con.query(sql, function (err, result) {
                                            if (err)
                                                throw err;
                                        });
                                    }                                     
                                    
                                }

                            });

                        } else {//table not exist
                            //var sql = "CREATE TABLE customers (name VARCHAR(255), address VARCHAR(255))";
                            var sql = "CREATE TABLE " + doc.name + " (";
                            for (var i = 0; i < doc.fields.length; i++) {
                                var field = doc.fields[i];

                                sql = sql + field.fieldId + " " + userTypeToDbType(field.type) + ",";

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