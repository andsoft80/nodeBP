var express = require('express');
var fs = require('fs');
var mongoose = require('mongoose');
var mysql = require('mysql');
var mySqlServerHost = 'localhost';

mongoose.connect('mongodb://localhost/bp', {useNewUrlParser: true}, function (err) {

    if (err)
        throw err;

    console.log('Successfully connected to Mongo');

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
//var ping = false;
function getMySQLConnection() {
    var con = mysql.createConnection({
        host: mySqlServerHost,
        user: 'root',
        password: 'root',
        database: 'bp'


    });
//    if (!ping) {
//        setInterval(function () {
//            con.query('SELECT 1');
//        }, 5000);
//        ping = true;
//    }
    return con;
}
;
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

//End ObjectTree



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
    if (usrType.indexOf('String') > -1 || usrType.indexOf('Extend') > -1) {
        return "varchar(255)";
    }
    if (usrType.indexOf('Numeric') > -1) {
        return "decimal(20,6)";
    }
    if (usrType.indexOf('Date') > -1) {
        return  "datetime";
    }
    if (usrType.indexOf('Text') > -1) {
        return "text";
    }

    return s;
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function buildField(field, con, table, cb) {
    //console.log('start '+field.fieldId);
    var res = {};
    //var autoIncrement = '';
//    if(field.autoIncrement){
//        autoIncrement = "AUTO_INCREMENT";
//    }
    if (field.delete) {
        var sql = "ALTER TABLE " + table + " DROP COLUMN " + field.fieldId;
        con.query(sql, function (err, result) {
            if (err) {
                res.status = 500;
                res.text = err;
                res.fieldId = field.fieldId;
                cb(res);

            } else {
                res.status = 200;
                res.text = "Ok";
                res.fieldId = field.fieldId;
                cb(res);
            }
        });
        return;
    }
    if (field.changeType) {
        //console.log('change');
        var sql = "ALTER TABLE " + table + " MODIFY COLUMN " + field.fieldId + " " + userTypeToDbType(field.type);//+" "+autoIncrement;
        con.query(sql, function (err, result) {
            if (err) {

                res.status = 500;
                res.text = err;
                res.fieldId = field.fieldId;
                cb(res);


            } else {
                res.status = 200;
                res.text = "Ok";
                res.fieldId = field.fieldId;
                cb(res);
            }
        });
    }
    if (field.changeType === undefined) {
        var sql = "ALTER TABLE " + table + " ADD " + field.fieldId + " " + userTypeToDbType(field.type);//+" "+autoIncrement;
        console.log(sql);
        con.query(sql, function (err, result) {
            if (err) {
                res.status = 500;
                res.text = err;
                res.fieldId = field.fieldId;
                cb(res);

            } else {
                res.status = 200;
                res.text = "Ok";
                res.fieldId = field.fieldId;
                cb(res);
            }
        });
    }
    if (field.changeType === false && field.delete === false) {
        res.status = 200;
        res.text = "Ok";
        res.fieldId = field.fieldId;
        cb(res);
    }

}

function buildObject(id, cb) {
//-->db///////////////////////
    var res = {};

    var con = getMySQLConnection();
    con.connect(function (err) {
        if (err) {
            res.status = 500;
            res.text = err;

            cb(res);
        }



        console.log('Connected to MySQL...');



        var query = MetaData.findById(id);
        query.exec(function (err, doc) {
            if (doc) {
                //if (doc.fields.length > 0) {
                //console.log(doc.fields.length);
                if (doc.objectType === "dir" || doc.objectType === "doc") {
                    var haveId = false;
                    for (var i = 0; i < doc.listForm.length; i++) {
                        if (doc.listForm[i].fieldId === 'id') {
                            haveId = true;
                            break;
                        }
                    }
                    if (!haveId) {
                        res.status = 500;
                        res.text = "List Form of " + doc.name + " have not id field!";
                        con.end();
                        cb(res);
                    }
                }
                var sqlStr = "show tables like " + "'" + doc.name + "'";
                con.query(sqlStr, function (err, result) {

                    if (err) {
                        res.status = 500;
                        res.text = err;
                        con.end();
                        cb(res);

                    }
                    ;

                    if (result.length > 0) {//table exist
                        var sql = "SHOW COLUMNS FROM " + doc.name;
                        con.query(sql, function (err, result) {
                            if (err) {
                                res.status = 500;
                                res.text = err;
                                con.end();
                                cb(res);

                            }
                            ;

                            console.log(JSON.stringify(result));
                            var fieldsDB = [];
                            for (var i = 0; i < result.length; i++) {
                                var fieldDB = {};
                                fieldDB.fieldId = result[i].Field;
                                if (fieldDB.fieldId === "_id") {
                                    fieldDB.delete = false;
                                    fieldDB.changeType = false;
                                } else {
                                    fieldDB.delete = true;
                                    fieldDB.changeType = true;
                                }
                                //fieldDB.Null = result[i].Null;
                                fieldDB.type = dbTypeToUserType(result[i].Type)
                                fieldsDB.push(fieldDB);

                            }

                            var fdbl = fieldsDB.length;
                            if (doc.fields.length) {
                                for (var i = 0; i < doc.fields.length; i++) {
                                    var push = true;
                                    for (var j = 0; j < fdbl; j++) {
                                        if (doc.fields[i].fieldId === fieldsDB[j].fieldId) {
                                            push = false;
                                            fieldsDB[j].delete = false;
                                            if (fieldsDB[j].type === doc.fields[i].type || ((fieldsDB[j].type === 'String') && (doc.fields[i].type === 'Extend'))) {
                                                fieldsDB[j].changeType = false;
                                                console.log(fieldsDB[j].type);
                                            } else {
                                                fieldsDB[j].type = doc.fields[i].type;
                                                fieldsDB[j].autoIncrement = doc.fields[i].autoIncrement;
                                            }


                                        }
                                    }
                                    if (push) {
                                        fieldsDB.push(doc.fields[i]);
                                    }
                                }
                            }
                            console.log(JSON.stringify(fieldsDB));
                            var errors = [];
                            var cnt = 0;

                            for (var i = 0; i < fieldsDB.length; i++) {
                                var field = fieldsDB[i];

                                buildField(field, con, doc.name, function (data) {
                                    cnt++;
                                    if (data.status === 500) {
                                        errors.push(data);
                                        console.log('error field ' + data.fieldId);
                                    }

                                    if (cnt === fieldsDB.length) {
                                        console.log(JSON.stringify(errors));
                                        if (errors.length > 0) {
                                            res.status = 500;
                                            res.text = errors;
                                            con.end();
                                            cb(res);
                                        } else {//stub for DB process
                                            res.status = 200;
                                            res.text = "DB builds";
                                            con.end();
                                            cb(res);

                                        }
                                    }

                                });


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
                        sql = sql + ", _id varchar(255) not null, PRIMARY KEY (_id))";
                        con.query(sql, function (err, result) {
                            if (err) {
                                res.status = 500;
                                res.text = err;
                                con.end();
                                cb(res);

                            }
                            ;
                            res.status = 200;
                            res.text = 'Table created!';
                            con.end();
                            cb(res);
                        });
                    }

                });
                //}
            } else {

                res.status = 500;
                res.text = "Object not found!";
                con.end();
                cb(res);


            }
        });



    });

    //cb(res);


//<--db/////////////////////////

}
app.post('/build', function (req, res) {

    var objectData = (req.body);
    if (req.body.id) {

        buildObject(objectData.id, function (data) {

            res.send(data);
            //console.log(JSON.stringify(data))
        });

    } else {

    }


});

app.post('/getMax', function (req, res) {
    //var body = JSON.parse(req.body);
    var table = req.body.table;
    var fieldsStr = req.body.fields;
    var fields = fieldsStr.split(",");

    var con = getMySQLConnection();
    //console.log(con);
    con.connect(function (err) {
        if (err)
            res.end(JSON.stringify(err));

        var sqlStr = "select ";
        for (var i = 0; i < fields.length; i++) {
            sqlStr = sqlStr + "max(" + fields[i] + "),";
        }
        sqlStr = sqlStr.substring(0, sqlStr.length - 1);
        sqlStr = sqlStr + " from " + table;
        console.log(sqlStr);
        con.query(sqlStr, function (err, result) {
            if (err)
                res.end(JSON.stringify(err));
            res.end(JSON.stringify(result));

        });
    });
});

/////////////universal sql api//////////////////////////////////
app.post('/table/:tableName/action/:action', function (req, res) {
    res.set({
        'Content-Type': 'text/plain',
        'charset': 'utf-8'
    });


//    var con = mysql.createConnection({
//        host: mySqlServerHost,
//        user: 'root',
//        password: 'root',
//        database: 'bp'
//
//
//    });
    var con = getMySQLConnection();
    con.connect(function (err) {
        if (err){
            console.log(JSON.stringify(err));
            res.end(JSON.stringify(err));
        }


    });

    var tableName = req.params.tableName;
    var action = req.params.action;

    if (action === 'post') {
        sqlStr = "INSERT INTO " + tableName + " (";
        for (i = 0; i < Object.keys(req.body).length; i++) {
            if (Object.keys(req.body)[i] == 'an') {
                continue;
            }
            sqlStr = sqlStr + Object.keys(req.body)[i] + ",";
        }

        //sqlStr = sqlStr.substring(0, sqlStr.length - 1);
        sqlStr = sqlStr + "_id) VALUES (";
        for (i = 0; i < Object.keys(req.body).length; i++) {
            if (Object.keys(req.body)[i] == 'an') {
                continue;
            }
            sqlStr = sqlStr + "'" + req.body[Object.keys(req.body)[i]] + "',";
        }
        sqlStr = sqlStr + "'" + uuidv4() + "'";
        //sqlStr = sqlStr.substring(0, sqlStr.length - 1);
        sqlStr = sqlStr + ")";

        con.query(sqlStr, function (err, result) {
            if (err)
                res.end(JSON.stringify(err));
            res.end(JSON.stringify(result));

        });
    }
    if (action === 'put') {
        var id = req.body._id;

        sqlStr = "update " + tableName + " set ";
        for (i = 0; i < Object.keys(req.body).length; i++) {
            if (Object.keys(req.body)[i] === '_id') {
                continue;
            }
            if (Object.keys(req.body)[i] == 'an') {
                continue;
            }
            sqlStr = sqlStr + Object.keys(req.body)[i] + "='" + req.body[Object.keys(req.body)[i]] + "',"
        }
        sqlStr = sqlStr.substring(0, sqlStr.length - 1);
        sqlStr = sqlStr + " where _id = '" + id + "'";
        console.log(sqlStr);
        con.query(sqlStr, function (err, result) {
            if (err)
                res.end(JSON.stringify(err));
            res.end(JSON.stringify(result));

        });
    }

    if (action === 'delete') {

        var id = req.body._id;

        sqlStr = "delete from " + tableName + " where _id =  '" + id + "'";
        ;

        con.query(sqlStr, function (err, result) {
            if (err)
                res.end(JSON.stringify(err));
            res.end(JSON.stringify(result));

        });


    }
    if (action === 'get') {

        var id = req.body._id;
        var condition = req.body.condition;

        var str = '';
        if (condition) {

            str = "where " + condition[0].field + " = '" + condition[0].value + "'";
            for (i = 1; i < condition.length; i++) {
                str = str + ' and ' + condition[i].field + " = '" + condition[i].value + "'";
            }
        }
        if (id) {
            sqlStr = "select * from " + tableName + " where _id =  '" + id + "'" + " " + str;
        } else {
            sqlStr = "select * from " + tableName + " " + str;
        }

        //console.log(con);
        con.query(sqlStr, function (err, result) {
            if (err)
                res.end(JSON.stringify(err));
            res.end(JSON.stringify(result));
            //res.end(result);
            //console.log(JSON.stringify(result));

        });


    }
    if (action === 'get_columns') {


        sqlStr = "DESC " + tableName;
        con.query(sqlStr, function (err, result) {
            if (err)
                res.end(JSON.stringify(err));



            //console.log(JSON.stringify(columns));
            res.end(JSON.stringify(result));

        });


    }
    con.destroy(function (err) {
        if (err) {
            return console.log("Ошибка: " + err.message);
        }
    });

});

//////////////////////////////////////////////


