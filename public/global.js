//-->ListForm//////////////////////////////////////////////////////////////////////
var editCell = {};
var rh = 23;
var hh = 23;
function showListForm(id, mode, cb) {
    var needSave = false;
    var selectItem = null;
    var editCell = {};
    var rh = 23;
    var hh = 23;
    getObject(id, function (object) {
        //alert(object.name);
        var dhxWindow = new dhx.Window({
            title: object.name,
            modal: mode,
            resizable: true,
            movable: true,
            minHeight: 500,
            minWidth: 500,
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
                                    var newItem = {};
                                    for (var i = 0; i < object.listForm.length; i++) {
                                        newItem[object.listForm[i].fieldId] = "";
                                        if (object.listForm[i].autoIncrement) {
                                            newItem[object.listForm[i].fieldId] = maxObj['max(' + object.listForm[i].fieldId + ')'] + 1;
                                        }
                                    }
                                    //alert(JSON.stringify(newItem));


                                    grid.data.add(newItem);
                                    //grid.scrollTo(newItem.id,"id");
                                    needSave = true;

                                }
                            });
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
                                    }
                                });

                            }
                        });
                    }

                }
            });
        }//edit mode end
        var cols = [];
        for (var i = 0; i < object.listForm.length; i++) {
            var field = object.listForm[i];
            var newField = {};
            newField.id = field.fieldId;
            newField.header = field.alias;
            if (field.type === "String") {
                newField.width = 200;
            } else {
                newField.width = 100;
            }
            cols.push(newField);

        }

        var grid = new dhx.Grid(null, {
            columns: cols,
            headerRowHeight: hh + 2,
            rowHeight: rh + 2,
            //data: dataset,
            selection: "complex",
            height: 300
        });



        grid.events.on("CellDblClick", function (row, column, e) {
            //alert(row.id+" "+column.id);
            if (!mode) {
                editCell.r = row.id;
                editCell.c = column.id;
                grid.edit(row.id, column.id);
                var isEDT = false;
                var edtField = {};
                for (var i = 0; i < object.listForm.length; i++) {
                    if (object.listForm[i].fieldId === column.id && object.listForm[i].type === "Extend") {
                        isEDT = true;
                        edtField = object.listForm[i];
                        break;
                    }
                }
                if (isEDT) {

                    if ($(".dhx_grid-body")[0].getBoundingClientRect().x + $(".dhx_grid-body")[0].getBoundingClientRect().width >= e.target.getBoundingClientRect().x + e.target.getBoundingClientRect().width) {
                        //var rect = grid.getCellRect(row.id, column.id);
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
                        btn.style.left = (f.offsetWidth - rh - 1) + 'px';
                        btn.style.position = 'absolute';
                        btn.style.height = btn.style.width = rh + 'px';
                        f.appendChild(btn);
                        btn.onclick = function(){
                            var edtData = edtField.edtType;
                            showListForm(edtData.objectName, true, function(data){
                                selectItem[column.id] = data.id;
                                selectItem[column.id].title = 'mama';
                                grid.paint();
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
            selectItem = row;
        });
        grid.events.on("CellClick", function (row, column, e) {
            selectItem = row;
            if (row.id != editCell.r | column.id != editCell.c) {
                $('#editButton').remove();
            }

        });

        $(".dhx_grid-body").on('scroll', function () {
            $('#editButton').remove();
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

//-->Meta/////////////////////////////////////////////////////////////////////

function saveObject(objectModel, callform) {
    $.ajax({
        type: "post",
        //async: false,
        url: "/metadata",
        //headers: {"Access-Control-Allow-Origin": "*"},
        data: objectModel,
        success: function (data) {
            if (data.status === 200) {
                alert('Saved!');
                callform.destructor();
                loadTree(data.doc._id);
            } else {
                alert(data);
            }

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
function updateObject(objectModel, callform, promise) {
    objectModel.__v++;
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
            promise(data);
            if (data.status === 200) {
                //alert('Updated!');
                callform.destructor();
            } else {
                alert(data);
            }


        }
    });
}
;
//<--Meta///////////////////////////////////////////////////////////////////////