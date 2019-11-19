var express = require('express');
var fs = require('fs');
var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var mysql = require('mysql');
var mySqlServerHost = 'localhost';

mongoose.connect('mongodb://localhost/bp', {useNewUrlParser: true}, function (err) {

    if (err)
        throw err;

    console.log('Successfully connected to Mongo');

});
mongoose.set('useFindAndModify', false);
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

setInterval(function () {
    con.query('SELECT 1');
}, 5000);
// ping = true;    
//function getMySQLConnection() {
//    var con = mysql.createConnection({
//        host: mySqlServerHost,
//        user: 'root',
//        password: 'root',
//        database: 'bp'
//
//
//    });
//    if (!ping) {
//        setInterval(function () {
//            con.query('SELECT 1');
//        }, 5000);
//        ping = true;
//    }
//  return con;
//}
//;
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
    name: {type: String, unique: true, required: true, uniqueCaseInsensitive: true},
    alias: {type: String, required: true},
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

objectSchema.plugin(uniqueValidator);

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
        {
            res.end(JSON.stringify(err));
            return;
        }
        res.send({"status": 200, "doc": doc});
    });


});
app.get('/metadata', function (req, res) {

    var query = MetaData.find({});
    query.exec(function (err, docs) {
        if (err)
        {
            res.end(JSON.stringify(err));
            return;
        }
        res.send(docs);
    });




});
app.get('/metadata/:id', function (req, res) {

    var query = MetaData.findById(req.params.id);
    query.exec(function (err, docs) {
        if (err)
        {
            res.end(JSON.stringify(err));
            return;
        }
        res.send(docs);
    });




});

app.put('/metadata', function (req, res) {
    var objectData = (req.body);
    //console.log(JSON.stringify(req.body));
    //var fieldsStr = JSON.stringify(req.body.fields);
    var fieldsStr = (req.body.fields);
    MetaData.updateOne({_id: req.body._id}, objectData, function (err, result) {
        if (err)
        {
            res.end(JSON.stringify(err));
            return;
        }

        //console.log(JSON.stringify(result));
        res.send({"status": 200, "result": result});
    });


});

