odoo.define('pos_order_zip.screen', function (require) {
    'use strict';

    var screens = require('point_of_sale.screens');
    var rpc     = require('web.rpc');
    var core    = require('web.core');
    var _t      = core._t;


/* ---------- The Action Pad ---------- */


    var ActionpadWidget = screens.ActionpadWidget.include({
        init: function (parent, options) {
            this._super(parent, options);
            var self = this;
            if (self.pos.config.partner_id && self.pos.config.module_pos_type === 'ticket') {
                var domain = [['customer', '=', true], ['id', '=', self.pos.config.partner_id[0]]];
                var fields = ['firstname', 'lastname', 'name', 'spouse_name', 'kids_count', 'is_member',
                'street', 'city', 'state_id', 'country_id', 'vat', 'write_date',
                'phone', 'zip', 'mobile', 'email', 'barcode', 'child_ids',
                'property_account_position_id', 'property_product_pricelist', 'type', 'code',
                'domain_product_id', 'membership_ref', 'membership_end_date', 'membership_status'];
                var params = {
                    model : 'res.partner',
                    method: 'read_partner_pos',
                    args: [fields, domain,1,'name']
                };
                var customer = self.pos.db.get_partner_by_id(self.pos.config.partner_id[0]);
                if (!customer) {
                    rpc.query(params).then(function(partner){
                        self.pos.db.add_partners(partner);
                        customer = self.pos.db.get_partner_by_id(self.pos.config.partner_id[0]);
                        self.pos.get_order().set_client(customer);
                    });
                }
                else {
                    self.pos.get_order().set_client(customer);
                }
            }
        },
        renderElement: function() {
            var self = this;
            this._super();
            this.$('.pay').click(function(){
                var order = self.pos.get_order();
                var order_client = self.pos.get_order().get_client();
                var default_client = self.pos.config.partner_id;
                var zipcode = self.pos.get_order().zip_code;
                if (!zipcode) {
                    if (self.pos.config.is_zipcode_required) {
                        self.showScreen('products');
                    }
                }
                if (self.pos.config.module_pos_type === 'ticket') {
                    if (self.pos.config.is_zipcode_required) {
                        self.showPopup('textinput',{
                            'title': _t('Please Verify Zip code'),
                            'confirm': self.set_zip_code,
                            'value': order.zip_code || order_client && order_client.zip,
                        });
                    }
                }
                else {
                    var alcohol_product = _.find(order.orderlines.models, function(o_line) {
                        return o_line.product && o_line.product.product_type === 'alcohol';
                    });
                    if(alcohol_product) {
                        self.showPopup('confirm',{
                            'title': _t('Alcohol Product'),
                            'body':  _t('This transaction contains items only for ages 21 and over. Please Check ID.'),
                            confirm: function(){
                                self.check_valid_product_lot(order);
                            },
                        });
                    } else {
                        self.check_valid_product_lot(order);
                    }
                }
            });
        },
        set_zip_code: function(value){
            var zip_code = value.trim();
            var self = this;
            if (zip_code) {
                rpc.query({
                            model: 'order.zipcode',
                            method: 'search_order_zipcode',
                            args: [zip_code]
                           })
                    .then(function (result) {
                        if (result) {
                            var selectedOrder = self.pos.get_order();
                            selectedOrder.zip_code = zip_code;
                            selectedOrder.trigger('change',selectedOrder);
                            self.showScreen('payment');
                        } else {
                            if (zip_code.length > 10) {
                                self.showPopup('error', {
                                    'title':_t('Zip Code Is Invalid !'),
                                    'body': _t('Zip Code Must Be Nine Digit.'),
                                });
                            } else {
                                self.showPopup('confirm',{
                                    'title': _t('Zipcode Not Verified !'),
                                    'body':  _t('Are You Sure You Want To Set This Zip Code?'),
                                    confirm: function(){
                                        var selectedOrder = self.pos.get_order();
                                        selectedOrder.zip_code = zip_code;
                                        selectedOrder.trigger('change',selectedOrder);
                                        self.showScreen('payment');
                                    }
                                })
                            }
                        }
                    }, function( type, err ){
                        self.showPopup('confirm', {
                            'title': _t('Network Problem:'),
                            'body': _t('Your Internet Connection Is Probably Down. Zip Code Not Verfied. Are You Sure You Want To Set This Zip Code?'),
                            confirm: function(){
                                var selectedOrder = self.pos.get_order();
                                selectedOrder.zip_code = zip_code;
                                selectedOrder.trigger('change',selectedOrder);
                                self.showScreen('payment');
                            }
                        });
                    })
            }
            else {
                self.pos.get_order().zip_code = '';
                self.showScreen('products');
            }
        }
    });

    return {
        ActionpadWidget : ActionpadWidget,
    };

});
