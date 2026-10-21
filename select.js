module.exports = function(){
    let Select = Object.getPrototypeOf(fw).Select = class Select extends fw.Component{
        static {
            this.debug = true;
            this.createdAt  = "3.0.0";
            this.lastUpdate = "3.0.0";
            this.version = "1.0.0";
            this.tpl = utils.htmlToNode(require('bundle-tpl:./select.html')).outerHTML;
            // this.describe();
        }
        onCreate(){
            // do thing after element's creation
        }
    }
    return Select;
}