app.delete('/metadata/:id', function (req, res) {
    var free = true;

    var query = MetaData.find({});
    query.exec(function (err, docs) {
        if (err)
        {
            res.end(JSON.stringify(err));
            return;
        }
        var arr = [];
        for (var i = 0; i < docs.length; i++) {
            for (var j = 0; j < docs[i].fields.length; j++) {
                if (docs[i].fields[j].edtType) {
                    if (docs[i].fields[j].edtType.objectId === req.params.id) {
                        arr.push(docs[i].name);
                        free = false;
                    }
                }
            }
        }
        if (free) {
            var query1 = MetaData.findOneAndRemove({"_id": req.params.id});
            query1.exec(function (err, result) {
                if (err)
                {
                    res.end(JSON.stringify(err));
                    return;
                }
                res.send({"status": 200, "result": result});
            });
        } else {
            res.send({"status": 500, "result": JSON.stringify(arr)});
        }


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
function pass_gen(len) {
    chrs = 'abdehkmnpswxzABDEFGHKMNPQRSTWXZ123456789';
    var str = '';
    for (var i = 0; i < len; i++) {
        var pos = Math.floor(Math.random() * chrs.length);
        str += chrs.substring(pos, pos + 1);
    }
    return str;
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

function buildObject(id, tpId, cb) {
//-->db///////////////////////
    var res = {};

    //var con = getMySQLConnection();
//    con.connect(function (err) {
//        if (err) {
//            res.status = 500;
//            res.text = err;
//
//            cb(res);
//            return;
//        }







    var query = MetaData.findById(id);
    query.exec(function (err, doc) {
        if (doc) {
            if (tpId) {
                var tpDoc = {};
                for (var i = 0; i < doc.tableParts.length; i++) {
                    if (doc.tableParts[i].id === tpId) {
                        //fields = obj.tableParts[i].fields;
                        tpDoc.objectType = doc.objectType;
                        tpDoc.fields = doc.tableParts[i].fields;
                        tpDoc.listForm = doc.tableParts[i].listForm;
                        tpDoc.name = doc.name + '_' + tpId;
                        tpDoc.mainTableName = doc.name;
                        doc = tpDoc;
                        break;
                    }
                }

            }

            //if (doc.fields.length > 0) {
            //console.log(doc.fields.length);'
            if (!tpId) {
                if (doc.objectType === "dir" || doc.objectType === "doc") {
                    var haveId = false;
                    var haveName = false;
                    for (var i = 0; i < doc.listForm.length; i++) {
                        if (doc.listForm[i].fieldId === 'id') {
                            haveId = true;

                        }
                        if (doc.listForm[i].fieldId === 'name') {
                            haveName = true;

                        }
                    }
                    if (!haveId || !haveName) {
                        res.status = 500;
                        res.text = "List Form of " + doc.name + " have not id or name field!";
                        //con.end();
                        cb(res);
                        return;
                    }
                }
            }
            var sqlStr = "show tables like " + "'" + doc.name + "'";
            con.query(sqlStr, function (err, result) {

                if (err) {
                    res.status = 500;
                    res.text = err;
                    //con.end();
                    cb(res);
                    return;

                }
                ;

                if (result.length > 0) {//table exist
                    var sql = "SHOW COLUMNS FROM " + doc.name;
                    con.query(sql, function (err, result) {
                        if (err) {
                            res.status = 500;
                            res.text = err;
                            //con.end();
                            cb(res);
                            return;

                        }
                        ;

                        console.log(JSON.stringify(result));
                        var fieldsDB = [];
                        for (var i = 0; i < result.length; i++) {
                            var fieldDB = {};
                            fieldDB.fieldId = result[i].Field;
                            if (fieldDB.fieldId === "_id" || fieldDB.fieldId === "_idFK") {
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
                                        //con.end();
                                        cb(res);
                                        return;
                                    } else {//stub for DB process
                                        res.status = 200;
                                        res.text = "DB builds";
                                        //con.end();
                                        cb(res);

                                    }
                                }

                            });


                        }

                    });

                } else {//table not exist
                    //var sql = "CREATE TABLE customers (name VARCHAR(255), address VARCHAR(255))";
                    var FKField = '';
                    var FKLink = ''
                    if (doc.mainTableName) {
                        FKField = ', _idFK varchar(255) ';
                        FKLink = ', FOREIGN KEY (_idFK) REFERENCES ' + doc.mainTableName + '(_id)';
                    }

                    var sql = "CREATE TABLE " + doc.name + " (";
                    for (var i = 0; i < doc.fields.length; i++) {
                        var field = doc.fields[i];

                        sql = sql + field.fieldId + " " + userTypeToDbType(field.type) + ",";

                    }
                    sql = sql.substring(0, sql.length - 1);
                    sql = sql + ", _id varchar(255) not null" + FKField + ", PRIMARY KEY (_id)" + FKLink + ")";
                    con.query(sql, function (err, result) {
                        if (err) {
                            res.status = 500;
                            res.text = err;
                            //con.end();
                            cb(res);
                            return;

                        }
                        ;
                        res.status = 200;
                        res.text = 'Table created!';
                        //con.end();
                        cb(res);
                    });
                }

            });
            //}
        } else {

            res.status = 500;
            res.text = "Object not found!";
            //con.end();
            cb(res);
            return;


        }
    });



    //});

    //cb(res);


//<--db/////////////////////////

}
app.post('/build', function (req, resp) {

    var objectData = (req.body);
    if (req.body.id) {


        buildObject(objectData.id, req.body.tpId, function (data) {
            //console.log(JSON.stringify(data));
            resp.send(data);
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

    //var con = getMySQLConnection();
    //console.log(con);
//    con.connect(function (err) {
//        if (err)
//            res.end(JSON.stringify(err));

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
    //});
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
    //var con = getMySQLConnection();
//    con.connect(function (err) {
//        if (err) {
//
//            res.end(JSON.stringify(err));
//        }
//
//
//    });

    var tableName = req.params.tableName;
    var action = req.params.action;

    if (action === 'post') {
        sqlStr = "INSERT INTO " + tableName + " (";
        for (i = 0; i < Object.keys(req.body).length; i++) {
            if (Object.keys(req.body)[i] == 'an') {
                continue;
            }
            if (Object.keys(req.body)[i].indexOf('edt_') === 0) {
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
            if (Object.keys(req.body)[i].indexOf('edt_') === 0) {
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
            //con.destroy();
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
            if (Object.keys(req.body)[i].indexOf('edt_') === 0) {
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
            //con.destroy();
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
            //con.destroy();
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

        //sqlStr = "select * from " + tableName;
        //sqlStr = "select "+tableName+"._id,";
        sqlStr = "select " + tableName + ".*,";

        //////left joins for edt

        var query = MetaData.findOne({name: tableName});
        query.exec(function (err, doc) {
            if (!doc) {
                res.end(JSON.stringify("Metadata for object " + tableName + " not found!"));
                return;
            }
            var lj = '';

            for (var i = 0; i < doc.listForm.length; i++) {
                if (doc.listForm[i].type === "Extend") {

                    var extData = doc.listForm[i].edtType;
                    var edtTableName = extData.objectName;
                    lj = lj + " left join " + edtTableName + " as t" + i + " on t" + i + "._id = " + tableName + "." + doc.listForm[i].fieldId;
                    sqlStr = sqlStr + "t" + i + ".name as edt_" + doc.listForm[i].fieldId + ",";
                }
//                else {
//                    sqlStr = sqlStr + tableName+"."+doc.listForm[i].fieldId + ","
//                }

            }
            sqlStr = sqlStr.substring(0, sqlStr.length - 1);
            sqlStr = sqlStr + " from " + tableName;
            sqlStr = sqlStr + lj;


            if (id) {
                sqlStr = sqlStr + " where _id =  '" + id + "'";
            } else {
                sqlStr = sqlStr + " " + str;
            }

            console.log(sqlStr);
            con.query(sqlStr, function (err, result) {
                if (err) {

                    res.end(JSON.stringify(err));
                }
                res.end(JSON.stringify(result));
                //con.destroy();

            });
        });
        ////////////////////////




    }
    if (action === 'get_columns') {


        sqlStr = "DESC " + tableName;
        con.query(sqlStr, function (err, result) {
            if (err)
                res.end(JSON.stringify(err));



            //console.log(JSON.stringify(columns));
            res.end(JSON.stringify(result));
            //con.destroy();
        });


    }

    if (action === 'drop_table') {

        var resBE = {};
        sqlStr = "DROP table " + tableName;
        con.query(sqlStr, function (err, result) {
            if (err) {
                resBE.status = 500;
                resBE.result = JSON.stringify(err);
                res.end(JSON.stringify(resBE));
            }



            //console.log(JSON.stringify(columns));
            resBE.status = 200;
            resBE.result = JSON.stringify(result);
            res.end(JSON.stringify(resBE));
            //con.destroy();
        });


    }
//    con.destroy(function (err) {
//        if (err) {
//            return console.log("Ошибка: " + err.message);
//        }
//    });

});

//////////////////////////////////////////////
class FormRenderer {

    constructor(doc) {
        this.doc = doc;
        this.code = "";
        //this.html = "";
        //this.parcel = {};
        this.layout_struct = {};
        this.structure = doc.elementForm;
        if (this.structure[0]) {



            this.fillLayoutNode(this.structure[0], this.layout_struct);
            var layoutContId = this.structure[0].id;
            this.code = "var mainLayout = new dhx.Layout('" + layoutContId + "', " + JSON.stringify(this.layout_struct) + ");\n" + this.code;

            //this.code = "<script>\n"+this.code;
            //this.html = "<div id='"+layoutContId+"' ></div>\n";
            //this.code += "</script>\n";

            //this.parcel.code = this.code;
            //this.parcel.html = this.html;
        }

    }

    fillLayoutNode(structure, layoutObj) {
        if (structure) {
            for (var i = 0; i < structure.items.length; i++) {

                if (structure.items[i].id.indexOf('rows_') === 0) {

                    layoutObj.rows = [];
                    //console.log(JSON.stringify(layoutObj));
                    this.fillLayoutNode(structure.items[i], layoutObj.rows);
                }
                if (structure.items[i].id.indexOf('cols_') === 0) {
                    layoutObj.cols = [];
                    //console.log(JSON.stringify(layoutObj));
                    this.fillLayoutNode(structure.items[i], layoutObj.cols)
                }
                if (structure.items[i].id.indexOf('cell_') === 0) {
                    var cell = {};
                    cell.id = structure.items[i].id;
                    layoutObj.push(cell);
                    //console.log(JSON.stringify(layoutObj));
                    this.fillLayoutNode(structure.items[i], layoutObj[layoutObj.length - 1]);
                }
                if (structure.items[i].id.indexOf('form_') === 0) {
                    var formConf = {};
                    this.renderForm(structure.items[i], formConf);
                    var formName = structure.items[i].id.split('-').join('');

                    this.code += "var " + formName + " = new dhx.Form(null, " + JSON.stringify(formConf) + ");\n";
                    this.code += "mainLayout.cell('" + structure.id + "').attach(" + formName + ");\n";

                }

            }
        }
    }

    renderForm(structure, formConf) {
        //var formConf = {};

        if (structure.items) {
            for (var i = 0; i < structure.items.length; i++) {

                if (structure.items[i].id.indexOf('formrows_') === 0) {

                    formConf.rows = [];
                    //console.log(JSON.stringify(layoutObj));
                    this.renderForm(structure.items[i], formConf.rows);
                }
                if (structure.items[i].id.indexOf('formcols_') === 0) {
                    formConf.cols = [];
                    //console.log(JSON.stringify(layoutObj));
                    this.renderForm(structure.items[i], formConf.cols)
                }
                if (structure.items[i].id.indexOf('gf_') === 0) {
                    var cell = {};
                    cell.id = structure.items[i].id;
                    //cell.cellCss = "dhx_layout-cell--bordered";
                    cell.padding = "10px";
                    cell.align = "start";
                    formConf.push(cell);
                    //console.log(JSON.stringify(layoutObj));
                    this.renderForm(structure.items[i], formConf[formConf.length - 1]);
                }
                if (structure.items[i].id.indexOf('fld_') === 0) {
                    var cell = {};
                    cell.id = structure.items[i].value;
                    //cell.width = "150px";
                    cell.gravity = false;
                    cell.labelInline = true;

                    var dataField = {};
                    for (var k = 0; k < this.doc.fields.length; k++) {
                        if (this.doc.fields[k].fieldId === cell.id) {
                            dataField = this.doc.fields[k];
                            //console.log(JSON.stringify(dataField));
                            break;
                        }

                    }
                    cell.placeholder = dataField.alias;
                    cell.help = dataField.helpText;
                    if (dataField.type === 'String' || dataField.type === 'Extend') {
                        cell.type = 'input';
                        cell.label = dataField.alias;
                        cell.cellCss = "ht";
                    }
                    if (dataField.type === 'Integer') {
                        cell.type = 'input';
                        cell.label = dataField.alias;
                        cell.cellCss = "ht";
                        cell.validation = "integer";
                    }
                    if (dataField.type === 'Numeric') {
                        cell.type = 'input';
                        cell.label = dataField.alias;
                        cell.cellCss = "ht";
                        cell.validation = "numeric";
                    }
                    if (dataField.type === 'Date') {
                        cell.type = "datepicker";
                        cell.label = dataField.alias;
                        cell.cellCss = "ht";
                        
                        cell.weekStart = 'monday';
                        cell.dateFormat = '%d.%m.%Y %H:%i';
                        cell.timePicker = true;
                        cell.timeFormat = 24;
                    }
                    formConf.push(cell);
                    //console.log(JSON.stringify(layoutObj));
                    this.renderForm(structure.items[i], formConf[formConf.length - 1]);
                }


            }
        }

    }

}



//function renderForm(structure) {
//    var formConf = {};
//
//    return formConf;
//}

//function fillLayoutNode(structure, layoutObj) {
//    if (structure.items) {
//        for (var i = 0; i < structure.items.length; i++) {
////        if (structure.items[i].id.indexOf('cell_') === 0) {
////            var cell = {};
////            cell.id = structure.items[i].id;
////            currLSArr.push(cell);
////        }
//            if (structure.items[i].id.indexOf('rows_') === 0) {
//
//                layoutObj.rows = [];
//                //console.log(JSON.stringify(layoutObj));
//                fillLayoutNode(structure.items[i], layoutObj.rows);
//            }
//            if (structure.items[i].id.indexOf('cols_') === 0) {
//                layoutObj.cols = [];
//                //console.log(JSON.stringify(layoutObj));
//                fillLayoutNode(structure.items[i], layoutObj.cols)
//            }
//            if (structure.items[i].id.indexOf('cell_') === 0) {
//                var cell = {};
//                cell.id = structure.items[i].id;
//                layoutObj.push(cell);
//                //console.log(JSON.stringify(layoutObj));
//                fillLayoutNode(structure.items[i], layoutObj[layoutObj.length - 1]);
//            }
//
//        }
//    }
//}

//function parseObj(doc, cb) {
//    var code = "";
//    var layout_struct = {};
//    var structure = doc.elementForm;
//    //fillLayoutNode(doc.elementForm[0].id, structure[0], layout_struct);
////    if (structure[0].items[0].id.indexOf('rows_') === 0) {
////        layout_struct.rows = [];
////        fillLayoutNode(structure[0].items[0], layout_struct.rows);
////
////    } else {
////        layout_struct.cols = [];
////        fillLayoutNode(structure[0].items[0], layout_struct.cols);
////    }
//    fillLayoutNode(structure[0], layout_struct);
//
//
//    //console.log(JSON.stringify(layout_struct));
//
//    code += "var mainLayout = new dhx.Layout(null, " + JSON.stringify(layout_struct) + ");\n";
//    cb(code);
//}

app.get('/formrender/:id', function (req, res) {


    var query = MetaData.findById(req.params.id);
    query.exec(function (err, doc) {
        if (err)
        {
            res.end(JSON.stringify(err));
            return;
        }

//        parseObj(doc, function (data) {
//            res.send(data);
//        });
        var fr = new FormRenderer(doc);
        res.send(fr.code);

    });




});


