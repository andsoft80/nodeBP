
var layout = new dhx.Layout(null, { rows:[{id:"main"}]});var form = new dhx.Form(null, {rows: [{"id":"name","type":"input","label":"Name","icon":"dxi-magnify","placeholder":"Andrey Saulin"},{"id":"email","type":"input","label":"Email","placeholder":"jd@mail.name"},{"id":"password","type":"input","label":"Password","placeholder":"Enter password"},{"type":"checkbox","label":"Save session","name":"agree","labelInline":true,"id":"savesession","value":"checkboxvalue"}]});form.events.on("ButtonClick", function(id,e){
  alert(id);
});
form.events.on("Change",function(id, new_value){
 
 console.log(new_value);
});layout.cell("main").attach(form);export {layout as form};