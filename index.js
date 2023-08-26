import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";

const app = express();
const port = 3000;


const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const month = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const d = new Date();
var day = weekday[d.getDay()];
var textMonth = month[d.getMonth()];
let defaultItems;

const itemSchema = new mongoose.Schema({
    name : String
});

const Item = mongoose.model("Item", itemSchema);

const listSchema = new mongoose.Schema({
    name : String,
    items : [itemSchema]
});

const List = mongoose.model("List", listSchema);

const item1 = new Item(
    {
        name : "Welcome to your to do list!"
    }
);

const item2 = new Item(
    {
        name : "Hit the + button to add a new item."
    }
);

const item3 = new Item(
    {
        name : "<-- Hit this to delete an item."
    }
);
defaultItems = [item1,item2,item3];

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");

}



app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", async(req,res) => {
  
    const foundItems = await Item.find({});

    if(foundItems.length === 0 )
    {
        await Item.insertMany(defaultItems);
        res.redirect("/");
    }else{
        res.render("index.ejs",{day,textMonth,newListItems:foundItems,listTitle :"Today"});
    }
    
    
});


app.get("/:customListName", async(req, res) =>{
    const customListName = _.capitalize(req.params.customListName);

    const foundList = await List.findOne({name : customListName});

    if(!foundList)
    {
        const list = new List({
        name : customListName,
        items : defaultItems
        });
         list.save();
        res.redirect("/" + customListName);
    }
    else{
        res.render("index.ejs", {listTitle : foundList.name, newListItems:foundList.items});
    }

});

app.post("/", async(req, res) =>  {
    const itemName = req.body.newToDo;
    const listName = req.body.list;

    const item = new Item({
        name : itemName
    });

    if(listName === "Today"){
        item.save();
        res.redirect("/");
    }else{
        const foundList = await List.findOne({name : listName});

        foundList.items.push(item);
        foundList.save();
        res.redirect("/"+ listName);
    }


});

app.post("/delete", async(req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        await Item.deleteOne({ _id: checkedItemId });
        console.log(checkedItemId);
        res.redirect("/");
    }
    else{
        try{
            await List.findOneAndUpdate({name: listName}, {$pull:{items: {_id:checkedItemId}}});
            res.redirect("/" + listName);
        }
        catch(error){
            console.log(error);
        }
        
    }
    
    
});


app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});



