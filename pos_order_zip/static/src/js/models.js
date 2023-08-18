odoo.define('pos_order_zip.models', function (require) {
    'use strict';

    var models   = require('point_of_sale.models');
    var session = require('web.session');
    var rpc = require('web.rpc');
    var core = require('web.core');
    var _t = core._t;
    var utils = require('web.utils');
    var round_di = utils.round_decimals;

    /** LOADING MEMBERSHIP PRODUCT FIELDS */
//    models.load_fields("product.product", ['is_ticket']);

    var _super_posmodel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({

        // loads all the needed data on the sever. returns a deferred indicating when all the data has loaded.
        load_server_data: function(){
            var self = this;
            var loaded = new $.Deferred();
            var progress = 0;
            var progress_step = 1.0 / self.models.length;
            var tmp = {}; // this is used to share a temporary state between models loaders

            function load_model(index){
                if(index >= self.models.length){
                    loaded.resolve();
                }else{
                    var model = self.models[index];
                    self.chrome.loading_message(_t('Loading')+' '+(model.label || model.model || ''), progress);
                    var cond = typeof model.condition === 'function'  ? model.condition(self,tmp) : true;
                    if (!cond) {
                        load_model(index+1);
                        return;
                    }
                    var fields =  typeof model.fields === 'function'  ? model.fields(self,tmp)  : model.fields;
                    var domain =  typeof model.domain === 'function'  ? model.domain(self,tmp)  : model.domain;
                    var context = typeof model.context === 'function' ? model.context(self,tmp) : model.context || {};
                    var ids     = typeof model.ids === 'function'     ? model.ids(self,tmp) : model.ids;
                    var order   = typeof model.order === 'function'   ? model.order(self,tmp):    model.order;
                    progress += progress_step;

                    if( model.model ){
                        var params = {
                            model: model.model,
                            context: _.extend(context, session.user_context || {}),
                        };

                        if (model.ids) {
                            params.method = 'read';
                            params.args = [ids, fields];
                        } else {
                            params.method = 'search_read';
                            params.domain = domain;
                            params.fields = fields;
                            params.orderBy = order;
                        }
                        if (model.model === 'res.partner') {
                            params.method = 'read_partner_pos';
                            domain.push(["customer", "=", true]);
                            domain.push(["parent_id", "=", false]);
                            params.args = [fields, domain, 500, 'write_date desc'];
                        }
                        if (model.model === 'product.product') {
                            params.method = 'load_product_to_pos';
//                            if (self.config.module_pos_type === 'membership') {
//                                domain.push(["recurring_invoice","=",true]);
//                            }
//                            if (self.config.module_pos_type === 'ticket') {
//                                domain.push(["is_ticket","=",true]);
//                            }
                            if (self.config.domain) {
                                var product_domains = JSON.parse(self.config.domain);
                                _.each(product_domains, function(product_domain) {
                                    domain.push(product_domain);
                                });
                                params.args = [fields, domain, 5000];
                            }else {
                                params.args = [fields, domain, 5000];
                            }
                        }
                        rpc.query(params).then(function(result){
                            try{    // catching exceptions in model.loaded(...)
                                $.when(model.loaded(self,result,tmp))
                                    .then(function(){ load_model(index + 1); },
                                          function(err){ loaded.reject(err); });
                            }catch(err){
                                console.error(err.message, err.stack);
                                loaded.reject(err);
                            }
                        },function(err){
                            loaded.reject(err);
                        });
                    }else if( model.loaded ){
                        try{    // catching exceptions in model.loaded(...)
                            $.when(model.loaded(self,tmp))
                                .then(  function(){ load_model(index +1); },
                                        function(err){ loaded.reject(err); });
                        }catch(err){
                            loaded.reject(err);
                        }
                    }else{
                        load_model(index + 1);
                    }
                }
            }

            try{
                load_model(0);
            }catch(err){
                loaded.reject(err);
            }

            return loaded;
        },
    });


    /** -------------------------- ORDER ---------------------------  */

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        initialize: function () {
            _super_order.initialize.apply(this, arguments);
            return this;
        },
        export_as_JSON: function () {
            var json = _super_order.export_as_JSON.apply(this, arguments);
            json.zip_code = this.zip_code;
            return json
        },
        init_from_JSON: function(json) {
            _super_order.init_from_JSON.apply(this, arguments);
            this.zip_code = json.zip_code;
        },
        set_client: function (client) {
            _super_order.set_client.apply(this, arguments);
            var self = this;
            if (this.pos.config.module_pos_type === 'ticket' && client) {
                if (this.pos.config.is_zipcode_required) {
                    if (client.zip) {
                        self.zip_code = client.zip;
                    }
                }
            }
        },
    });

});
