// FEATURES TODO
//  
// FEATURES DONE
// textual research
// positionnement du dropdown
// hide select element by default (style)
// option/optgroup attribut disabled
// optgroup
// select multiple
// remove mirror ondestroy
// fonction reset
// options dynamiques
// lock state
// select simple
// styles/classes options
// callbacks

module.exports = function(){
    let Select = Object.getPrototypeOf(fw).Select = class Select extends fw.Component{
        static {
            this.debug = false;
            this.createdAt  = "3.0.0";
            this.lastUpdate = "3.0.0";
            this.version = "1.0.0";
            this.tpl = utils.htmlToNode(require('bundle-tpl:./select.html')).outerHTML;
            this.selectionMultipleDisplayMode = 'scroll';
            this.minOptionsForSearch = 5;
            // this.describe();
        }
        onCreate(){
            let select = this;
            select.log('onCreate start')
            select.classes                      = select.classes                      ?? Array.from(select.el.classList);
            select.style                        = select.style                        ?? select.getAttr('style',false);
            select.multiple                     = select.multiple                     ?? select.el.multiple;
            select.disabled                     = select.disabled                     ?? select.el.disabled;
            select.placeholder                  = select.placeholder                  ?? select.getAttr('placeholder',select.multiple?' - ':false);
            select.lock                         = select.lock                         ?? select.getData('lock',false);
            select.onOpen                       = select.onOpen                       ?? window[select.getData('on-open',false)]    ?? function(){this.log('onOpen')};
            select.onClose                      = select.onClose                      ?? window[select.getData('on-close',false)]   ?? function(){this.log('onClose')};
            select.selectionMultipleDisplayMode = select.selectionMultipleDisplayMode ?? select.getData('selection-display-mode', Select.selectionMultipleDisplayMode);
            select.search                       = select.search                       ?? select.getData('search', select.el.options.length >= Select.minOptionsForSearch);
            

            // CONSTRUCT
            select.mirror    = utils.htmlToNode('<div class="select__mirror"></div>');
            select.selection = utils.htmlToNode('<div class="select__selection"></div>');
            select.options   = utils.htmlToNode('<div class="select__options"></div>');
            for(let c of select.classes)
                if (c != 'select')
                    select.mirror.classList.add(c);
            if (select.style)
                select.mirror.setAttribute('style',select.style)
            if (select.selectionMultipleDisplayMode == 'scroll')
                select.selection.classList.add('selection--scroll');

            select.el.after(select.mirror);
            select.mirror.append(select.selection);
            select.mirror.append(select.options);
            select.setOptions();

            if (select.multiple) select.mirror.classList.add('multiple');
            if (select.disabled) select.mirror.classList.add('disabled');
            select.mirror.component = select;

            // EVENTS
            select.selection.addEventListener('click',e=>{
                if (e.target.classList.contains('close') && e.target.closest('.option__selected')) {
                    e.target.closest('.option__selected').referer.selected = false;
                    select.el.trigger('change');
                } else {
                    if (!select.lock) select.toggle();
                }
            })
            document.addEventListener('click',e=>{
                var rect = select.mirror.getBoundingClientRect();
                var isInSelect = (rect.top <= event.clientY && event.clientY <= rect.top + rect.height && rect.left <= event.clientX && event.clientX <= rect.left + rect.width);
                if (!isInSelect && !event.target.closest('[class*=select__]')){
                    if (!select.lock) select.close();
                } 
            })
            select.options.addEventListener('click',e=>{
                if (e.target.classList.contains('select__option')) {
                    let option = e.target;
                    if (select.multiple) {
                        option.referer.selected = option.classList.contains('selected') ? false : true;
                    } else {
                        select.el.value = option.getAttribute('value');
                        if (!select.lock) select.close();
                    }
                    select.el.trigger('change');
                }
            })

            select.el.addEventListener('change',select.render);

            select.render();
            select.el.classList.add('hidden');
            select.log('onCreate end','',true)
            
            // DEBUG
            // select.open();
        }

        setOptions(){
            let select = this;
            select.log('setOptions');
            select.options.innerHTML = "";
            // if select has optgroups, append them to mirror
            select.el.querySelectorAll('optgroup').forEach((optgroup)=>{
                let group = utils.htmlToNode(`<div class="select__optgroup${optgroup.disabled?' disabled':''}"><label>${optgroup.getAttribute('label')}</label></div>`);
                optgroup.referer = group;
                group.referer = optgroup;
                select.options.append(group);
            })
            // mirroring each option
            for(let o of select.el.options){
                if (select.multiple && (o.getAttribute('value') == null || o.getAttribute('value') == '')) 
                    continue;
                if (o.getAttribute('value') == null)
                    o.setAttribute('value','')
                let option =  utils.htmlToNode(`<div class="select__option${o.selected?' selected':''} ${o.classList.toString()}" ${o.getAttribute('style')?'style="'+o.getAttribute('style')+'"':''} value="${o.value}">${o.innerHTML}</div>`);
                option.referer = o;
                o.referer = option;
                select.options.append(option);
                // if the option is part of an optgroup, move it
                if (o.closest('optgroup')?.referer)
                    o.closest('optgroup').referer.append(option)
            }
            if (select.options.querySelector('.select__optgroup')) {
                for(let c of select.el.children){
                    if (c.referer) 
                        select.options.append(c.referer)
                }
            }

            if (select.search) {
                select.searchInput = utils.htmlToNode('<input type="text" class="select__search">');
                select.searchInput.addEventListener('keyup',e=>{
                    select.renderSearch()
                });
                select.options.prepend(select.searchInput);
            }
        }

        render(){
            let select = this.component ?? this;
            select.log('render')
            // render selection
            if (select.multiple){
                select.selection.innerHTML = "";
                if (select.el.selectedOptions.length == 0){
                    select.selection.innerHTML = select.placeholder;
                }
                else {
                    for(let o of select.el.selectedOptions){
                        let option = utils.htmlToNode('<span class="tag option__selected">'+ o.innerHTML +'<i class="close"></i></span>');
                        option.referer = o;
                        select.selection.append(option);
                    }
                }
            } else {
                // console.log(select.el.selectedOptions);
                select.selection.innerHTML = select.el.selectedOptions[0].innerHTML;
            }

            // render options
            select.options.querySelectorAll('.select__option').forEach((o)=>{
                o.classList.remove('selected');
                if (select.el.querySelector('option[value="'+o.getAttribute('value')+'"]')?.selected) 
                    o.classList.add('selected')
            })
        }

        renderSearch(){
            let select = this;
            let strSearch = select.searchInput.value.trim().toLowerCase();
            if (strSearch != select.searchInput.oldvalue) {
                select.searchInput.oldvalue = strSearch;
                let arrOptionsValid = Array.from(select.options.querySelectorAll('.select__option')).filter(o=>{return o.innerHTML.toLowerCase().includes(strSearch);})
                select.options.querySelectorAll('.select__option').forEach((el)=>{
                    el.classList.remove('hidden');
                    if (!arrOptionsValid.includes(el))
                        el.classList.add('hidden');
                })
            } else {
                return;
            }
        }

        open(){
            this.log('open');
            this.mirror.classList.add('active');

            // check if options container is outside viewport at the bottom 
            this.options.classList.remove('options--top');
            let rect = this.options.getBoundingClientRect();
            if (rect.bottom > window.innerHeight)
                this.options.classList.add('options--top');

            if (this.search)
                this.searchInput.focus();

            this.onOpen();
        }
        close(){
            this.log('close');
            this.mirror.classList.remove('active');
            this.onClose();
        }
        toggle(){
            if (this.mirror.classList.contains('active')) 
                this.close();
            else 
                this.open();
        }
        reset(){
            this.log('reset');
            this.mirror.remove();
            this.el.classList.remove('select');
            this.el.removeEventListener('change',this.render);
        }
        onDestroy(){
            this.log('onDestroy');
            this.mirror.remove()
        }
    }
    return Select;
}