(function($){var keys={ESC:27,TAB:9,RETURN:13,LEFT:37,UP:38,RIGHT:39,DOWN:40};function ProductFilter(el,options){var that=this,defaults={deferRequestBy:1000,products:[],categories:[],controlTips:"",onProductDoubleClick:function(){}};that.element=el;that.el=$(el);that.options=$.extend({},defaults,options);that.product_template='<li class="item" data-product_id="{product-id}" data-product_name="{product-name}" data-category_id="{category-id}">'+'  <div class="img-area">'+'      <img alt="{product-name}" src="{product-imgurl}">'+"  </div>"+'  <p class="title">{product-name}</p>'+"</li>";that.searchTextBox=null;that.searchDropdownlist=null;that.searchResultContainer=null;that.serachLoading=null;that.currSearchText=null;that.productIds={};that.initialize()}ProductFilter.prototype={initialize:function(){var that=this,opts=that.options,container=that.el;container.html('<div class="buttons">'+'    <input type="text" name="search-words" id="search-words" placeholder="input keywords to search" />'+'    <select name="categories" id="categories" class="select"></select>'+"</div>"+'<div class="control-tips">'+opts.controlTips+"</div>"+'<div class="item-container">'+'    <div class="loading-icon" style="display: none;"></div>'+'    <ul class="items"></ul>'+"</div>");that.searchTextBox=$("#search-words",container);that.searchDropdownlist=$("#categories",container);that.searchResultContainer=$("ul.items",container);that.searchLoading=$(".loading-icon",container);that.searchTextBox.on("keyup.productfilter",function(e){that.validateSearchTextChange(e)});that.searchDropdownlist.on("change.productfilter",function(){var searchText=$.trim(that.searchTextBox.val()),categoryId=$(this).val();that.suggest(searchText,categoryId)});$("ul.items",container).on("dblclick.productfilter","li",function(){var li=$(this);delete that.productIds[li.data("product_id")];li.detach();if(opts.onProductDoubleClick){opts.onProductDoubleClick(li)}});that.dataBind()},validateSearchTextChange:function(e){var that=this;switch(e.which){case keys.UP:case keys.DOWN:return}clearInterval(that.onChangeInterval);var searchWord=$.trim(that.searchTextBox.val());if(that.currSearchText!==searchWord){that.searchResultContainer.hide();that.searchLoading.show();if(that.options.deferRequestBy>0){that.onChangeInterval=setInterval(function(){that.onSearchTextChange()},that.options.deferRequestBy)}else{that.onSearchTextChange()}}},onSearchTextChange:function(){var that=this,searchText=$.trim(that.searchTextBox.val()),categoryId=that.searchDropdownlist.val();that.currSearchText=searchText;clearInterval(that.onChangeInterval);that.suggest(searchText,categoryId)},dataBind:function(){var that=this;that._bindCategories();that.bindProducts()},bindProducts:function(new_products){var that=this,opts=that.options,products=[];if(new_products){opts.products=new_products}$.each(opts.products,function(index,product){products.push(that.product_template.replace(/\{product\-name\}/g,product.name).replace(/\{product\-id\}/g,product.id).replace(/\{category\-id\}/g,product.category_id).replace(/\{product\-imgurl\}/g,product.image_url));that.productIds[product.id]=product.name});that.searchResultContainer.html(products.join(""))},_bindCategories:function(){var that=this,opts=that.options,categoryOptions=[];categoryOptions.push('<option value="">All</option>');$.each(opts.categories,function(index,category){categoryOptions.push('<option value="'+category.id+'">'+category.name+"</option>")});that.searchDropdownlist.append(categoryOptions.join(""))},suggest:function(searchText,categoryIdString){var that=this,dataSources=that.searchResultContainer.find("li"),categoryId=parseInt(categoryIdString);dataSources.each(function(index,item){item=$(item);item.show();if(categoryId>0&&item.data("category_id")!==categoryId){item.hide()}else{if(item.data("product_name").toLowerCase().indexOf(searchText.toLowerCase())===-1){item.hide()}}});that.searchResultContainer.show();that.searchLoading.hide()},addProduct:function(item){if(item){this.productIds[$(item).data("product_id")]=$(item).data("product_name");this.searchResultContainer.prepend(item)}},contains:function(product_id){if(this.productIds[product_id]){return true}return false},getCurrentProducts:function(){var products=[];$.each(this.searchResultContainer.find("li"),function(index,li){products.push($(li).data("product_id"))});return products},dispose:function(){this.el.empty().removeData("productfilter")}};function DataProvider(){}DataProvider.prototype={getProducts:function(params,callback){var retailerId=params[0];$.ajax({url:"/admin/guides/retailer_products",data:{retailer_id:retailerId},cache:false,dataType:"json",success:function(items){if(callback){callback(null,items)}},error:function(){callback({code:501,message:"There is network error, check your newwork settings and try it again."})}})}};function ProductPicker(el,options){var that=this,defaults={selectedProducts:[],categories:[],guideId:null,retailerId:null,retailerName:"",onCompleted:function(){}};
that.element=el;that.el=$(el);that.options=$.extend({},defaults,options);that.leftView=null;that.rightView=null;that.retailerControl=null;that.initialize()}ProductPicker.prototype={initialize:function(){var that=this,opts=that.options,container=that.el;container.html("<h2>Manage Products</h3>"+'<div class="retailer"><label>Retailer Name: </label><span>'+opts.retailerName+"</span></div>"+'<div class="products">'+'    <div class="product-area left"></div>'+'    <div class="product-area right"></div>'+"</div>"+'<div class="actions"><button name="button" type="button" id="save-button">Save</button><span id="action-tips"></span></div>');that.retailerControl=$(".retailer",container);that.leftView=new ProductFilter($("div.left",container).get(0),{categories:opts.categories,controlTips:"Double click the below products to add to the current guide:",onProductDoubleClick:function(li){that.rightView.addProduct(li)}});that.rightView=new ProductFilter($("div.right",container).get(0),{products:opts.selectedProducts,categories:opts.categories,controlTips:"Double click the below products to remove from the current guide:",onProductDoubleClick:function(li){that.leftView.addProduct(li)}});$("#save-button",container).on("click.productpicker",function(){that.hideMessage();if(opts.onCompleted){opts.onCompleted(that.rightView.getCurrentProducts())}$.colorbox.close()})},loadData:function(retailerArr){var that=this,dataProvider=new DataProvider();that.leftView.searchLoading.show();dataProvider.getProducts(retailerArr,function(err,products){that.leftView.searchLoading.hide();if(err){window.alert(err.message);return}that.processResponse(products)})},processResponse:function(items){var that=this,available_products=[];$.each(items,function(index,item){if(!that.rightView.contains(item.id)){available_products.push(item)}});that.leftView.bindProducts(available_products)},dispose:function(){this.leftView.dispose();this.rightView.dispose();this.el.empty().removeData("productpicker")}};$.fn.productPicker=function(options,args){var dataKey="productpicker";if(arguments.length===0){return this.first().data(dataKey)}return this.each(function(){var _self=$(this),instance=_self.data(dataKey);if(typeof options==="string"){if(instance&&typeof instance[options]==="function"){instance[options](args)}}else{if(instance&&instance.dispose){instance.dispose()}instance=new ProductPicker(this,options);_self.data(dataKey,instance)}})}})(jQuery);