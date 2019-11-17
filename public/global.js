//-->ListForm//////////////////////////////////////////////////////////////////////
var editCell = {};
var rh = 23;
var hh = 23;

function buildTableLayout(id, mode, cb) {
    var needSave = false;
    var selectItem = null;
    var selectCol = null;
    var editCell = {};
    var rh = 23;
    var hh = 23;
    getObject(id, function (object) {
        //alert(object.name);
//        $(".dhx_popup--window_active").removeClass("dhx_popup--window_active");
//        var dhxWindow = new dhx.Window({
//            title: object.alias,
//            modal: mode,
//            resizable: true,
//            movable: true,
//            minHeight: 500,
//            minWidth: 700,
//            closable: true
//
//
//        });
        var layout = new dhx.Layout(null, {
            rows: [
                {id: "toolBar"},
                {id: "content"}
            ]
        });
        if (!mode) {
            var toolbar = new dhx.Toolbar(null);
            var data = [
                {
                    type: "button",
                    icon: "dxi-plus",
                    size: "small",
                    value: "",
                    id: 'add'
                },

                {
                    type: "button",
                    icon: "dxi-vault",
                    size: "small",
                    value: "",
                    id: 'save'
                },
                {
                    type: "button",
                    icon: "fa fa-edit",
                    size: "small",
                    value: "",
                    id: 'edit'
                },
                {
                    type: "button",
                    icon: "dxi-delete",
                    size: "small",
                    value: "",
                    id: 'delete'
                },
                {
                    type: "button",
                    icon: "fa fa-retweet",
                    size: "small",
                    value: "",
                    id: 'refresh'
                }
            ];
            toolbar.data.parse(data);


            layout.cell("toolBar").attach(toolbar);
            toolbar.events.on("Click", function (id, e) {
                if (id === "add") {
                    if (needSave) {
                        alert('Save prefer record!');
                        return;
                    }
                    var formEditMode = object.formEditMode;
                    if (formEditMode) {

                    } else {
                        var parcel = {table: '', fields: ''};

                        parcel.table = object.name;
                        for (var i = 0; i < object.listForm.length; i++) {
                            if (object.listForm[i].autoIncrement) {
                                parcel.fields = parcel.fields + object.listForm[i].fieldId + ",";
                            }
                        }
                        parcel.fields = parcel.fields.substring(0, parcel.fields.length - 1);
                        //alert(JSON.stringify(parcel));
                        var newItem = {};
                        for (var i = 0; i < object.listForm.length; i++) {
                            if (object.listForm[i].type === 'Integer' || object.listForm[i].type === 'Numeric') {
                                newItem[object.listForm[i].fieldId] = 0;
                            } else {
                                newItem[object.listForm[i].fieldId] = null;
                            }
                        }
                        if (parcel.fields.length > 0) {
                            $.ajax({
                                type: "post",
                                //async: false,
                                url: "/getMax",
                                data: parcel,
                                //headers: {"Access-Control-Allow-Origin": "*"},

                                success: function (data) {

                                    var maxVals = JSON.parse(data);
                                    var maxObj = {};
                                    for (var i = 0; i < maxVals.length; i++) {
                                        maxObj[Object.keys(maxVals[i])[0]] = maxVals[i][Object.keys(maxVals[i])[0]];
                                    }
                                    //alert(JSON.stringify(maxObj));

                                    for (var i = 0; i < object.listForm.length; i++) {
                                        //newItem[object.listForm[i].fieldId] = "";
                                        if (object.listForm[i].autoIncrement) {
                                            newItem[object.listForm[i].fieldId] = maxObj['max(' + object.listForm[i].fieldId + ')'] + 1;
                                        }
                                    }
                                    //alert(JSON.stringify(newItem));
                                    grid.data.add(newItem);
                                    grid.selection.setCell(newItem.id, selectCol.id);
                                    //grid.scrollTo(newItem.id,"id");
                                    needSave = true;



                                }
                            });
                        } else {
                            newItem.id = '';
                            grid.data.add(newItem);
                            grid.selection.setCell(newItem.id, "name");
                            //grid.scrollTo(newItem.id,"id");
                            needSave = true;
                        }
                    }

                }
                if (id === "edit") {
                    var formEditMode = object.formEditMode;
                    if (formEditMode) {

                    } else {
                        alert("Inline editing for this object!");
                    }
                }
                if (id === "delete") {
                    if (selectItem === null) {
                        alert("Select record!");
                        return;
                    } else {
                        if (confirm("Delete record?")) {
                            if (selectItem._id) {

                                $.ajax({
                                    type: "post",
                                    //async: false,
                                    url: "/table/" + object.name + "/action/delete",
                                    //headers: {"Access-Control-Allow-Origin": "*"},
                                    data: selectItem,
                                    success: function (data) {
                                        if (data.indexOf('errno') > -1) {
                                            alert(data);
                                            return;
                                        }

                                        $.ajax({
                                            type: "post",
                                            //async: false,
                                            url: "/table/" + object.name + "/action/get",
                                            //headers: {"Access-Control-Allow-Origin": "*"},

                                            success: function (data) {
                                                grid.data.parse(JSON.parse(data));
                                                grid.data.sort({
                                                    by: "id",
                                                    dir: "asc"

                                                });

                                            }
                                        });
                                    }
                                });

                            }
                            grid.data.remove(selectItem.id);
                            needSave = false;
                        }
                    }
                }
                if (id === "refresh") {
                    $.ajax({
                        type: "post",
                        //async: false,
                        url: "/table/" + object.name + "/action/get",
                        //headers: {"Access-Control-Allow-Origin": "*"},

                        success: function (data) {
                            grid.data.parse(JSON.parse(data));
                            grid.data.sort({
                                by: "id",
                                dir: "asc"

                            });
                            needSave = false;
                        }
                    });
                }
                if (id === "save") {

                    if (selectItem._id) {
                        $.ajax({
                            type: "post",
                            //async: false,
                            data: selectItem,
                            url: "/table/" + object.name + "/action/put",
                            //headers: {"Access-Control-Allow-Origin": "*"},

                            success: function (data) {
                                if (data.indexOf('errno') > -1) {
                                    alert(data);
                                    return;
                                }

                                $.ajax({
                                    type: "post",
                                    //async: false,
                                    url: "/table/" + object.name + "/action/get",
                                    //headers: {"Access-Control-Allow-Origin": "*"},

                                    success: function (data) {
                                        grid.data.parse(JSON.parse(data));
                                        grid.data.sort({
                                            by: "id",
                                            dir: "asc"

                                        });
                                        needSave = false;

                                    }
                                });

                            }
                        });
                    } else {
                        $.ajax({
                            type: "post",
                            //async: false,
                            data: selectItem,
                            url: "/table/" + object.name + "/action/post",
                            //headers: {"Access-Control-Allow-Origin": "*"},

                            success: function (data) {
                                if (data.indexOf('errno') > -1) {
                                    alert(data);
                                    return;
                                }
                                $.ajax({
                                    type: "post",
                                    //async: false,
                                    url: "/table/" + object.name + "/action/get",
                                    //headers: {"Access-Control-Allow-Origin": "*"},

                                    success: function (data) {
                                        grid.data.parse(JSON.parse(data));
                                        grid.data.sort({
                                            by: "id",
                                            dir: "asc"

                                        });
                                        needSave = false;
                                        grid.selection.setCell(selectItem.id, selectCol.id);
                                    }
                                });

                            }
                        });
                    }

                }
            });
        }//edit mode end
        else {
            //dhxWindow.css = 'zi';
        }
        var cols = [];
        for (var i = 0; i < object.listForm.length; i++) {
            var field = object.listForm[i];
            var newField = {};

            if (field.type === "String" || field.type === "Extend") {
                newField.width = 300;
                //newField.maxWidth  = 350;
            } else {
                newField.width = 120;
                //newField.maxWidth  = 250;
            }
            if (field.type === 'Extend') {
//                newField.template = function (cellValue, row, col) {
//                    if (row.edt_mainwarehouse!=='') {
//                        //alert(JSON.stringify(row));
//                        //cellValue = row["edt_"+field.fieldId];
//                        cellValue = row.edt_mainwarehouse;
//                        return cellValue;
//                    }
//                    
//                };
                newField.id = "edt_" + field.fieldId;
                newField.header = field.alias;
            } else {
                newField.id = field.fieldId;
                newField.header = field.alias;
            }
            cols.push(newField);

        }

        var grid = new dhx.Grid(null, {
            columns: cols,
            headerRowHeight: hh + 2,
            rowHeight: rh + 2,
            //data: dataset,
            selection: "complex",
            resizable: true
                    //height: 200,

                    //columnsAutoWidth : true
                    //fitToContainer : true

        });



        grid.events.on("CellDblClick", function (row, column, e) {
            selectItem = row;
            selectCol = column;
            editCell.r = row.id;
            editCell.c = column.id;
            //alert(row.id+" "+column.id);
            if (!mode) {

                grid.edit(row.id, column.id);
                var isEDT = false;
                var edtField = {};
                for (var i = 0; i < object.listForm.length; i++) {
                    if ("edt_" + object.listForm[i].fieldId === column.id && object.listForm[i].type === "Extend") {
                        isEDT = true;
                        edtField = object.listForm[i];
                        break;
                    }
                }
                if (isEDT) {

                    //if ($(".dhx_grid-body")[0].getBoundingClientRect().x + $(".dhx_grid-body")[0].getBoundingClientRect().width >= e.target.getBoundingClientRect().x + e.target.getBoundingClientRect().width) {
                    //var rect = grid.getCellRect(row.id, column.id);
                    if (true) {

                        var rect = null;
                        //alert(e.target.parentNode.className);
                        if (e.target.parentNode.className.indexOf('dhx_grid-cell') > -1) {
                            rect = e.target.parentNode.getBoundingClientRect();
                            var f = e.target.parentNode;
                        } else {
                            rect = e.target.getBoundingClientRect();
                            var f = e.target;
                        }

                        var btn = document.createElement("button");
                        btn.setAttribute('id', "editButton");
                        btn.innerHTML = '...';
                        btn.style.top = '1px';
                        btn.style.zIndex = 0;
                        //btn.style.left = (f.offsetWidth - rh - 1) + 'px';
                        btn.style.right = 0;
                        btn.style.position = 'absolute';
                        btn.style.height = btn.style.width = rh + 'px';
                        f.appendChild(btn);

                        btn.onclick = function () {
                            var edtData = edtField.edtType;
                            showListForm(edtData.objectId, true, function (data) {
                                selectItem[column.id] = data.name;
                                selectItem[column.id.replace("edt_", "")] = data.id;
                                //selectItem[column.id].title = 'mama';
                                grid.paint();

                                toolbar.events.fire("Click", ["save"]);

                            })
                        };
                    }
                }


            } 
            
//            else {
//                var result = {};
//                result.id = row._id;
//                result.name = row.name;
//                cb(result);
//                win.hide();
//            }
        });
        grid.events.on("AfterEditEnd", function (value, row, column) {
//            selectItem = row;
//            selectCol = column;

        });
        grid.events.on("CellClick", function (row, column, e) {
            selectItem = row;
            selectCol = column;
            if (row.id != editCell.r | column.id != editCell.c) {

                $('#editButton').remove();
            }

        });

        $(".dhx_grid-body").on('scroll', function () {
            //$('#editButton').remove();
        });

        $(".dhx_grid-header-cell").click(function () {

            $('#editButton').remove();
        });
        $.ajax({
            type: "post",
            //async: false,
            url: "/table/" + object.name + "/action/get",
            //headers: {"Access-Control-Allow-Origin": "*"},

            success: function (data) {
                grid.data.parse(JSON.parse(data));
                grid.data.sort({
                    by: "id",
                    dir: "asc"

                });
            }
        });

        layout.cell("content").attach(grid);
        cb(layout);

//        dhxWindow.attach(layout);
//        var toFull = true;
//
//        dhxWindow.events.on("HeaderDoubleclick", function () {
//
//
//            if (toFull) {
//                dhxWindow.fullScreen();
//            } else {
//
//                dhxWindow.setSize(restore.width, restore.height);
//
//
//            }
//            toFull = !toFull;
//        });
//
//        dhxWindow.show();
//        var restore = dhxWindow.getSize();




    });
}
function showListForm(id, mode, cb) {
    var needSave = false;
    var selectItem = null;
    var selectCol = null;
    var editCell = {};
    var rh = 23;
    var hh = 23;
    getObject(id, function (object) {
        //alert(object.name);
        $(".dhx_popup--window_active").removeClass("dhx_popup--window_active");
        var dhxWindow = new dhx.Window({
            title: object.alias,
            modal: mode,
            resizable: true,
            movable: true,
            minHeight: 500,
            minWidth: 700,
            closable: true


        });
        var layout = new dhx.Layout(null, {
            rows: [
                {id: "toolBar"},
                {id: "content"}
            ]
        });
        if (!mode) {
            var toolbar = new dhx.Toolbar(null);
            var data = [
                {
                    type: "button",
                    icon: "dxi-plus",
                    size: "small",
                    value: "",
                    id: 'add'
                },

                {
                    type: "button",
                    icon: "dxi-vault",
                    size: "small",
                    value: "",
                    id: 'save'
                },
                {
                    type: "button",
                    icon: "fa fa-edit",
                    size: "small",
                    value: "",
                    id: 'edit'
                },
                {
                    type: "button",
                    icon: "dxi-delete",
                    size: "small",
                    value: "",
                    id: 'delete'
                },
                {
                    type: "button",
                    icon: "fa fa-retweet",
                    size: "small",
                    value: "",
                    id: 'refresh'
                }
            ];
            toolbar.data.parse(data);


            layout.cell("toolBar").attach(toolbar);
            toolbar.events.on("Click", function (id, e) {
                if (id === "add") {
                    if (needSave) {
                        alert('Save prefer record!');
                        return;
                    }
                    var formEditMode = object.formEditMode;
                    if (formEditMode) {

                    } else {
                        var parcel = {table: '', fields: ''};

                        parcel.table = object.name;
                        for (var i = 0; i < object.listForm.length; i++) {
                            if (object.listForm[i].autoIncrement) {
                                parcel.fields = parcel.fields + object.listForm[i].fieldId + ",";
                            }
                        }
                        parcel.fields = parcel.fields.substring(0, parcel.fields.length - 1);
                        //alert(JSON.stringify(parcel));
                        var newItem = {};
                        for (var i = 0; i < object.listForm.length; i++) {
                            if (object.listForm[i].type === 'Integer' || object.listForm[i].type === 'Numeric') {
                                newItem[object.listForm[i].fieldId] = 0;
                            } else {
                                newItem[object.listForm[i].fieldId] = null;
                            }
                        }
                        if (parcel.fields.length > 0) {
                            $.ajax({
                                type: "post",
                                //async: false,
                                url: "/getMax",
                                data: parcel,
                                //headers: {"Access-Control-Allow-Origin": "*"},

                                success: function (data) {

                                    var maxVals = JSON.parse(data);
                                    var maxObj = {};
                                    for (var i = 0; i < maxVals.length; i++) {
                                        maxObj[Object.keys(maxVals[i])[0]] = maxVals[i][Object.keys(maxVals[i])[0]];
                                    }
                                    //alert(JSON.stringify(maxObj));

                                    for (var i = 0; i < object.listForm.length; i++) {
                                        //newItem[object.listForm[i].fieldId] = "";
                                        if (object.listForm[i].autoIncrement) {
                                            newItem[object.listForm[i].fieldId] = maxObj['max(' + object.listForm[i].fieldId + ')'] + 1;
                                        }
                                    }
                                    //alert(JSON.stringify(newItem));
                                    grid.data.add(newItem);
                                    grid.selection.setCell(newItem.id, selectCol.id);
                                    //grid.scrollTo(newItem.id,"id");
                                    needSave = true;



                                }
                            });
                        } else {
                            newItem.id = '';
                            grid.data.add(newItem);
                            grid.selection.setCell(newItem.id, "name");
                            //grid.scrollTo(newItem.id,"id");
                            needSave = true;
                        }
                    }

                }
                if (id === "edit") {
                    var formEditMode = object.formEditMode;
                    if (formEditMode) {

                    } else {
                        alert("Inline editing for this object!");
                    }
                }
                if (id === "delete") {
                    if (selectItem === null) {
                        alert("Select record!");
                        return;
                    } else {
                        if (confirm("Delete record?")) {
                            if (selectItem._id) {

                                $.ajax({
                                    type: "post",
                                    //async: false,
                                    url: "/table/" + object.name + "/action/delete",
                                    //headers: {"Access-Control-Allow-Origin": "*"},
                                    data: selectItem,
                                    success: function (data) {
                                        if (data.indexOf('errno') > -1) {
                                            alert(data);
                                            return;
                                        }

                                        $.ajax({
                                            type: "post",
                                            //async: false,
                                            url: "/table/" + object.name + "/action/get",
                                            //headers: {"Access-Control-Allow-Origin": "*"},

                                            success: function (data) {
                                                grid.data.parse(JSON.parse(data));
                                                grid.data.sort({
                                                    by: "id",
                                                    dir: "asc"

                                                });

                                            }
                                        });
                                    }
                                });

                            }
                            grid.data.remove(selectItem.id);
                            needSave = false;
                        }
                    }
                }
                if (id === "refresh") {
                    $.ajax({
                        type: "post",
                        //async: false,
                        url: "/table/" + object.name + "/action/get",
                        //headers: {"Access-Control-Allow-Origin": "*"},

                        success: function (data) {
                            grid.data.parse(JSON.parse(data));
                            grid.data.sort({
                                by: "id",
                                dir: "asc"

                            });
                            needSave = false;
                        }
                    });
                }
                if (id === "save") {

                    if (selectItem._id) {
                        $.ajax({
                            type: "post",
                            //async: false,
                            data: selectItem,
                            url: "/table/" + object.name + "/action/put",
                            //headers: {"Access-Control-Allow-Origin": "*"},

                            success: function (data) {
                                if (data.indexOf('errno') > -1) {
                                    alert(data);
                                    return;
                                }

                                $.ajax({
                                    type: "post",
                                    //async: false,
                                    url: "/table/" + object.name + "/action/get",
                                    //headers: {"Access-Control-Allow-Origin": "*"},

                                    success: function (data) {
                                        grid.data.parse(JSON.parse(data));
                                        grid.data.sort({
                                            by: "id",
                                            dir: "asc"

                                        });
                                        needSave = false;

                                    }
                                });

                            }
                        });
                    } else {
                        $.ajax({
                            type: "post",
                            //async: false,
                            data: selectItem,
                            url: "/table/" + object.name + "/action/post",
                            //headers: {"Access-Control-Allow-Origin": "*"},

                            success: function (data) {
                                if (data.indexOf('errno') > -1) {
                                    alert(data);
                                    return;
                                }
                                $.ajax({
                                    type: "post",
                                    //async: false,
                                    url: "/table/" + object.name + "/action/get",
                                    //headers: {"Access-Control-Allow-Origin": "*"},

                                    success: function (data) {
                                        grid.data.parse(JSON.parse(data));
                                        grid.data.sort({
                                            by: "id",
                                            dir: "asc"

                                        });
                                        needSave = false;
                                        grid.selection.setCell(selectItem.id, selectCol.id);
                                    }
                                });

                            }
                        });
                    }

                }
            });
        }//edit mode end
        else {
            //dhxWindow.css = 'zi';
        }
        var cols = [];
        for (var i = 0; i < object.listForm.length; i++) {
            var field = object.listForm[i];
            var newField = {};

            if (field.type === "String" || field.type === "Extend") {
                newField.width = 300;
                //newField.maxWidth  = 350;
            } else {
                newField.width = 120;
                //newField.maxWidth  = 250;
            }
            if (field.type === 'Extend') {
//                newField.template = function (cellValue, row, col) {
//                    if (row.edt_mainwarehouse!=='') {
//                        //alert(JSON.stringify(row));
//                        //cellValue = row["edt_"+field.fieldId];
//                        cellValue = row.edt_mainwarehouse;
//                        return cellValue;
//                    }
//                    
//                };
                newField.id = "edt_" + field.fieldId;
                newField.header = field.alias;
            } else {
                newField.id = field.fieldId;
                newField.header = field.alias;
            }
            cols.push(newField);

        }

        var grid = new dhx.Grid(null, {
            columns: cols,
            headerRowHeight: hh + 2,
            rowHeight: rh + 2,
            //data: dataset,
            selection: "complex",
            resizable: true
                    //height: 200,

                    //columnsAutoWidth : true
                    //fitToContainer : true

        });



        grid.events.on("CellDblClick", function (row, column, e) {
            selectItem = row;
            selectCol = column;
            editCell.r = row.id;
            editCell.c = column.id;
            //alert(row.id+" "+column.id);
            if (!mode) {

                grid.edit(row.id, column.id);
                var isEDT = false;
                var edtField = {};
                for (var i = 0; i < object.listForm.length; i++) {
                    if ("edt_" + object.listForm[i].fieldId === column.id && object.listForm[i].type === "Extend") {
                        isEDT = true;
                        edtField = object.listForm[i];
                        break;
                    }
                }
                if (isEDT) {

                    //if ($(".dhx_grid-body")[0].getBoundingClientRect().x + $(".dhx_grid-body")[0].getBoundingClientRect().width >= e.target.getBoundingClientRect().x + e.target.getBoundingClientRect().width) {
                    //var rect = grid.getCellRect(row.id, column.id);
                    if (true) {

                        var rect = null;
                        //alert(e.target.parentNode.className);
                        if (e.target.parentNode.className.indexOf('dhx_grid-cell') > -1) {
                            rect = e.target.parentNode.getBoundingClientRect();
                            var f = e.target.parentNode;
                        } else {
                            rect = e.target.getBoundingClientRect();
                            var f = e.target;
                        }

                        var btn = document.createElement("button");
                        btn.setAttribute('id', "editButton");
                        btn.innerHTML = '...';
                        btn.style.top = '1px';
                        btn.style.zIndex = 0;
                        //btn.style.left = (f.offsetWidth - rh - 1) + 'px';
                        btn.style.right = 0;
                        btn.style.position = 'absolute';
                        btn.style.height = btn.style.width = rh + 'px';
                        f.appendChild(btn);

                        btn.onclick = function () {
                            var edtData = edtField.edtType;
                            showListForm(edtData.objectId, true, function (data) {
                                selectItem[column.id] = data.name;
                                selectItem[column.id.replace("edt_", "")] = data.id;
                                //selectItem[column.id].title = 'mama';
                                grid.paint();

                                toolbar.events.fire("Click", ["save"]);

                            })
                        };
                    }
                }


            } else {
                var result = {};
                result.id = row._id;
                result.name = row.name;
                cb(result);
                dhxWindow.hide();
            }
        });
        grid.events.on("AfterEditEnd", function (value, row, column) {
//            selectItem = row;
//            selectCol = column;

        });
        grid.events.on("CellClick", function (row, column, e) {
            selectItem = row;
            selectCol = column;
            if (row.id != editCell.r | column.id != editCell.c) {

                $('#editButton').remove();
            }

        });

        $(".dhx_grid-body").on('scroll', function () {
            //$('#editButton').remove();
        });

        $(".dhx_grid-header-cell").click(function () {

            $('#editButton').remove();
        });
        $.ajax({
            type: "post",
            //async: false,
            url: "/table/" + object.name + "/action/get",
            //headers: {"Access-Control-Allow-Origin": "*"},

            success: function (data) {
                grid.data.parse(JSON.parse(data));
                grid.data.sort({
                    by: "id",
                    dir: "asc"

                });
            }
        });

        layout.cell("content").attach(grid);

        dhxWindow.attach(layout);
        var toFull = true;

        dhxWindow.events.on("HeaderDoubleclick", function () {


            if (toFull) {
                dhxWindow.fullScreen();
            } else {

                dhxWindow.setSize(restore.width, restore.height);


            }
            toFull = !toFull;
        });

        dhxWindow.show();
        var restore = dhxWindow.getSize();




    });
}

//<--ListForm//////////////////////////////////////////////////////////////////////

//-->ElementForm
function showElementForm(id, cb) {

}
//<--ElementForm

//-->Meta/////////////////////////////////////////////////////////////////////

function saveObject(objectModel, cb) {
    $.ajax({
        type: "post",
        //async: false,
        url: "/metadata",
        //headers: {"Access-Control-Allow-Origin": "*"},
        data: objectModel,
        success: function (data) {
            cb(data);


        }
    });
}
;
function getObject(id, promise) {

    $.ajax({
        type: "get",
        async: false,
        url: "/metadata/" + id,
        //headers: {"Access-Control-Allow-Origin": "*"},

        success: function (data) {
            promise(data);


        }
    });

}
;
function updateObject(objectModel, cb) {
    //objectModel.__v++;
    objectModel.changed = true;
    $.ajax({
        type: "put",
        //async: false,
        url: "/metadata",
        //headers: {"Access-Control-Allow-Origin": "*"},
        data: JSON.stringify(objectModel),
        //data: objectModel,
//                    dataType: 'json',
        contentType: 'application/json',
        success: function (data) {
            cb(data);



        }
    });
}
;
//<--Meta///////////////////////////////////////////////////////////////////////