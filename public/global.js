//-->ListForm//////////////////////////////////////////////////////////////////////
var editCell = {};
var rh = 23;
var hh = 23;
function showListForm(id, mode, cb) {
    getObject(id, function (object) {
        //alert(object.name);
        var dhxWindow = new dhx.Window({
            title: object.name,
            modal: mode,
            resizable: true,
            movable: true,
            minHeight: 300,
            minWidth: 500,
            closable: true
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
        }
        var layout = new dhx.Layout(null, {
            rows: [
                {id: "toolBar"},
                {id: "content"}
            ]
        });
        layout.cell("toolBar").attach(toolbar);

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

        $.ajax({
            type: "post",
            //async: false,
            url: "/table/" + object.name + "/action/get",
            //headers: {"Access-Control-Allow-Origin": "*"},

            success: function (data) {
                grid.data.parse(JSON.parse(data));

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

        toolbar.events.on("Click", function (id, e) {
            if (id === "add") {
                var inlineMode = object.inlineMode;

            }
            if (id === "refresh") {
                $.ajax({
                    type: "post",
                    //async: false,
                    url: "/table/" + object.name + "/action/get",
                    //headers: {"Access-Control-Allow-Origin": "*"},

                    success: function (data) {
                        grid.data.parse(JSON.parse(data));

                    }
                });
            }
        });


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